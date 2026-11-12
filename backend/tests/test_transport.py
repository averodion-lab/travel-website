"""Getting the trailer to the campsite: own truck (free), rent our truck
(per day, towing experience required) or delivery and setup ($ per mile)."""
from decimal import Decimal

from app.catalog import DELIVERY_PER_MILE, DELIVERY_TRIPS, PARKS, TRUCK
from app.extensions import db
from app.models import Booking

from .conftest import day, post_booking

BASE_TOTAL = Decimal("680.00")  # 4 nights x $150 + $80 cleaning (test camper)


def quote(client, **extra):
    body = {"camper": "test-trailer", "start": day(10).isoformat(), "end": day(14).isoformat(), **extra}
    return client.post("/api/quote", json=body)


def test_every_park_has_a_delivery_distance():
    for park in PARKS.values():
        assert 10 < park.delivery_miles < 400


def test_own_truck_is_the_default_and_free(client, camper):
    q = quote(client).get_json()["quote"]
    assert q["transport"]["code"] == "self"
    assert q["transport"]["total"] == "0.00"
    assert q["total"] == f"{BASE_TOTAL:.2f}"


def test_renting_the_truck_is_charged_per_day(client, camper):
    q = quote(client, transport="truck", towing_experience=True).get_json()["quote"]
    truck = TRUCK.daily_rate * 4
    assert q["transport"]["code"] == "truck"
    assert q["transport"]["total"] == f"{truck:.2f}"
    assert q["total"] == f"{BASE_TOTAL + truck:.2f}"


def test_renting_the_truck_needs_towing_experience(client, camper):
    res = quote(client, transport="truck")
    assert res.status_code == 400
    assert "experience" in res.get_json()["error"]


def test_delivery_is_priced_by_the_mile_both_ways(client, camper):
    park = PARKS["vogel"]
    q = quote(client, transport="delivery", park="vogel").get_json()["quote"]
    fee = (DELIVERY_PER_MILE * park.delivery_miles * DELIVERY_TRIPS).quantize(Decimal("0.01"))
    assert q["transport"]["total"] == f"{fee:.2f}"
    assert q["transport"]["miles"] == park.delivery_miles
    assert q["total"] == f"{BASE_TOTAL + fee:.2f}"


def test_delivery_needs_a_campground_from_the_list(client, camper):
    res = quote(client, transport="delivery")
    assert res.status_code == 400
    assert "campground" in res.get_json()["error"]


def test_unknown_transport_is_refused(client, camper):
    assert quote(client, transport="helicopter").status_code == 400


def test_transport_and_extras_add_up(client, camper):
    q = quote(client, transport="delivery", park="lake-nottely", addons=["jetski"]).get_json()["quote"]
    assert Decimal(q["total"]) == BASE_TOTAL + Decimal(q["addons_total"]) + Decimal(q["transport"]["total"])


def test_booking_saves_transport_at_server_prices(client, camper, sent_emails):
    res = post_booking(client, day(10), day(14), transport="truck", towing_experience="1", transport_total="1")
    assert res.status_code == 201, res.get_json()
    b = db.session.query(Booking).one()
    assert b.transport == "truck"
    assert b.towing_experience is True
    assert b.transport_total == TRUCK.daily_rate * 4
    assert b.total_price == BASE_TOTAL + b.transport_total
    public = client.get(f"/api/bookings/{b.reference}").get_json()["booking"]
    assert public["transport"]["code"] == "truck"
    owner = next(m for m in sent_emails if m["to"] == "owner@example.com")
    assert "RAM 2500" in owner["body"]


def test_booking_with_delivery_saves_the_miles(client, camper, sent_emails):
    res = post_booking(client, day(10), day(14), transport="delivery", park="fort-mountain")
    assert res.status_code == 201, res.get_json()
    b = db.session.query(Booking).one()
    assert b.transport == "delivery"
    assert b.transport_total == (DELIVERY_PER_MILE * PARKS["fort-mountain"].delivery_miles * DELIVERY_TRIPS)
