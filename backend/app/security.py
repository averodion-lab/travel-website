"""HTTP security headers on every API response. The API serves JSON only, so
the policy is strict: nothing may be framed, scripted or cached by a browser.
HSTS is sent only in production (local dev runs on plain http)."""
from __future__ import annotations

from flask import Flask, Response


def register_security_headers(app: Flask) -> None:
    production = app.config.get("ENV_NAME") == "production"

    @app.after_request
    def add_headers(response: Response) -> Response:
        h = response.headers
        h.setdefault("X-Content-Type-Options", "nosniff")
        h.setdefault("X-Frame-Options", "DENY")
        h.setdefault("Referrer-Policy", "no-referrer")
        h.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        h.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        # Booking and admin responses carry personal data: never cache them.
        if not h.get("Cache-Control"):
            h["Cache-Control"] = "no-store"
        if production:
            h.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response
