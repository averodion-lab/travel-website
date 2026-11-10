"""Encryption of PII at rest (Fernet: AES-128-CBC + HMAC-SHA256).

The key lives only in the PII_ENCRYPTION_KEY environment variable.
"""
from __future__ import annotations

from cryptography.fernet import Fernet
from flask import current_app


def _fernet() -> Fernet:
    return Fernet(current_app.config["PII_ENCRYPTION_KEY"].encode())


def encrypt_str(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    return _fernet().encrypt(value.encode()).decode()


def decrypt_str(token: str | None) -> str | None:
    if not token:
        return None
    return _fernet().decrypt(token.encode()).decode()


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    return _fernet().decrypt(token)
