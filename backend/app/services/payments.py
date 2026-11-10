"""Stripe Checkout. We never see or store card data."""
from __future__ import annotations

import time

import stripe
from flask import current_app

from ..extensions import db
from ..models import Booking
from . import bookings as booking_service

STRIPE_SESSION_SECONDS = 30 * 60  # Stripe's minimum; shorter than our date hold


def payments_mode() -> str:
    return "stripe" if current_app.config["STRIPE_SECRET_KEY"] else "mock"


def start_checkout(booking: Booking) -> str:
    """Return the URL the customer should be sent to in order to pay."""
    cfg = current_app.config
    confirmation_url = f"{cfg['FRONTEND_URL']}/booking/confirmation?ref={booking.reference}"

    if payments_mode() == "mock":
        # Development only (config.validate refuses this in production).
        current_app.logger.warning("MOCK payment: confirming %s without charging", booking.reference)
        booking_service.confirm_booking(booking)
        return confirmation_url

    session = stripe.checkout.Session.create(
        api_key=cfg["STRIPE_SECRET_KEY"],
        mode="payment",
        client_reference_id=booking.reference,
        metadata={"booking_reference": booking.reference},
        expires_at=int(time.time()) + STRIPE_SESSION_SECONDS,
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(booking.deposit_due * 100),
                    "product_data": {
                        "name": f"Booking deposit: {booking.camper.name}",
                        "description": (
                            f"{booking.start_date:%b %-d, %Y} to {booking.end_date:%b %-d, %Y} "
                            f"({booking.days} nights). Booking {booking.reference}."
                        ),
                    },
                },
            }
        ],
        success_url=confirmation_url,
        cancel_url=f"{cfg['FRONTEND_URL']}/fleet/{booking.camper.slug}?cancelled=1",
    )
    booking.stripe_session_id = session.id
    db.session.commit()
    return session.url


def parse_webhook(payload: bytes, signature: str | None):
    """Verify the Stripe signature; raises if it doesn't match."""
    return stripe.Webhook.construct_event(
        payload, signature or "", current_app.config["STRIPE_WEBHOOK_SECRET"]
    )
