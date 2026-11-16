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
        count = f" x{a['qty']}" if a.get("qty", 1) > 1 else ""
        lines.append(f"Extra: {a['name']}{count}, {a['days']} days, {_money(Decimal(a['total']))}")
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

Change of plans? You can change your dates or cancel online:
{cfg['FRONTEND_URL']}/booking/manage?ref={b.reference}
- Changing dates is free up to 24 hours before pickup (until {b.free_change_until():%A, %B %-d, %Y}).
- Cancelling is free for 24 hours after payment. After that, your deposit is
  refunded in full up to 14 days before pickup, 50% from 13 to 7 days, and not
  refunded in the last 7 days. Full policy: {cfg['FRONTEND_URL']}/policies

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


def send_cancellation(b: Booking, refunded: bool, terms: dict) -> None:
    """The guest cancelled online: tell them and the owner."""
    cfg = current_app.config
    site = cfg["SITE_NAME"]
    amount = terms["refund"]
    if amount <= 0:
        refund_line = (
            f"You cancelled {terms['reason']}, so under our cancellation policy the deposit of "
            f"{_money(b.deposit_due)} isn't refunded. Nothing more is due."
        )
    elif refunded:
        refund_line = (
            f"You cancelled {terms['reason']}, so {_money(amount)} of your {_money(b.deposit_due)} deposit "
            "is being refunded to your card; it can take 5 to 10 days to appear. Nothing more is due."
        )
    else:
        refund_line = f"We'll refund {_money(amount)} of your deposit and email you when it's done."
    send_email(
        crypto.decrypt_str(b.customer.encrypted_email),
        f"Your {site} booking is cancelled ({b.reference})",
        f"""Hi {b.customer.first_name},

Your booking {b.reference} ({_dates(b)}) is cancelled.

{refund_line}

We hope to see you another time,
{site}
""",
    )
    if cfg["OWNER_EMAIL"]:
        send_email(
            cfg["OWNER_EMAIL"],
            f"Booking cancelled by the guest: {b.reference}",
            f"""Booking {b.reference} was cancelled online by the guest.

Dates (now free again): {_dates(b)}
Deposit paid: {_money(b.deposit_due)}. Refund under the policy ({terms['reason']}): {_money(amount)} ({"refunded automatically through Stripe" if refunded or amount <= 0 else "NOT refunded automatically: please refund it in Stripe"})
""",
        )


def send_date_change(b: Booking, old: tuple) -> None:
    """The guest moved their dates online: tell them and the owner."""
    cfg = current_app.config
    site = cfg["SITE_NAME"]
    old_dates = f"{old[0]:%a %b %-d} to {old[1]:%a %b %-d, %Y}"
    summary = f"""New dates: {_dates(b)}
Previous dates: {old_dates}
{_trip(b)}

New rental total: {_money(b.total_price)}
Deposit already paid: {_money(b.deposit_due)}
Balance due at pickup: {_money(b.total_price - b.deposit_due)}"""
    send_email(
        crypto.decrypt_str(b.customer.encrypted_email),
        f"Your {site} booking dates are changed ({b.reference})",
        f"""Hi {b.customer.first_name},

Your booking {b.reference} has new dates.

{summary}

View your booking: {cfg['FRONTEND_URL']}/booking/confirmation?ref={b.reference}

See you on the road,
{site}
""",
    )
    if cfg["OWNER_EMAIL"]:
        send_email(
            cfg["OWNER_EMAIL"],
            f"Booking dates changed by the guest: {b.reference}",
            f"Booking {b.reference} was moved online by the guest.\n\n{summary}\n",
        )
