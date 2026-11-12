"""Outgoing email through Gmail SMTP (app password)."""
from __future__ import annotations
from decimal import Decimal

import smtplib
from email.message import EmailMessage

from flask import current_app

from .. import crypto
from ..models import Booking


def send_email(to: str, subject: str, body: str, reply_to: str | None = None) -> bool:
    cfg = current_app.config
    if not (cfg["SMTP_USERNAME"] and cfg["SMTP_PASSWORD"]):
        # Development without Gmail credentials. Log the subject only — never
        # the recipient or body, which contain personal data.
        current_app.logger.warning("SMTP not configured; email skipped: %s", subject)
        return False
    msg = EmailMessage()
    msg["From"] = f"{cfg['SITE_NAME']} <{cfg['EMAIL_FROM']}>"
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)
    with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=20) as smtp:
        smtp.starttls()
        smtp.login(cfg["SMTP_USERNAME"], cfg["SMTP_PASSWORD"])
        smtp.send_message(msg)
    return True


def _money(value) -> str:
    return f"${value:,.2f}"


def _dates(b: Booking) -> str:
    fmt = "%a, %b %-d, %Y"
    return f"{b.start_date.strftime(fmt)} to {b.end_date.strftime(fmt)} ({b.days} nights)"


def _trip(b: Booking) -> str:
    """Campground and extras lines, shared by both emails."""
    park = b.park_info()
    place = b.place_details()
    if place:
        lines = [
            f"Campground: {place['name']} (typed in by the guest; map: "
            f"https://www.google.com/maps?q={place['lat']},{place['lng']})"
        ]
    else:
        lines = [f"Campground: {park['name'] if park else 'Not chosen yet'}"]
    for a in b.addons or []:
        lines.append(f"Extra: {a['name']}, {a['days']} days, {_money(Decimal(a['total']))}")
    t = b.transport_info()
    getting_there = t["name"]
    if t["code"] == "delivery" and t.get("miles"):
        getting_there += f" ({t['miles']} miles from our base)"
    if t["code"] != "self":
        getting_there += f", {_money(Decimal(t['total']))}"
    if t["code"] == "truck":
        getting_there += " (driver confirmed towing experience)"
    lines.append(f"Getting there: {getting_there}")
    return "\n".join(lines)


def send_customer_confirmation(b: Booking) -> bool:
    cfg = current_app.config
    site = cfg["SITE_NAME"]
    body = f"""Hi {b.customer.first_name},

Your booking is confirmed. Here are the details:

Booking number: {b.reference}
Camper: {b.camper.name}
Dates: {_dates(b)}
{_trip(b)}

Rental total: {_money(b.total_price)}
Deposit paid today: {_money(b.deposit_due)}
Balance due at pickup: {_money(b.total_price - b.deposit_due)}
Refundable security deposit (held at pickup): {_money(b.security_deposit)}

View your booking: {cfg['FRONTEND_URL']}/booking/confirmation?ref={b.reference}

We'll be in touch before your trip with pickup instructions. If you have any
questions, just reply to this email.

See you on the road,
{site}
"""
    return send_email(
        crypto.decrypt_str(b.customer.encrypted_email),
        f"Your {site} booking is confirmed ({b.reference})",
        body,
    )


def send_owner_notification(b: Booking) -> bool:
    cfg = current_app.config
    if not cfg["OWNER_EMAIL"]:
        current_app.logger.warning("OWNER_EMAIL not set; owner notification skipped")
        return False
    # Deliberately light on personal data: contact details stay in the admin page.
    body = f"""New paid booking.

Booking number: {b.reference}
Customer: {b.customer.first_name} {b.customer.last_name}
Camper: {b.camper.name}
Dates: {_dates(b)}
{_trip(b)}

Rental total: {_money(b.total_price)}
Deposit paid: {_money(b.deposit_due)}
Balance due at pickup: {_money(b.total_price - b.deposit_due)}

Customer contact details and license: {cfg['FRONTEND_URL']}/admin
"""
    return send_email(
        cfg["OWNER_EMAIL"],
        f"New booking {b.reference}: {b.camper.name}, {b.start_date:%b %-d} to {b.end_date:%b %-d}",
        body,
    )


def send_owner_alert(subject: str, body: str) -> bool:
    cfg = current_app.config
    if not cfg["OWNER_EMAIL"]:
        return False
    return send_email(cfg["OWNER_EMAIL"], subject, body)


def send_contact_message(name: str, email: str, phone: str, dates: str, message: str) -> bool:
    """A message from the contact form, sent to the owner. Replying to the
    email answers the guest directly. Nothing is stored."""
    cfg = current_app.config
    if not cfg["OWNER_EMAIL"]:
        current_app.logger.warning("OWNER_EMAIL not set; contact message skipped")
        return False
    lines = [
        f"From: {name}",
        f"Email: {email}",
        f"Phone: {phone or 'not given'}",
        f"Dates: {dates or 'not given'}",
        "",
        message,
        "",
        "Reply to this email to answer them.",
    ]
    return send_email(cfg["OWNER_EMAIL"], f"New message from {name}", "\n".join(lines), reply_to=email)
