"""Guests managing their own booking. The guest proves it's theirs with the
booking number and the email they booked with.

- Change dates: free up to 24 hours before pickup (catalog.FREE_CHANGE_HOURS).
- Cancel: free for 24 hours after payment (catalog.FREE_CANCEL_HOURS); after
  that the paid deposit is refunded by days left (catalog.CANCEL_REFUNDS):
  14+ days 100%, 7 to 13 days 50%, under 7 days none. Online up to the day
  before pickup; on pickup day guests contact us."""
from __future__ import annotations

import hmac
from datetime import date, datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .. import catalog, crypto
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingKind, BookingStatus, utcnow
from . import availability, email, payments
from .bookings import DATES_TAKEN
from .pricing import quote_for_camper

BY_PHONE = "This booking was made by phone, so please call or email us to change or cancel it."
NOT_FOUND = "We couldn't find a booking with that number and email. Please check both."
TOO_LATE = "Date changes online end 24 hours before pickup. Please contact us and we'll see what we can do."
TOO_LATE_CANCEL = "Your trip starts today, so please contact us to cancel."


def find_for_guest(reference: str, email_address: str) -> Booking:
    reference = (reference or "").strip().upper()
    given = (email_address or "").strip().lower()
    b = db.session.execute(select(Booking).where(Booking.reference == reference)).scalar_one_or_none()
    if b is None or b.customer is None or not given:  # blocks have no customer
        raise ApiError(NOT_FOUND, 404)
    stored = (crypto.decrypt_str(b.customer.encrypted_email) or "").strip().lower()
    if not stored or not hmac.compare_digest(stored.encode(), given.encode()):
        raise ApiError(NOT_FOUND, 404)
    if b.kind == BookingKind.PHONE:
        raise ApiError(BY_PHONE, 409, "by_phone")
    return b


def can_change(b: Booking, today: date | None = None) -> bool:
    today = today or date.today()
    return b.status == BookingStatus.CONFIRMED and today <= b.free_change_until()


def can_cancel(b: Booking, today: date | None = None) -> bool:
    today = today or date.today()
    return b.status == BookingStatus.CONFIRMED and today < b.start_date


def cancel_terms(b: Booking, now: datetime | None = None) -> dict:
    """What cancelling now would refund: {percent, refund, reason}."""
    now = now or datetime.now(timezone.utc)
    if now <= b.free_cancel_until():
        percent, reason = 100, "within 24 hours of payment"
    else:
        days_left = (b.start_date - now.date()).days
        percent = next(p for min_days, p in catalog.CANCEL_REFUNDS if days_left >= min_days)
        reason = (
            "14 or more days before pickup"
            if percent == 100
            else "7 to 13 days before pickup"
            if percent == 50
            else "less than 7 days before pickup"
        )
    refund = (Decimal(b.deposit_due) * percent / 100).quantize(Decimal("0.01"), ROUND_HALF_UP)
    return {"percent": percent, "refund": refund, "reason": reason}


def _require_changeable(b: Booking) -> None:
    if b.status != BookingStatus.CONFIRMED:
        raise ApiError(f"This booking is {b.status}, so it can't be changed online.")
    if not can_change(b):
        raise ApiError(TOO_LATE)


def cancel(b: Booking) -> None:
    if b.status != BookingStatus.CONFIRMED:
        raise ApiError(f"This booking is {b.status}, so it can't be cancelled online.")
    if not can_cancel(b):
        raise ApiError(TOO_LATE_CANCEL)
    terms = cancel_terms(b)
    b.status = BookingStatus.CANCELLED
    b.cancelled_at = utcnow()
    b.refunded_amount = terms["refund"]
    db.session.commit()
    refunded = payments.refund_deposit(b, terms["refund"])
    email.send_cancellation(b, refunded, terms)


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
