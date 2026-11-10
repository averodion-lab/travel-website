"""Availability checks. These give friendly answers up front; the database
exclusion constraint (bookings_no_overlap) is what actually guarantees no
double bookings when two people check out at the same moment."""
from __future__ import annotations

from datetime import date, timedelta

from flask import current_app
from sqlalchemy import select, update

from ..extensions import db
from ..models import Booking, BookingStatus, utcnow

BLOCKING = (BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED)


def expire_stale_pending() -> int:
    """Release dates held by bookings that were never paid."""
    cutoff = utcnow() - timedelta(minutes=current_app.config["PENDING_HOLD_MINUTES"])
    result = db.session.execute(
        update(Booking)
        .where(Booking.status == BookingStatus.PENDING, Booking.created_at < cutoff)
        .values(status=BookingStatus.CANCELLED, cancelled_at=utcnow())
    )
    db.session.commit()
    return result.rowcount


def _overlap(start: date, end: date):
    return (Booking.start_date < end) & (Booking.end_date > start)


def is_available(camper_id: int, start: date, end: date) -> bool:
    clash = db.session.execute(
        select(Booking.id)
        .where(Booking.camper_id == camper_id, Booking.status.in_(BLOCKING), _overlap(start, end))
        .limit(1)
    ).first()
    return clash is None


def unavailable_camper_ids(start: date, end: date) -> set[int]:
    rows = db.session.execute(
        select(Booking.camper_id)
        .where(Booking.status.in_(BLOCKING), _overlap(start, end))
        .distinct()
    )
    return {r[0] for r in rows}


def booked_ranges(camper_id: int, from_date: date | None = None) -> list[dict]:
    from_date = from_date or date.today()
    rows = db.session.execute(
        select(Booking.start_date, Booking.end_date)
        .where(
            Booking.camper_id == camper_id,
            Booking.status.in_(BLOCKING),
            Booking.end_date > from_date,
        )
        .order_by(Booking.start_date)
    )
    return [{"start": s.isoformat(), "end": e.isoformat()} for s, e in rows]
