from __future__ import annotations

from datetime import date, timedelta

import click
from flask import Flask, current_app
from sqlalchemy import select

from .extensions import db
from .models import Booking, BookingStatus, Camper, Customer, User, utcnow
from .seed_data import CAMPERS
from . import crypto
from .services import availability, storage
from .services.pricing import quote_for_camper


def purge_expired_licenses() -> int:
    """Delete license files and license numbers once every booking of a
    customer has been finished (completed or cancelled) for the retention
    period. Returns the number of customers purged."""
    cutoff = utcnow() - timedelta(days=current_app.config["LICENSE_RETENTION_DAYS"])
    customers = db.session.execute(
        select(Customer).where(Customer.license_purged_at.is_(None))
    ).scalars().all()
    purged = 0
    for customer in customers:
        bookings = customer.bookings
        if not bookings:
            continue

        def finished(b: Booking) -> bool:
            if b.status == BookingStatus.COMPLETED:
                return b.completed_at is not None and b.completed_at < cutoff
            if b.status == BookingStatus.CANCELLED:
                return b.cancelled_at is not None and b.cancelled_at < cutoff
            return False

        if all(finished(b) for b in bookings):
            storage.delete_license(customer.license_file_key)
            customer.license_file_key = None
            customer.encrypted_license_data = None
            customer.license_purged_at = utcnow()
            purged += 1
    db.session.commit()
    return purged


def register_cli(app: Flask) -> None:
    @app.cli.command("seed")
    def seed():
        """Make the database match seed_data: add or update those campers and
        hide any others (hidden, not deleted, so past bookings stay intact)."""
        slugs = [data["slug"] for data in CAMPERS]
        for data in CAMPERS:
            camper = db.session.execute(
                select(Camper).where(Camper.slug == data["slug"])
            ).scalar_one_or_none()
            if camper is None:
                db.session.add(Camper(**data))
            else:
                for field, value in data.items():
                    setattr(camper, field, value)
                camper.is_active = True
        hidden = db.session.execute(
            select(Camper).where(Camper.slug.not_in(slugs), Camper.is_active.is_(True))
        ).scalars().all()
        for camper in hidden:
            camper.is_active = False
        db.session.commit()
        click.echo(f"Saved {len(CAMPERS)} campers, hid {len(hidden)} old ones.")

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(email: str, password: str):
        """Create (or reset the password of) an admin account."""
        if len(password) < 10:
            raise click.ClickException("Password must be at least 10 characters.")
        email = email.strip().lower()
        user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            user = User(email=email, role="admin")
            db.session.add(user)
        user.set_password(password)
        db.session.commit()
        click.echo("Admin account saved.")

    @app.cli.command("demo-data")
    @click.option("--clear", is_flag=True, help="Remove the demo bookings instead of adding them.")
    def demo_data(clear: bool):
        """Fill the owner dashboard with made-up bookings (references start
        with DEMO-) so it can be previewed. Never runs in production."""
        if current_app.config["ENV_NAME"] == "production":
            raise click.ClickException("Demo data is not allowed in production.")
        old = db.session.execute(
            select(Booking).where(Booking.reference.like("DEMO-%"))
        ).scalars().all()
        for booking in old:
            customer = booking.customer
            db.session.delete(booking)
            db.session.flush()
            db.session.delete(customer)
        db.session.commit()
        if clear:
            click.echo(f"Removed {len(old)} demo bookings.")
            return

        camper = db.session.execute(
            select(Camper).where(Camper.is_active.is_(True)).order_by(Camper.id)
        ).scalars().first()
        if camper is None:
            raise click.ClickException("Run `flask seed` first.")
        today = date.today()
        # (days from today, nights, status, name)
        plan = [
            (-150, 5, BookingStatus.COMPLETED, "Avery", "Sample"),
            (-118, 7, BookingStatus.COMPLETED, "Jordan", "Example"),
            (-84, 4, BookingStatus.COMPLETED, "Riley", "Sample"),
            (-55, 10, BookingStatus.COMPLETED, "Casey", "Example"),
            (-30, 6, BookingStatus.COMPLETED, "Morgan", "Sample"),
            (-2, 6, BookingStatus.CONFIRMED, "Taylor", "Example"),
            (9, 5, BookingStatus.CONFIRMED, "Quinn", "Sample"),
            (21, 8, BookingStatus.CONFIRMED, "Rowan", "Example"),
            (47, 4, BookingStatus.CONFIRMED, "Parker", "Sample"),
            (75, 7, BookingStatus.CONFIRMED, "Reese", "Example"),
        ]
        added = 0
        for i, (offset, nights, status, first, last) in enumerate(plan, start=1):
            start = today + timedelta(days=offset)
            end = start + timedelta(days=nights)
            if not availability.is_available(camper.id, start, end):
                continue  # never displace a real booking
            quote = quote_for_camper(camper, max(start, today), max(start, today) + timedelta(days=nights), current_app.config)
            stamp = utcnow() + timedelta(days=min(offset, 0) - 14)
            db.session.add(
                Booking(
                    reference=f"DEMO-{i:04d}",
                    camper=camper,
                    customer=Customer(
                        first_name=first,
                        last_name=last,
                        encrypted_email=crypto.encrypt_str(f"{first.lower()}@example.com"),
                        encrypted_phone=crypto.encrypt_str(f"555-010-01{i:02d}"),
                    ),
                    start_date=start,
                    end_date=end,
                    days=nights,
                    daily_rate=quote.daily_rate,
                    cleaning_fee=quote.cleaning_fee,
                    total_price=quote.total,
                    deposit_due=quote.deposit_due,
                    security_deposit=quote.security_deposit,
                    status=status,
                    created_at=stamp,
                    confirmed_at=stamp,
                    completed_at=utcnow() if status == BookingStatus.COMPLETED else None,
                )
            )
            added += 1
        db.session.commit()
        click.echo(f"Added {added} demo bookings. Remove them with: flask demo-data --clear")

    @app.cli.command("purge-licenses")
    def purge_licenses():
        """Scheduled job: remove identity documents past the retention period."""
        click.echo(f"Purged license data for {purge_expired_licenses()} customers.")

    @app.cli.command("expire-pending")
    def expire_pending():
        """Release dates held by unpaid bookings."""
        click.echo(f"Expired {availability.expire_stale_pending()} unpaid bookings.")
