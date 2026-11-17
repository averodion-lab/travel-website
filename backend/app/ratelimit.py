"""Simple per-visitor rate limits (in memory, per process): enough to stop a
script hammering the booking form, guessing booking numbers or trying admin
passwords. Visitors are told by their IP address (the first X-Forwarded-For
entry behind a proxy)."""
from __future__ import annotations

import time
from collections import defaultdict, deque

from flask import request

from .errors import ApiError


def client_address() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()


ALL: list["RateLimit"] = []  # every limiter, so tests can reset them


class RateLimit:
    def __init__(self, limit: int, window_seconds: int, message: str) -> None:
        self.limit = limit
        self.window = window_seconds
        self.message = message
        self._hits: dict[str, deque] = defaultdict(deque)
        ALL.append(self)

    def check(self, key: str | None = None) -> None:
        """Count one attempt; raise 429 once the window's limit is reached."""
        key = key or client_address()
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            raise ApiError(self.message, 429)
        hits.append(now)

    def clear(self) -> None:
        self._hits.clear()
