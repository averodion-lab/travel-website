"""Tests run against a real PostgreSQL database (docker compose up -d) because
the double-booking guarantee is a PostgreSQL exclusion constraint."""
from __future__ import annotations

import io
import os
from datetime import date, timedelta
from decimal import Decimal

import psycopg
import pytest
from cryptography.fernet import Fernet
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.models import Camper, User

ADMIN_DSN = os.environ.get("TEST_ADMIN_DSN", "postgresql://camper:camper@127.0.0.1:5442/postgres")
TEST_DB = "camper_test"


@pytest.fixture(scope="session")
def _database():
    with psycopg.connect(ADMIN_DSN, autocommit=True) as conn:
        if not conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB,)).fetchone():
            conn.execute(f"CREATE DATABASE {TEST_DB}")
    return ADMIN_DSN.rsplit("/", 1)[0].replace("postgresql://", "postgresql+psycopg://") + "/" + TEST_DB


@pytest.fixture()
def app(_database, tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "ENV_NAME": "development",
            "SECRET_KEY": "test-secret",
            "PII_ENCRYPTION_KEY": Fernet.generate_key().decode(),
            "SQLALCHEMY_DATABASE_URI": _database,
            "UPLOAD_DIR": str(tmp_path / "uploads"),
            "STRIPE_SECRET_KEY": "",
            "STRIPE_WEBHOOK_SECRET": "",
            "SMTP_USERNAME": "",
            "SMTP_PASSWORD": "",
            "OWNER_EMAIL": "owner@example.com",
            "DEPOSIT_PERCENT": 30,
        }
    )
    with app.app_context():
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        db.session.commit()
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def camper(app):
    c = Camper(
        slug="test-trailer",
        name="Test Trailer",
        class_type="Travel Trailer",
        sleeps=4,
        towing_weight_lbs=5000,
        daily_rate=Decimal("150.00"),
        cleaning_fee=Decimal("80.00"),
        security_deposit=Decimal("500.00"),
        min_nights=2,
        amenities=[],
        gallery=[],
    )
    db.session.add(c)
    db.session.commit()
    return c


@pytest.fixture()
def admin_token(app, client):
    user = User(email="owner@example.com", role="admin")
    user.set_password("correct-horse-battery")
    db.session.add(user)
    db.session.commit()
    res = client.post(
        "/api/admin/login", json={"email": "owner@example.com", "password": "correct-horse-battery"}
    )
    return res.get_json()["token"]


@pytest.fixture()
def sent_emails(monkeypatch):
    """Capture outgoing email instead of sending it."""
    sent: list[dict] = []

    def fake_send(to, subject, body, reply_to=None):
        sent.append({"to": to, "subject": subject, "body": body, "reply_to": reply_to})
        return True

    monkeypatch.setattr("app.services.email.send_email", fake_send)
    return sent


def day(offset: int) -> date:
    return date.today() + timedelta(days=offset)


def booking_form(start: date, end: date, **overrides) -> dict:
    form = {
        "camper": "test-trailer",
        "start": start.isoformat(),
        "end": end.isoformat(),
        "first_name": "Jane",
        "last_name": "Camper",
        "email": "jane@example.com",
        "phone": "(555) 010-2030",
        "address": "1 Mountain Rd, Asheville, NC",
        "license_number": "NC-1234567",
        "agree_terms": "1",
        "license": (io.BytesIO(b"\xff\xd8fake-jpeg-bytes"), "license.jpg"),
    }
    form.update(overrides)
    return form


def post_booking(client, start: date, end: date, **overrides):
    return client.post(
        "/api/bookings", data=booking_form(start, end, **overrides), content_type="multipart/form-data"
    )
