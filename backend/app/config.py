"""Application configuration. Everything secret comes from environment variables."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _database_url() -> str:
    url = os.environ.get(
        "DATABASE_URL", "postgresql+psycopg://camper:camper@127.0.0.1:5442/camper"
    )
    # Hosts like Neon hand out postgres:// or postgresql:// URLs; we use psycopg 3.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


class Config:
    ENV_NAME = os.environ.get("APP_ENV", "development")  # development | production

    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    PII_ENCRYPTION_KEY = os.environ.get("PII_ENCRYPTION_KEY", "")

    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3210").rstrip("/")
    SITE_NAME = os.environ.get("SITE_NAME", "YourName")

    # Payments. With no Stripe key (development only) bookings are confirmed
    # immediately by a mock checkout so the whole flow can be exercised locally.
    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    # Pricing / booking rules
    DEPOSIT_PERCENT = int(os.environ.get("DEPOSIT_PERCENT", "30"))
    MAX_RENTAL_DAYS = int(os.environ.get("MAX_RENTAL_DAYS", "60"))
    # Unpaid bookings hold their dates this long. Must exceed the Stripe
    # Checkout session lifetime (30 min) so a payment can't land after expiry.
    PENDING_HOLD_MINUTES = int(os.environ.get("PENDING_HOLD_MINUTES", "35"))

    # Email (Gmail SMTP with an app password)
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
    EMAIL_FROM = os.environ.get("EMAIL_FROM", "") or SMTP_USERNAME
    OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "") or SMTP_USERNAME
    # Routing server for road miles to typed places (services/distance.py).
    OSRM_URL = os.environ.get("OSRM_URL", "")

    # Driver's license uploads (encrypted on disk locally; R2 in production later)
    UPLOAD_DIR = os.environ.get(
        "UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    )
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
    LICENSE_RETENTION_DAYS = int(os.environ.get("LICENSE_RETENTION_DAYS", "30"))

    ADMIN_TOKEN_MAX_AGE = 12 * 60 * 60  # seconds

    @property
    def PAYMENTS_MODE(self) -> str:  # noqa: N802
        return "stripe" if self.STRIPE_SECRET_KEY else "mock"


def validate(config: dict) -> None:
    """Fail fast on unsafe or incomplete configuration."""
    missing = [k for k in ("SECRET_KEY", "PII_ENCRYPTION_KEY") if not config.get(k)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}. "
            "See backend/.env.example."
        )
    if config["ENV_NAME"] == "production":
        prod_required = [
            "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
            "SMTP_USERNAME", "SMTP_PASSWORD", "OWNER_EMAIL",
        ]
        missing = [k for k in prod_required if not config.get(k)]
        if missing:
            raise RuntimeError(
                f"Production requires: {', '.join(missing)} (mock payments and "
                "skipped emails are development-only)."
            )
