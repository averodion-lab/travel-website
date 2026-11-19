"""Owner/admin API. Every route except login requires an admin token.
This is the only place decrypted customer data is ever returned."""
from __future__ import annotations

import re
from datetime import date
from functools import wraps
from io import BytesIO

from flask import Blueprint, current_app, g, jsonify, request, send_file
from itsdangerous import BadSignature, URLSafeTimedSerializer
from sqlalchemy import select

from .. import catalog, crypto
from ..errors import ApiError
from ..ratelimit import RateLimit
from ..extensions import db
from ..models import Booking, BookingKind, BookingStatus, Camper, User
from ..services import availability, bookings as booking_service, reports, storage

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="admin-token")


def admin_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            raise ApiError("Sign in required.", 401)
        try:
            data = _serializer().loads(
                header[7:], max_age=current_app.config["ADMIN_TOKEN_MAX_AGE"]
            )
        except BadSignature:  # includes expired tokens
            raise ApiError("Session expired. Please sign in again.", 401) from None
        user = db.session.get(User, data.get("uid"))
        if user is None or not user.is_active or user.role != "admin":
            raise ApiError("Not authorized.", 403)
        g.user = user
        return view(*args, **kwargs)

    return wrapper


# Password guesses per visitor address per 15 minutes.
LOGIN_LIMIT = RateLimit(10, 900, "Too many sign-in attempts. Please wait 15 minutes and try again.")


@bp.post("/login")
def login():
    LOGIN_LIMIT.check()
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not user.is_active or not user.check_password(password):
        raise ApiError("Incorrect email or password.", 401)
    return jsonify({"token": _serializer().dumps({"uid": user.id}), "email": user.email})


def _summary(b: Booking) -> dict:
    return {
        "id": b.id,
        "reference": b.reference,
        "status": b.status,
        "kind": b.kind,
        "note": b.note(),
        "camper": b.camper.name,
        "customer_name": f"{b.customer.first_name} {b.customer.last_name}" if b.customer else "Blocked",
        "start_date": b.start_date.isoformat(),
        "end_date": b.end_date.isoformat(),
        "days": b.days,
        "total_price": str(b.total_price),
        "deposit_due": str(b.deposit_due),
        "balance_due": str(b.total_price - b.deposit_due),
        "created_at": b.created_at.isoformat(),
        "park": b.park_info(),
        "place": b.place_details(),
        "addons": b.addons or [],
        "addons_total": str(b.addons_total or 0),
        "free_change_until": b.free_change_until().isoformat(),
        "transport": b.transport_info(),
        "towing_experience": bool(b.towing_experience),
        "refunded_amount": str(b.refunded_amount) if b.refunded_amount is not None else None,
        "emails_sent": b.notified_at is not None,
    }


def _get(booking_id: int) -> Booking:
    booking = db.session.get(Booking, booking_id)
    if booking is None:
        raise ApiError("Booking not found.", 404)
    return booking


@bp.get("/overview")
@admin_required
def overview():
    """Dashboard numbers: revenue, occupancy, open dates, calendar."""
    availability.expire_stale_pending()
    return jsonify(reports.overview())


@bp.get("/customers")
@admin_required
def list_customers():
    return jsonify({"customers": reports.customers()})


@bp.get("/bookings")
@admin_required
def list_bookings():
    availability.expire_stale_pending()
    q = select(Booking).order_by(Booking.created_at.desc())
    status = request.args.get("status")
    if status:
        if status not in BookingStatus.ALL:
            raise ApiError("Invalid status.")
        q = q.where(Booking.status == status)
    rows = db.session.execute(q.limit(500)).scalars().all()
    return jsonify({"bookings": [_summary(b) for b in rows]})


@bp.get("/bookings/<int:booking_id>")
@admin_required
def booking_detail(booking_id: int):
    b = _get(booking_id)
    c = b.customer
    detail = _summary(b)
    detail.update(
        {
            "security_deposit": str(b.security_deposit),
            "daily_rate": str(b.daily_rate),
            "cleaning_fee": str(b.cleaning_fee),
            "customer": None if c is None else {
                "first_name": c.first_name,
                "last_name": c.last_name,
                "email": crypto.decrypt_str(c.encrypted_email),
                "phone": crypto.decrypt_str(c.encrypted_phone),
                "address": crypto.decrypt_str(c.encrypted_address),
                "license_number": crypto.decrypt_str(c.encrypted_license_data),
                "has_license_file": bool(c.license_file_key),
                "license_purged": c.license_purged_at is not None,
            },
        }
    )
    return jsonify({"booking": detail})


@bp.get("/bookings/<int:booking_id>/license")
@admin_required
def booking_license(booking_id: int):
    customer = _get(booking_id).customer
    key = customer.license_file_key if customer else None
    if not key:
        raise ApiError("No license file on record (it may have been purged).", 404)
    try:
        data, mimetype = storage.read_license(key)
    except FileNotFoundError:
        raise ApiError("License file is missing from storage.", 404) from None
    response = send_file(BytesIO(data), mimetype=mimetype)
    response.headers["Cache-Control"] = "no-store"
    return response


@bp.patch("/bookings/<int:booking_id>")
@admin_required
def update_booking(booking_id: int):
    b = _get(booking_id)
    data = request.get_json(silent=True) or {}
    if "amount_paid" in data and "status" not in data:
        booking_service.set_amount_paid(b, data["amount_paid"])
        return jsonify({"booking": _summary(b)})
    status = data.get("status")
    if status == BookingStatus.COMPLETED:
        booking_service.complete_booking(b)
    elif status == BookingStatus.CANCELLED:
        booking_service.cancel_booking(b)
    else:
        raise ApiError("Status can only be changed to completed or cancelled.")
    return jsonify({"booking": _summary(b)})


# --- owner tools: blocked dates and bookings taken by phone ---------------


def _date(value, label: str) -> date:
    try:
        return date.fromisoformat(str(value or ""))
    except ValueError:
        raise ApiError(f"Please choose a valid {label} date.") from None


def _text(data: dict, key: str, label: str, max_len: int, required: bool = False) -> str | None:
    value = data.get(key)
    value = str(value).strip() if value is not None else ""
    if required and not value:
        raise ApiError(f"{label} is required.")
    if len(value) > max_len:
        raise ApiError(f"{label} is too long (at most {max_len} characters).")
    return value or None


def _camper(data: dict) -> Camper:
    """The camper named in the request, or the first active one (there is one)."""
    q = select(Camper).where(Camper.is_active.is_(True)).order_by(Camper.id)
    slug = data.get("camper")
    if slug:
        q = q.where(Camper.slug == str(slug))
    camper = db.session.execute(q.limit(1)).scalar_one_or_none()
    if camper is None:
        raise ApiError("Camper not found.", 404)
    return camper


def _flag(value) -> bool:
    return value is True or value in ("1", "true", "on", "yes")


@bp.post("/blocks")
@admin_required
def create_block():
    """Dates the owner keeps for themselves: shown as taken to guests."""
    data = request.get_json(silent=True) or {}
    b = booking_service.create_block(
        camper=_camper(data),
        start=_date(data.get("start"), "first"),
        end=_date(data.get("end"), "last"),
        note=_text(data, "note", "Note", 500),
    )
    return jsonify({"booking": _summary(b)}), 201


@bp.post("/bookings")
@admin_required
def create_phone_booking():
    """A booking the owner took by phone; confirmed straight away."""
    data = request.get_json(silent=True) or {}
    customer = {
        "first_name": _text(data, "first_name", "First name", 80, required=True),
        "last_name": _text(data, "last_name", "Last name", 80, required=True),
        "phone": _text(data, "phone", "Phone number", 40, required=True),
        "email": (_text(data, "email", "Email", 200) or "").lower() or None,
        "address": _text(data, "address", "Address", 300),
        "license_number": _text(data, "license_number", "Driver's license number", 60),
    }
    if customer["email"] and not EMAIL_RE.match(customer["email"]):
        raise ApiError("Please enter a valid email address.")
    if len(re.sub(r"\D", "", customer["phone"])) < 10:
        raise ApiError("Please enter a valid phone number.")

    park_slug = _text(data, "park", "Campground", 60) or ""
    place = None
    if park_slug == catalog.CUSTOM_SLUG:
        raw = data.get("place") if isinstance(data.get("place"), dict) else {}
        place = catalog.custom_place(raw.get("name"), raw.get("lat"), raw.get("lng"))
    addons = data.get("addons") or []
    if isinstance(addons, str):
        addons = [a for a in addons.split(",") if a]
    if not isinstance(addons, list) or not all(isinstance(a, str) for a in addons):
        raise ApiError("Invalid extras.")
    park, addon_objs = catalog.resolve(park_slug, addons, place)
    towing = _flag(data.get("towing_experience"))
    transport = catalog.resolve_transport(_text(data, "transport", "Transport", 20) or "", park, towing, booking=True)

    b = booking_service.create_phone_booking(
        camper=_camper(data),
        start=_date(data.get("start"), "pickup"),
        end=_date(data.get("end"), "return"),
        customer=customer,
        park=park,
        addons=addon_objs,
        transport=transport,
        towing_experience=towing,
        amount_paid=data.get("amount_paid"),
        total_override=data.get("total_override"),
        note=_text(data, "note", "Note", 500),
        send_email=_flag(data.get("send_email")),
    )
    return jsonify({"booking": _summary(b)}), 201
