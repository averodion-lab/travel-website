"""Numbers for the owner dashboard: revenue, occupancy, open dates, customers.

Money definitions (the balance is collected by hand at pickup, so the app
can only know about it once the owner marks the booking completed):
  booked      = total of confirmed + completed bookings
  collected   = deposits of confirmed bookings + full total of completed ones
  outstanding = balances of confirmed bookings, due at pickup
"""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from .. import crypto
from ..extensions import db
from ..models import Booking, BookingStatus, Camper, Customer

PAID = (BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
HOLDING = (BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
OCCUPANCY_DAYS = 90
OPEN_WINDOW_DAYS = 180
ZERO = Decimal("0.00")


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01")))


def _brief(b: Booking) -> dict:
    return {
        "id": b.id,
        "reference": b.reference,
        "status": b.status,
        "customer_name": f"{b.customer.first_name} {b.customer.last_name}",
        "start_date": b.start_date.isoformat(),
        "end_date": b.end_date.isoformat(),
        "days": b.days,
        "total_price": str(b.total_price),
        "balance_due": str(b.total_price - b.deposit_due),
    }


def _add_months(first: date, count: int) -> date:
    index = first.year * 12 + first.month - 1 + count
    return date(index // 12, index % 12 + 1, 1)


def _nights_between(b: Booking, start: date, end: date) -> int:
    """Nights of a booking that fall inside [start, end)."""
    return max(0, (min(b.end_date, end) - max(b.start_date, start)).days)


def overview(today: date | None = None) -> dict:
    today = today or date.today()
    bookings = db.session.execute(
        select(Booking).where(Booking.status != BookingStatus.CANCELLED).order_by(Booking.start_date)
    ).scalars().all()
    paid = [b for b in bookings if b.status in PAID]
    confirmed = [b for b in bookings if b.status == BookingStatus.CONFIRMED]
    completed = [b for b in bookings if b.status == BookingStatus.COMPLETED]

    booked = sum((b.total_price for b in paid), ZERO)
    collected = sum((b.deposit_due for b in confirmed), ZERO) + sum((b.total_price for b in completed), ZERO)
    outstanding = sum((b.total_price - b.deposit_due for b in confirmed), ZERO)

    # Twelve months: five behind, the current one, six ahead.
    first = _add_months(today.replace(day=1), -5)
    months = []
    for i in range(12):
        start, end = _add_months(first, i), _add_months(first, i + 1)
        months.append(
            {
                "month": start.strftime("%Y-%m"),
                "revenue": _money(sum((b.total_price for b in paid if start <= b.start_date < end), ZERO)),
                "nights": sum(_nights_between(b, start, end) for b in paid),
                "bookings": sum(1 for b in paid if start <= b.start_date < end),
            }
        )

    horizon = today + timedelta(days=OCCUPANCY_DAYS)
    nights_booked = sum(_nights_between(b, today, horizon) for b in paid)

    min_nights = db.session.execute(
        select(Camper.min_nights).where(Camper.is_active.is_(True)).order_by(Camper.id).limit(1)
    ).scalar() or 1
    windows, cursor, limit = [], today, today + timedelta(days=OPEN_WINDOW_DAYS)
    for b in bookings:  # pending bookings hold their dates too
        if b.end_date <= cursor or b.start_date >= limit:
            continue
        if (b.start_date - cursor).days >= min_nights:
            windows.append((cursor, b.start_date))
        cursor = max(cursor, b.end_date)
    if (limit - cursor).days >= min_nights:
        windows.append((cursor, limit))

    upcoming = [b for b in confirmed if b.start_date > today]
    current = next((b for b in confirmed if b.start_date <= today < b.end_date), None)
    returns = [b for b in confirmed if b.end_date >= today]

    return {
        "today": today.isoformat(),
        "revenue": {
            "booked": _money(booked),
            "collected": _money(collected),
            "outstanding": _money(outstanding),
            "average_booking": _money(booked / len(paid)) if paid else "0.00",
        },
        "counts": {
            "upcoming": len(upcoming),
            "pending": sum(1 for b in bookings if b.status == BookingStatus.PENDING),
            "completed": len(completed),
            "total": len(paid),
        },
        "occupancy": {
            "days": OCCUPANCY_DAYS,
            "nights_booked": nights_booked,
            "percent": round(nights_booked * 100 / OCCUPANCY_DAYS),
        },
        "months": months,
        "open_windows": [
            {"start": s.isoformat(), "end": e.isoformat(), "nights": (e - s).days} for s, e in windows[:6]
        ],
        "open_until": limit.isoformat(),
        "current": _brief(current) if current else None,
        "next_pickup": _brief(upcoming[0]) if upcoming else None,
        "next_return": _brief(min(returns, key=lambda b: b.end_date)) if returns else None,
        "calendar": [
            _brief(b) for b in bookings
            if b.status in HOLDING and b.end_date >= today - timedelta(days=200)
        ],
    }


def customers() -> list[dict]:
    """Everyone who has booked, with decrypted contact details. Admin only."""
    rows = db.session.execute(select(Customer).order_by(Customer.created_at.desc())).scalars().all()
    result = []
    for c in rows:
        paid = [b for b in c.bookings if b.status in PAID]
        if not c.bookings:
            continue
        trips = sorted(c.bookings, key=lambda b: b.start_date)
        result.append(
            {
                "id": c.id,
                "name": f"{c.first_name} {c.last_name}",
                "email": crypto.decrypt_str(c.encrypted_email),
                "phone": crypto.decrypt_str(c.encrypted_phone),
                "bookings": len(paid),
                "total_spent": _money(sum((b.total_price for b in paid), ZERO)),
                "last_trip": trips[-1].start_date.isoformat(),
                "last_status": trips[-1].status,
                "last_booking_id": trips[-1].id,
                "since": c.created_at.date().isoformat(),
            }
        )
    return result
