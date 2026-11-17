"""Every API response carries the security headers."""
from flask import Flask

from app.security import register_security_headers


def test_api_responses_have_security_headers(client):
    res = client.get("/api/parks")
    h = res.headers
    assert h["X-Content-Type-Options"] == "nosniff"
    assert h["X-Frame-Options"] == "DENY"
    assert h["Referrer-Policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in h["Content-Security-Policy"]
    assert h["Cache-Control"] == "no-store"
    # local/test runs are plain http, so no HSTS here
    assert "Strict-Transport-Security" not in h


def test_hsts_only_in_production():
    def make(env: str) -> Flask:
        app = Flask(__name__)
        app.config["ENV_NAME"] = env
        app.add_url_rule("/", "index", lambda: "ok")
        register_security_headers(app)
        return app

    assert make("production").test_client().get("/").headers["Strict-Transport-Security"].startswith("max-age=")
    assert "Strict-Transport-Security" not in make("development").test_client().get("/").headers
