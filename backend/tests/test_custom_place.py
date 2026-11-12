"""A destination the guest types in (not one of our campgrounds): the server
measures road miles from our base itself and prices delivery from that."""
from decimal import Decimal

import pytest

from app.catalog import DELIVERY_PER_MILE
from app.extensions import db
from app.models import Booking
from app.services import distance

from .conftest import day, post_booking

BASE_TOTAL = Decimal("680.00")  # 4 nights x $150 + $80 cleaning (test camper)
PLACE = {"name": "Shady Cove Campground, Lakeview, GA", "lat": 34.5, "lng": -84.1}


@pytest.fixture
def miles(monkeypatch):
    """Pretend every place is 50 road miles away (no network in tests)."""
    calls = []

    def fake(lat, lng):
        calls.append((lat, lng))
        return 50

    monkeypatch.setattr(distance, "road_miles", fake)
    return calls


def quote(client, **extra):
    body = {"camper": "test-trailer", "start": day(10).isoformat(), "end": day(14).isoformat(), **extra}
    return client.post("/api/quote", json=body)


def test_delivery_to_a_typed_place_uses_server_measured_miles(client, camper, miles):
    res = quote(client, park="custom", place=PLACE, transport="delivery")
    assert res.status_code == 200, res.get_json()
    q = res.get_json()["quote"]
    assert q["transport"]["miles"] == 50
    assert q["transport"]["total"] == f"{DELIVERY_PER_MILE * 50:.2f}"
    assert q["total"] == f"{BASE_TOTAL + DELIVERY_PER_MILE * 50:.2f}"
    assert res.get_json()["place"] == {"name": PLACE["name"], "delivery_miles": 50}
    assert miles == [(34.5, -84.1)]


def test_a_client_sent_distance_is_ignored(client, camper, miles):
    q = quote(client, park="custom", place={**PLACE, "delivery_miles": 1}, transport="delivery").get_json()["quote"]
    assert q["transport"]["miles"] == 50


def test_typed_place_needs_a_name_and_a_location(client, camper, miles):
    assert quote(client, park="custom", transport="delivery").status_code == 400
    assert quote(client, park="custom", place={"name": "", "lat": 34.5, "lng": -84.1}).status_code == 400
    assert quote(client, park="custom", place={"name": "X", "lat": "abc", "lng": -84.1}).status_code == 400


def test_places_outside_the_region_are_refused(client, camper, miles):
    res = quote(client, park="custom", place={"name": "Denver", "lat": 39.7, "lng": -104.9})
    assert res.status_code == 400
    assert miles == []  # refused before measuring


def test_places_too_far_to_deliver_are_refused(client, camper, monkeypatch):
    monkeypatch.setattr(distance, "road_miles", lambda lat, lng: 650)
    res = quote(client, park="custom", place=PLACE, transport="delivery")
    assert res.status_code == 400
    assert "contact us" in res.get_json()["error"]


def test_extras_can_be_added_at_a_typed_place(client, camper, miles):
    q = quote(client, park="custom", place=PLACE, addons=["jetski"]).get_json()["quote"]
    assert q["addons"][0]["code"] == "jetski"


def test_booking_stores_the_place_encrypted(client, camper, sent_emails, miles):
    res = post_booking(
        client, day(10), day(14), park="custom", transport="delivery",
        place_name=PLACE["name"], place_lat="34.5", place_lng="-84.1",
    )
    assert res.status_code == 201, res.get_json()
    b = db.session.query(Booking).one()
    assert b.park == "custom"
    assert b.delivery_miles == 50
    assert PLACE["name"] not in (b.encrypted_place or "")  # not plaintext
    assert b.place_details()["name"] == PLACE["name"]
    # The public booking page does not reveal the address.
    public = client.get(f"/api/bookings/{b.reference}").get_json()["booking"]
    assert PLACE["name"] not in str(public)
    owner = next(m for m in sent_emails if m["to"] == "owner@example.com")
    assert PLACE["name"] in owner["body"] and "50 miles" in owner["body"]


def test_distance_endpoint_measures_from_our_base(client, miles):
    d = client.get("/api/distance?lat=34.5&lng=-84.1").get_json()
    assert d == {"delivery_miles": 50, "delivery_total": f"{DELIVERY_PER_MILE * 50:.2f}"}


def test_distance_endpoint_refuses_far_away_places(client, miles):
    assert client.get("/api/distance?lat=39.7&lng=-104.9").status_code == 400
    assert client.get("/api/distance?lat=abc&lng=1").status_code == 400
