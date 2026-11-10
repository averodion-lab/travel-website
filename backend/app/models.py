from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, ExcludeConstraint
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Camper(db.Model):
    __tablename__ = "campers"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    class_type = db.Column(db.String(40), nullable=False, index=True)
    tagline = db.Column(db.String(200))
    description = db.Column(db.Text)
    layout = db.Column(db.String(120))  # e.g. "2 bedrooms + loft"
    sleeps = db.Column(db.Integer, nullable=False)
    towing_weight_lbs = db.Column(db.Integer)  # dry weight; null for motorized
    length_ft = db.Column(db.Numeric(4, 1))
    hitch_type = db.Column(db.String(80))
    hookups = db.Column(db.String(120))
    amenities = db.Column(JSONB, nullable=False, default=list)
    daily_rate = db.Column(db.Numeric(10, 2), nullable=False)
    cleaning_fee = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    security_deposit = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    min_nights = db.Column(db.Integer, nullable=False, default=2)
    image_url = db.Column(db.String(500))
    gallery = db.Column(JSONB, nullable=False, default=list)
    featured = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "class_type": self.class_type,
            "tagline": self.tagline,
            "description": self.description,
            "layout": self.layout,
            "sleeps": self.sleeps,
            "towing_weight_lbs": self.towing_weight_lbs,
            "length_ft": float(self.length_ft) if self.length_ft is not None else None,
            "hitch_type": self.hitch_type,
            "hookups": self.hookups,
            "amenities": self.amenities or [],
            "daily_rate": str(self.daily_rate),
            "cleaning_fee": str(self.cleaning_fee),
            "security_deposit": str(self.security_deposit),
            "min_nights": self.min_nights,
            "image_url": self.image_url,
            "gallery": self.gallery or [],
            "featured": self.featured,
        }


class Customer(db.Model):
    """PII table. Everything except the name is encrypted at rest."""

    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    encrypted_email = db.Column(db.Text, nullable=False)
    encrypted_phone = db.Column(db.Text, nullable=False)
    encrypted_address = db.Column(db.Text)
    encrypted_license_data = db.Column(db.Text)  # license number
    license_file_key = db.Column(db.String(200))  # storage key of encrypted upload
    license_purged_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class BookingStatus:
    PENDING = "pending"  # created, awaiting payment; holds the dates briefly
    CONFIRMED = "confirmed"  # deposit paid
    COMPLETED = "completed"  # camper returned and inspected
    CANCELLED = "cancelled"
    ALL = (PENDING, CONFIRMED, COMPLETED, CANCELLED)


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(20), unique=True, nullable=False)
    camper_id = db.Column(db.Integer, db.ForeignKey("campers.id"), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    # Half-open range [start_date, end_date): pickup day to return day, so one
    # customer's return day can be the next customer's pickup day.
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Integer, nullable=False)
    daily_rate = db.Column(db.Numeric(10, 2), nullable=False)  # snapshot at booking
    cleaning_fee = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    deposit_due = db.Column(db.Numeric(10, 2), nullable=False)  # charged at checkout
    security_deposit = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    # Campground the trailer is delivered to (app/catalog.py slug); null = elsewhere.
    park = db.Column(db.String(60))
    # Extras snapshot at booking time: [{code, name, daily_rate, days, total}]
    addons = db.Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    addons_total = db.Column(db.Numeric(10, 2), nullable=False, default=0, server_default=text("0"))
    status = db.Column(db.String(20), nullable=False, default=BookingStatus.PENDING)
    stripe_session_id = db.Column(db.String(200), unique=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    confirmed_at = db.Column(db.DateTime(timezone=True))
    completed_at = db.Column(db.DateTime(timezone=True))
    cancelled_at = db.Column(db.DateTime(timezone=True))
    notified_at = db.Column(db.DateTime(timezone=True))  # emails sent

    camper = db.relationship("Camper", lazy="joined")
    customer = db.relationship("Customer", lazy="joined", backref="bookings")

    __table_args__ = (
        CheckConstraint("end_date > start_date", name="bookings_dates_ordered"),
        CheckConstraint(
            "status IN ('pending','confirmed','completed','cancelled')",
            name="bookings_status_valid",
        ),
        # The database itself refuses overlapping bookings for the same camper.
        # Requires the btree_gist extension (created in the first migration).
        ExcludeConstraint(
            ("camper_id", "="),
            (text("daterange(start_date, end_date, '[)')"), "&&"),
            where=text("status <> 'cancelled'"),
            using="gist",
            name="bookings_no_overlap",
        ),
    )

    def public_dict(self) -> dict:
        """Safe for the customer-facing confirmation page: no contact details."""
        return {
            "reference": self.reference,
            "status": self.status,
            "first_name": self.customer.first_name,
            "camper": {
                "slug": self.camper.slug,
                "name": self.camper.name,
                "image_url": self.camper.image_url,
            },
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "days": self.days,
            "daily_rate": str(self.daily_rate),
            "cleaning_fee": str(self.cleaning_fee),
            "total_price": str(self.total_price),
            "deposit_due": str(self.deposit_due),
            "balance_due": str(self.total_price - self.deposit_due),
            "security_deposit": str(self.security_deposit),
            "park": self.park_info(),
            "addons": self.addons or [],
            "addons_total": str(self.addons_total or 0),
        }

    def park_info(self) -> dict | None:
        from .catalog import PARKS

        park = PARKS.get(self.park or "")
        if park is None:
            return {"slug": self.park, "name": self.park} if self.park else None
        return {"slug": park.slug, "name": park.name, "city": park.city, "state": park.state}


class User(db.Model):
    """Staff accounts. Only role 'admin' may view decrypted customer data."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(300), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="admin")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
