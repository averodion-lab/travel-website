"""Customer-facing API: fleet, availability, quotes, bookings."""
from __future__ import annotations

import re
import time
from collections import defaultdict, deque
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from .. import catalog
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, Camper
from ..services import availability, bookings as booking_service, email as email_service, payments
from ..services.pricing import quote_for_camper

bp = Blueprint("public", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _parse_date(value: str | None, label: str) -> date:
    try:
        return date.fromisoformat(value or "")
    except ValueError:
        raise ApiError(f"Please choose a valid {label} date.") from None


def _get_camper(slug: str) -> Camper:
    camper = db.session.execute(
        select(Camper).where(Camper.slug == slug, Camper.is_active.is_(True))
    ).scalar_one_or_none()
    if camper is None:
        raise ApiError("Camper not found.", 404)
    return camper


def _addon_codes(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise ApiError("Invalid extras.")
    return value


@bp.get("/parks")
def list_parks():
    """Campgrounds we deliver to, with map coordinates and the extras each offers."""
    return jsonify(
        {
            "parks": [p.to_dict() for p in catalog.PARKS.values()],
            "addons": [a.to_dict() for a in catalog.ADDONS.values()],
            "transport": {
                "base": catalog.BASE,
                "truck": catalog.TRUCK.to_dict(),
                "delivery": {"per_mile": str(catalog.DELIVERY_PER_MILE), "trips": catalog.DELIVERY_TRIPS},
            },
        }
    )


@bp.get("/distance")
def distance_to_place():
    """Road miles from our base to a typed place, and what delivery would
    cost, so the booking form can show it before dates are chosen."""
    place = catalog.custom_place("place", request.args.get("lat"), request.args.get("lng"))
    total = (catalog.DELIVERY_PER_MILE * place.delivery_miles * catalog.DELIVERY_TRIPS).quantize(Decimal("0.01"))
    return jsonify({"delivery_miles": place.delivery_miles, "delivery_total": str(total)})


@bp.get("/health")
def health():
    return jsonify({"ok": True})


@bp.get("/campers")
def list_campers():
    q = select(Camper).where(Camper.is_active.is_(True))
    args = request.args
    try:
        if args.get("class_type"):
            q = q.where(Camper.class_type == args["class_type"])
        if args.get("sleeps"):
            q = q.where(Camper.sleeps >= int(args["sleeps"]))
        if args.get("max_price"):
            q = q.where(Camper.daily_rate <= Decimal(args["max_price"]))
        if args.get("max_tow"):
            # Motorized campers (no towing weight) always pass this filter.
            q = q.where(
                (Camper.towing_weight_lbs.is_(None))
                | (Camper.towing_weight_lbs <= int(args["max_tow"]))
            )
        if args.get("featured"):
            q = q.where(Camper.featured.is_(True))
    except (ValueError, InvalidOperation):
        raise ApiError("Invalid filter value.") from None

    campers = db.session.execute(q.order_by(Camper.featured.desc(), Camper.daily_rate)).scalars().all()

    if args.get("start") and args.get("end"):
        start = _parse_date(args["start"], "pickup")
        end = _parse_date(args["end"], "return")
        if end <= start:
            raise ApiError("Return date must be after the pickup date.")
        availability.expire_stale_pending()
        taken = availability.unavailable_camper_ids(start, end)
        campers = [c for c in campers if c.id not in taken and (end - start).days >= c.min_nights]

    return jsonify({"campers": [c.to_dict() for c in campers]})


@bp.get("/campers/<slug>")
def get_camper(slug: str):
    return jsonify({"camper": _get_camper(slug).to_dict()})


@bp.get("/campers/<slug>/availability")
def camper_availability(slug: str):
    camper = _get_camper(slug)
    availability.expire_stale_pending()
    return jsonify({"booked": availability.booked_ranges(camper.id)})


@bp.post("/quote")
def quote():
    data = request.get_json(silent=True) or {}
    camper = _get_camper(str(data.get("camper", "")))
    start = _parse_date(data.get("start"), "pickup")
    end = _parse_date(data.get("end"), "return")
    park_slug = str(data.get("park") or "")
    place = None
    if park_slug == catalog.CUSTOM_SLUG:
        raw = data.get("place") if isinstance(data.get("place"), dict) else {}
        place = catalog.custom_place(raw.get("name"), raw.get("lat"), raw.get("lng"))
    park, addons = catalog.resolve(park_slug, _addon_codes(data.get("addons")), place)
    transport = catalog.resolve_transport(
        str(data.get("transport") or ""), park, data.get("towing_experience") is True
    )
    q = quote_for_camper(camper, start, end, current_app.config, addons, transport_code=transport, park=park)
    availability.expire_stale_pending()
    return jsonify(
        {
            "quote": q.to_dict(),
            "available": availability.is_available(camper.id, start, end),
            "deposit_percent": current_app.config["DEPOSIT_PERCENT"],
            # For a typed place: the server-measured road miles from our base.
            "place": {"name": place.name, "delivery_miles": place.delivery_miles} if place else None,
        }
    )


def _clean(form, field: str, label: str, max_len: int, required: bool = True) -> str:
    value = (form.get(field) or "").strip()
    if required and not value:
        raise ApiError(f"{label} is required.")
    if len(value) > max_len:
        raise ApiError(f"{label} is too long.")
    return value


@bp.post("/bookings")
def create_booking():
    """multipart/form-data: camper, start, end, customer fields, license file.
    Any price sent by the client is ignored; we compute it here."""
    form = request.form
    camper = _get_camper(_clean(form, "camper", "Camper", 80))
    start = _parse_date(form.get("start"), "pickup")
    end = _parse_date(form.get("end"), "return")

    customer = {
        "first_name": _clean(form, "first_name", "First name", 80),
        "last_name": _clean(form, "last_name", "Last name", 80),
        "email": _clean(form, "email", "Email", 200).lower(),
        "phone": _clean(form, "phone", "Phone number", 40),
        "address": _clean(form, "address", "Address", 300, required=False),
        "license_number": _clean(form, "license_number", "Driver's license number", 60),
    }
    if not EMAIL_RE.match(customer["email"]):
        raise ApiError("Please enter a valid email address.")
    if len(re.sub(r"\D", "", customer["phone"])) < 10:
        raise ApiError("Please enter a valid phone number.")
    if form.get("agree_terms") not in ("1", "true", "on", "yes"):
        raise ApiError("Please accept the rental terms to continue.")

    park_slug = _clean(form, "park", "Campground", 60, required=False)
    place = None
    if park_slug == catalog.CUSTOM_SLUG:
        place = catalog.custom_place(form.get("place_name"), form.get("place_lat"), form.get("place_lng"))
    park, addons = catalog.resolve(park_slug, form.getlist("addons"), place)
    towing_experience = form.get("towing_experience") in ("1", "true", "on", "yes")
    transport = catalog.resolve_transport(
        _clean(form, "transport", "Transport", 20, required=False), park, towing_experience
    )

    booking = booking_service.create_booking(
        camper=camper,
        start=start,
        end=end,
        park=park,
        addons=addons,
        transport=transport,
        towing_experience=towing_experience,
        customer=customer,
        license_file=request.files.get("license"),
    )
    checkout_url = payments.start_checkout(booking)
    return jsonify({"reference": booking.reference, "checkout_url": checkout_url}), 201


@bp.get("/bookings/<reference>")
def get_booking(reference: str):
    """Confirmation page lookup by the (unguessable) booking number.
    Returns no contact details."""
    booking = db.session.execute(
        select(Booking).where(Booking.reference == reference.upper())
    ).scalar_one_or_none()
    if booking is None:
        raise ApiError("Booking not found.", 404)
    return jsonify({"booking": booking.public_dict()})


# Contact form: at most 5 messages per visitor address per hour (in memory;
# each server instance counts on its own, which is enough to stop floods).
CONTACT_LIMIT = 5
CONTACT_WINDOW = 3600
_contact_hits: dict[str, deque] = defaultdict(deque)


def _text(data: dict, key: str, label: str, max_len: int, required: bool = True) -> str:
    value = data.get(key)
    value = value.strip() if isinstance(value, str) else ""
    if required and not value:
        raise ApiError(f"Please enter your {label}.")
    if len(value) > max_len:
        raise ApiError(f"Your {label} is too long (at most {max_len} characters).")
    return value


@bp.post("/contact")
def contact():
    """Send a message to the owner by email. Nothing is stored or logged."""
    data = request.get_json(silent=True) or {}
    # Hidden field that people never see; bots fill it in. Pretend it worked.
    if str(data.get("website") or "").strip():
        return jsonify({"ok": True})

    name = _text(data, "name", "name", 120)
    email = _text(data, "email", "email", 200)
    if not EMAIL_RE.match(email):
        raise ApiError("Please enter a valid email address.")
    phone = _text(data, "phone", "phone number", 40, required=False)
    dates = _text(data, "dates", "dates", 120, required=False)
    message = _text(data, "message", "message", 4000)

    who = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    now = time.monotonic()
    hits = _contact_hits[who]
    while hits and now - hits[0] > CONTACT_WINDOW:
        hits.popleft()
    if len(hits) >= CONTACT_LIMIT:
        raise ApiError("You've sent several messages already. Please wait a little, or email us directly.", 429)
    hits.append(now)

    email_service.send_contact_message(name, email, phone, dates, message)
    return jsonify({"ok": True})
