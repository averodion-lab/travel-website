"""Road miles from our base to a place the guest typed in.

Uses an OSRM routing server (the public demo by default; set OSRM_URL to your
own or a paid provider before heavy traffic: the demo is meant for light use).
Results are cached in memory by rounded coordinates.
"""
from __future__ import annotations

import json
import ssl
import urllib.request
from functools import lru_cache

import certifi

from flask import current_app

from ..catalog import BASE_LAT, BASE_LNG
from ..errors import ApiError

DEFAULT_OSRM_URL = "https://router.project-osrm.org"
METERS_PER_MILE = 1609.344


@lru_cache(maxsize=1024)
def _route_miles(base_url: str, lat: float, lng: float) -> int:
    url = f"{base_url.rstrip('/')}/route/v1/driving/{BASE_LNG},{BASE_LAT};{lng},{lat}?overview=false"
    req = urllib.request.Request(url, headers={"User-Agent": "camper-rental-booking/1.0"})
    ctx = ssl.create_default_context(cafile=certifi.where())  # macOS Python has no system CA bundle
    with urllib.request.urlopen(req, timeout=8, context=ctx) as res:  # noqa: S310 (https host from config)
        data = json.load(res)
    if data.get("code") != "Ok" or not data.get("routes"):
        raise ValueError(f"no route: {data.get('code')}")
    return round(data["routes"][0]["distance"] / METERS_PER_MILE)


def road_miles(lat: float, lng: float) -> int:
    """Driving miles from our base to (lat, lng), one way."""
    base_url = current_app.config.get("OSRM_URL") or DEFAULT_OSRM_URL
    try:
        return _route_miles(base_url, round(lat, 4), round(lng, 4))
    except Exception as exc:  # network error, timeout, no road route
        current_app.logger.warning("Distance lookup failed: %s", type(exc).__name__)
        raise ApiError(
            "We couldn't measure the distance to that place right now. Please try again, choose a campground "
            "from the list, or contact us.",
            503,
        ) from None
