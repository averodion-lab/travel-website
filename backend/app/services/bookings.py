from __future__ import annotations

import secrets
from datetime import date

from flask import current_app
from sqlalchemy.exc import IntegrityError
from werkzeug.datastructures import FileStorage

from .. import crypto
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingStatus, Camper, Customer, utcnow
from . import availability, email, storage
from .pricing import quote_for_camper

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no look-alike characters

DATES_TAKEN = "Sorry, those dates were just booked. Please choose different dates."


def _new_reference() -> str:
    return "BK-" + "".join(secrets.choice(_ALPHABET) for _ in range(10))


def create_booking(
    *,
    camper: Camper,
    start: date,
    end: date,
    customer: dict,
    license_file: FileStorage | None,
    park=None,
    addons=(),
    transport: str = "self",
    towing_experience: bool = False,
) -> Booking:
    """Create a pending booking that holds the dates until payment.
    `park` and `addons` are already validated catalog objects."""
    quote = quote_for_camper(
        camper, start, end, current_app.config, addons, transport_code=transport, park=park
    )  # validates dates

    availability.expire_stale_pending()
    if not availability.is_available(camper.id, start, end):
        raise ApiError(DATES_TAKEN, 409, "dates_unavailable")

    license_key = storage.save_license(license_file)
    try:
        cust = Customer(
            first_name=customer["first_name"],
            last_name=customer["last_name"],
            encrypted_email=crypto.encrypt_str(customer["email"]),
            encrypted_phone=crypto.encrypt_str(customer["phone"]),
            encrypted_address=crypto.encrypt_str(customer.get("address")),
            encrypted_license_data=crypto.encrypt_str(customer["license_number"]),
            license_file_key=license_key,
        )
        booking = Booking(
            reference=_new_reference(),
            camper=camper,
            customer=cust,
            start_date=start,
            end_date=end,
            days=quote.days,
            daily_rate=quote.daily_rate,
            cleaning_fee=quote.cleaning_fee,
            total_price=quote.total,
            deposit_due=quote.deposit_due,
            security_deposit=quote.security_deposit,
            park=park.slug if park else None,
            addons=[
                {**a, "daily_rate": str(a["daily_rate"]), "total": str(a["total"])} for a in quote.addons
            ],
            addons_total=quote.addons_total,
            transport=transport,
            transport_total=quote.transport["total"],
            towing_experience=towing_experience,
            status=BookingStatus.PENDING,
        )
        db.session.add(booking)
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        storage.delete_license(license_key)
        if "bookings_no_overlap" in str(exc.orig):
            # Someone else's checkout won the race; the database said no.
            raise ApiError(DATES_TAKEN, 409, "dates_unavailable") from None
        raise
    except Exception:
        db.session.rollback()
        storage.delete_license(license_key)
        raise
    return booking


def confirm_booking(booking: Booking) -> bool:
    """Mark a booking as paid and send both emails. Safe to call twice
    (Stripe can deliver the same webhook more than once)."""
    if booking.status in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED):
        return False

    was_cancelled = booking.status == BookingStatus.CANCELLED
    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_at = utcnow()
    booking.cancelled_at = None
    try:
        db.session.commit()
    except IntegrityError:
        # Paid after the hold expired AND the dates were re-booked. Should be
        # impossible (the hold outlives the Stripe session) but never drop it.
        db.session.rollback()
        current_app.logger.error("Payment for expired booking %s; refund needed", booking.reference)
        email.send_owner_alert(
            f"ACTION NEEDED: refund booking {booking.reference}",
            f"A payment arrived for booking {booking.reference} after its dates were "
            "released and re-booked. Please refund the deposit in Stripe and contact "
            "the customer.",
        )
        return False
    if was_cancelled:
        current_app.logger.warning("Revived expired booking %s on payment", booking.reference)

    send_notifications(booking)
    return True


def send_notifications(booking: Booking) -> None:
    """Customer confirmation + owner notification. Only ever called after
    payment is confirmed. A mail failure must not undo the booking."""
    if booking.notified_at is not None:
        return
    ok = True
    for send in (email.send_customer_confirmation, email.send_owner_notification):
        try:
            ok = bool(send(booking)) and ok  # False when email isn't configured
        except Exception as exc:  # noqa: BLE001
            ok = False
            current_app.logger.error(
                "Email %s failed for booking %s: %s", send.__name__, booking.reference, type(exc).__name__
            )
    if ok:
        booking.notified_at = utcnow()
        db.session.commit()


def cancel_booking(booking: Booking) -> None:
    if booking.status == BookingStatus.CANCELLED:
        return
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = utcnow()
    db.session.commit()


def complete_booking(booking: Booking) -> None:
    """Camper returned and inspected. Starts the license-purge countdown."""
    if booking.status != BookingStatus.CONFIRMED:
        raise ApiError("Only confirmed bookings can be marked completed.")
    booking.status = BookingStatus.COMPLETED
    booking.completed_at = utcnow()
    db.session.commit()
