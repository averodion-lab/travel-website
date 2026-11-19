from __future__ import annotations

import secrets
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import current_app
from sqlalchemy.exc import IntegrityError
from werkzeug.datastructures import FileStorage

from .. import crypto
from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingKind, BookingStatus, Camper, Customer, utcnow
from . import availability, email, storage
from .pricing import quote_for_camper

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no look-alike characters

DATES_TAKEN = "Sorry, those dates were just booked. Please choose different dates."


def _new_reference() -> str:
    return "BK-" + "".join(secrets.choice(_ALPHABET) for _ in range(10))


def _encrypt_place(park) -> str | None:
    """A typed destination may be a private address, so it is stored encrypted."""
    import json

    from ..catalog import Place
    from ..crypto import encrypt_str

    if not isinstance(park, Place):
        return None
    return encrypt_str(json.dumps({"name": park.name, "lat": park.lat, "lng": park.lng}))


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
        booking = _booking_from_quote(quote, camper, _new_customer(customer, license_key), start, end, park, transport)
        booking.towing_experience = towing_experience
        booking.status = BookingStatus.PENDING
        _save(booking)
    except Exception:
        storage.delete_license(license_key)
        raise
    return booking


def _new_customer(data: dict, license_key: str | None = None) -> Customer:
    return Customer(
        first_name=data["first_name"],
        last_name=data["last_name"],
        encrypted_email=crypto.encrypt_str(data.get("email")),
        encrypted_phone=crypto.encrypt_str(data["phone"]),
        encrypted_address=crypto.encrypt_str(data.get("address")),
        encrypted_license_data=crypto.encrypt_str(data.get("license_number")),
        license_file_key=license_key,
    )


def _booking_from_quote(quote, camper, customer, start, end, park, transport) -> Booking:
    return Booking(
        reference=_new_reference(),
        camper=camper,
        customer=customer,
        start_date=start,
        end_date=end,
        days=quote.days,
        daily_rate=quote.daily_rate,
        cleaning_fee=quote.cleaning_fee,
        total_price=quote.total,
        deposit_due=quote.deposit_due,
        security_deposit=quote.security_deposit,
        park=park.slug if park else None,
        delivery_miles=park.delivery_miles if (park and transport == "delivery") else None,
        encrypted_place=_encrypt_place(park),
        addons=[{**a, "daily_rate": str(a["daily_rate"]), "total": str(a["total"])} for a in quote.addons],
        addons_total=quote.addons_total,
        transport=transport,
        transport_total=quote.transport["total"],
    )


def _save(booking: Booking) -> None:
    """Commit; the database's no-overlap rule turns a race into a friendly 409."""
    db.session.add(booking)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        if "bookings_no_overlap" in str(exc.orig):
            # Someone else's checkout won the race; the database said no.
            raise ApiError(DATES_TAKEN, 409, "dates_unavailable") from None
        raise
    except Exception:
        db.session.rollback()
        raise


def _money(value, label: str) -> Decimal:
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        raise ApiError(f"{label} must be an amount in dollars.") from None
    if not amount.is_finite() or amount < 0:
        raise ApiError(f"{label} can't be negative.")
    return amount


OWNER_TAKEN = "Those dates overlap another booking or block."


def create_block(*, camper: Camper, start: date, end: date, note: str | None) -> Booking:
    """Dates the owner keeps for personal use or maintenance. Held like a
    confirmed booking (so the no-overlap rule covers it) but with no customer
    and no money. The minimum stay doesn't apply."""
    if end <= start:
        raise ApiError("The last day must be after the first day.")
    if end <= date.today():
        raise ApiError("Those dates are already in the past.")
    availability.expire_stale_pending()
    if not availability.is_available(camper.id, start, end):
        raise ApiError(OWNER_TAKEN, 409, "dates_unavailable")
    zero = Decimal("0.00")
    booking = Booking(
        reference="BL-" + "".join(secrets.choice(_ALPHABET) for _ in range(10)),
        kind=BookingKind.BLOCK,
        camper=camper,
        customer=None,
        start_date=start,
        end_date=end,
        days=(end - start).days,
        daily_rate=zero,
        cleaning_fee=zero,
        total_price=zero,
        deposit_due=zero,
        security_deposit=zero,
        status=BookingStatus.CONFIRMED,
        confirmed_at=utcnow(),
        encrypted_note=crypto.encrypt_str(note),
    )
    try:
        _save(booking)
    except ApiError as exc:
        if exc.status == 409:
            raise ApiError(OWNER_TAKEN, 409, "dates_unavailable") from None
        raise
    return booking


def create_phone_booking(
    *,
    camper: Camper,
    start: date,
    end: date,
    customer: dict,
    park=None,
    addons=(),
    transport: str = "self",
    towing_experience: bool = False,
    amount_paid,
    total_override=None,
    note: str | None = None,
    send_email: bool = False,
) -> Booking:
    """A booking the owner took by phone. Priced by the same rules as online
    bookings (unless the owner sets a price and says why), confirmed straight
    away. `deposit_due` holds what the guest has paid so far, so the balance
    shows the same way as for online bookings."""
    quote = quote_for_camper(
        camper, start, end, current_app.config, addons, transport_code=transport, park=park
    )
    total = quote.total
    if total_override not in (None, ""):
        total = _money(total_override, "The price")
        if not note:
            raise ApiError("Please add a note saying why the price differs from the usual one.")
    paid = _money(amount_paid or 0, "The amount paid")
    if paid > total:
        raise ApiError("The amount paid can't be more than the total.")

    availability.expire_stale_pending()
    if not availability.is_available(camper.id, start, end):
        raise ApiError(OWNER_TAKEN, 409, "dates_unavailable")

    booking = _booking_from_quote(quote, camper, _new_customer(customer), start, end, park, transport)
    booking.kind = BookingKind.PHONE
    booking.total_price = total
    booking.deposit_due = paid
    booking.towing_experience = towing_experience
    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_at = utcnow()
    booking.encrypted_note = crypto.encrypt_str(note)
    try:
        _save(booking)
    except ApiError as exc:
        if exc.status == 409:
            raise ApiError(OWNER_TAKEN, 409, "dates_unavailable") from None
        raise

    if send_email and customer.get("email"):
        try:
            if email.send_customer_confirmation(booking):
                booking.notified_at = utcnow()
                db.session.commit()
        except Exception as exc:  # noqa: BLE001
            current_app.logger.error("Email failed for booking %s: %s", booking.reference, type(exc).__name__)
    return booking


def set_amount_paid(booking: Booking, value) -> None:
    if booking.kind != BookingKind.PHONE:
        raise ApiError("The amount paid can only be changed on bookings taken by phone.")
    paid = _money(value, "The amount paid")
    if paid > booking.total_price:
        raise ApiError("The amount paid can't be more than the total.")
    booking.deposit_due = paid
    db.session.commit()


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
    if booking.kind == BookingKind.BLOCK:
        raise ApiError("Blocked dates can only be removed, not completed.")
    if booking.status != BookingStatus.CONFIRMED:
        raise ApiError("Only confirmed bookings can be marked completed.")
    booking.status = BookingStatus.COMPLETED
    booking.completed_at = utcnow()
    db.session.commit()
