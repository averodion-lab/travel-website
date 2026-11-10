from __future__ import annotations

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, message: str, status: int = 400, code: str | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def _api_error(err: ApiError):
        body = {"error": err.message}
        if err.code:
            body["code"] = err.code
        return jsonify(body), err.status

    @app.errorhandler(HTTPException)
    def _http_error(err: HTTPException):
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def _unhandled(err: Exception):
        # Log the exception type and traceback, but never request data (PII).
        app.logger.exception("Unhandled error: %s", type(err).__name__)
        return jsonify({"error": "Something went wrong. Please try again."}), 500
