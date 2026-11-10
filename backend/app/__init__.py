from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import Config, validate
from .errors import register_error_handlers
from .extensions import db, migrate


def create_app(overrides: dict | None = None) -> Flask:
    app = Flask(__name__)
    cfg = Config()
    app.config.from_object(cfg)
    app.config["PAYMENTS_MODE"] = cfg.PAYMENTS_MODE
    if overrides:
        app.config.update(overrides)
    validate(app.config)

    db.init_app(app)
    migrate.init_app(app, db)
    # Only our own frontend may call the API from a browser.
    CORS(app, resources={r"/api/*": {"origins": [app.config["FRONTEND_URL"]]}})

    from . import models  # noqa: F401  (register tables)
    from .api import admin, public, webhooks
    from .cli import register_cli

    app.register_blueprint(public.bp)
    app.register_blueprint(webhooks.bp)
    app.register_blueprint(admin.bp)
    register_error_handlers(app)
    register_cli(app)
    return app
