from __future__ import annotations

import stripe
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from ..errors import ApiError
from ..extensions import db
from ..models import Booking, BookingStatus
from ..services import bookings as booking_service, payments

bp = Blueprint("webhooks", __name__, url_prefix="/api/webhooks")


@bp.post("/stripe")
def stripe_webhook():
    if not current_app.config["STRIPE_WEBHOOK_SECRET"]:
        raise ApiError("Stripe webhooks are not configured.", 503)
    try:
        event = payments.parse_webhook(request.get_data(), request.headers.get("Stripe-Signature"))
    except (ValueError, stripe.SignatureVerificationError):
        raise ApiError("Invalid signature.", 400) from None

    event_type = event["type"]
    if event_type not in (
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.expired",
    ):
        return jsonify({"received": True})

    session = event["data"]["object"]
    booking = db.session.execute(
        select(Booking).where(Booking.reference == session["client_reference_id"])
    ).scalar_one_or_none()
    if booking is None:
        current_app.logger.error("Stripe event %s for unknown booking", event_type)
        return jsonify({"received": True})

    if event_type == "checkout.session.expired":
        if booking.status == BookingStatus.PENDING:
            booking_service.cancel_booking(booking)
    elif session["payment_status"] == "paid":
        booking_service.confirm_booking(booking)

    return jsonify({"received": True})
