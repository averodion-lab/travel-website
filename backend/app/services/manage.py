"""Guests managing their own booking: cancel, or change the dates, free of
charge up to 24 hours before pickup (catalog.FREE_CHANGE_HOURS). The guest
proves it's theirs with the booking number and the email they booked with."""
from __future__ import annotations

import hmac
from datetime import date

from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .. import catalog, crypto
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingStatus, utcnow
from . import availability, email, payments
from .bookings import DATES_TAKEN
from .pricing import quote_for_camper

NOT_FOUND = "We couldn't find a booking with that number and email. Please check both."
TOO_LATE = (
    "Free cancellation and date changes end 24 hours before pickup. Please contact us and we'll see what we can do."
)


def find_for_guest(reference: str, email_address: str) -> Booking:
    reference = (reference or "").strip().upper()
    given = (email_address or "").strip().lower()
    b = db.session.execute(select(Booking).where(Booking.reference == reference)).scalar_one_or_none()
    if b is None or not given:
        raise ApiError(NOT_FOUND, 404)
    stored = (crypto.decrypt_str(b.customer.encrypted_email) or "").strip().lower()
    if not hmac.compare_digest(stored.encode(), given.encode()):
        raise ApiError(NOT_FOUND, 404)
    return b


def can_change(b: Booking, today: date | None = None) -> bool:
    today = today or date.today()
    return b.status == BookingStatus.CONFIRMED and today <= b.free_change_until()


def _require_changeable(b: Booking) -> None:
    if b.status != BookingStatus.CONFIRMED:
        raise ApiError(f"This booking is {b.status}, so it can't be changed online.")
    if not can_change(b):
        raise ApiError(TOO_LATE)


def cancel(b: Booking) -> None:
    _require_changeable(b)
    b.status = BookingStatus.CANCELLED
    b.cancelled_at = utcnow()
    db.session.commit()
    refunded = payments.refund_deposit(b)
    email.send_cancellation(b, refunded)


def _place_for(b: Booking):
    """The park (or typed place) the booking was priced with."""
    if b.park == catalog.CUSTOM_SLUG:
        details = b.place_details() or {}
        return catalog.Place(
            name=details.get("name", "Your place"),
            lat=float(details.get("lat", 0)),
            lng=float(details.get("lng", 0)),
            delivery_miles=b.delivery_miles or 0,
        )
    return catalog.PARKS.get(b.park or "")


def _choices_for(b: Booking) -> list[catalog.AddonChoice]:
    return [
        catalog.AddonChoice(catalog.ADDONS[a["code"]], int(a.get("qty", 1)))
        for a in (b.addons or [])
        if a.get("code") in catalog.ADDONS
    ]


def change_dates(b: Booking, start: date, end: date) -> None:
    """Move the booking to new dates, repriced with the same campground,
    extras and transport. The deposit already paid stays; the balance due at
    pickup absorbs any difference."""
    _require_changeable(b)
    park = _place_for(b)
    quote = quote_for_camper(
        b.camper, start, end, current_app.config, _choices_for(b), transport_code=b.transport, park=park
    )  # validates the dates and the minimum stay
    availability.expire_stale_pending()
    clash = db.session.execute(
        select(Booking.id).where(
            Booking.camper_id == b.camper_id,
            Booking.id != b.id,
            Booking.status.in_(availability.BLOCKING),
            Booking.start_date < end,
            Booking.end_date > start,
        )
    ).first()
    if clash:
        raise ApiError(DATES_TAKEN, 409, "dates_unavailable")
    old = (b.start_date, b.end_date)
    b.start_date, b.end_date, b.days = start, end, quote.days
    b.daily_rate = quote.daily_rate
    b.total_price = quote.total
    b.addons = [{**a, "daily_rate": str(a["daily_rate"]), "total": str(a["total"])} for a in quote.addons]
    b.addons_total = quote.addons_total
    b.transport_total = quote.transport["total"]
    try:
        db.session.commit()
    except IntegrityError:  # the database's own double-booking guard
        db.session.rollback()
        raise ApiError(DATES_TAKEN, 409, "dates_unavailable") from None
    email.send_date_change(b, old)
