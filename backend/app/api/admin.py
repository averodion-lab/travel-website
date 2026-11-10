"""Owner/admin API. Every route except login requires an admin token.
This is the only place decrypted customer data is ever returned."""
from __future__ import annotations

from functools import wraps
from io import BytesIO

from flask import Blueprint, current_app, g, jsonify, request, send_file
from itsdangerous import BadSignature, URLSafeTimedSerializer
from sqlalchemy import select

from .. import crypto
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingStatus, User
from ..services import availability, bookings as booking_service, reports, storage

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


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


@bp.post("/login")
def login():
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
        "camper": b.camper.name,
        "customer_name": f"{b.customer.first_name} {b.customer.last_name}",
        "start_date": b.start_date.isoformat(),
        "end_date": b.end_date.isoformat(),
        "days": b.days,
        "total_price": str(b.total_price),
        "deposit_due": str(b.deposit_due),
        "balance_due": str(b.total_price - b.deposit_due),
        "created_at": b.created_at.isoformat(),
        "park": b.park_info(),
        "addons": b.addons or [],
        "addons_total": str(b.addons_total or 0),
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
            "emails_sent": b.notified_at is not None,
            "customer": {
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
    key = _get(booking_id).customer.license_file_key
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
    status = (request.get_json(silent=True) or {}).get("status")
    if status == BookingStatus.COMPLETED:
        booking_service.complete_booking(b)
    elif status == BookingStatus.CANCELLED:
        booking_service.cancel_booking(b)
    else:
        raise ApiError("Status can only be changed to completed or cancelled.")
    return jsonify({"booking": _summary(b)})
