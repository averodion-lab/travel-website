"""Customer-facing API: fleet, availability, quotes, bookings."""
from __future__ import annotations

import re
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from .. import catalog
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, Camper
from ..services import availability, bookings as booking_service, payments
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
        }
    )


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
    _, addons = catalog.resolve(str(data.get("park") or ""), _addon_codes(data.get("addons")))
    q = quote_for_camper(camper, start, end, current_app.config, addons)
    availability.expire_stale_pending()
    return jsonify(
        {
            "quote": q.to_dict(),
            "available": availability.is_available(camper.id, start, end),
            "deposit_percent": current_app.config["DEPOSIT_PERCENT"],
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

    park, addons = catalog.resolve(
        _clean(form, "park", "Campground", 60, required=False), form.getlist("addons")
    )

    booking = booking_service.create_booking(
        camper=camper,
        start=start,
        end=end,
        park=park,
        addons=addons,
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
