"""Electric bikes: an extra at every campground, $33 a day each, up to 3."""
from decimal import Decimal

from app.catalog import ADDONS, PARKS
from app.extensions import db
from app.models import Booking

from .conftest import day, post_booking

BASE_TOTAL = Decimal("680.00")  # 4 nights x $150 + $80 cleaning (test camper)
EBIKE = ADDONS["ebike"]


def quote(client, **extra):
    body = {"camper": "test-trailer", "start": day(10).isoformat(), "end": day(14).isoformat(), **extra}
    return client.post("/api/quote", json=body)


def test_ebike_is_offered_everywhere_up_to_three():
    assert EBIKE.daily_rate == Decimal("33.00")
    assert EBIKE.max_qty == 3
    for park in PARKS.values():
        assert "ebike" in [a.code for a in park.addons]


def test_ebikes_are_charged_per_bike_per_day(client, camper):
    q = quote(client, park="vogel", addons=["ebike:3"]).get_json()["quote"]
    line = q["addons"][0]
    assert (line["code"], line["qty"], line["days"]) == ("ebike", 3, 4)
    assert line["total"] == "396.00"  # $33 x 4 days x 3 bikes
    assert q["total"] == f"{BASE_TOTAL + 396:.2f}"


def test_one_bike_when_no_quantity_is_given(client, camper):
    q = quote(client, park="vogel", addons=["ebike"]).get_json()["quote"]
    assert q["addons"][0]["qty"] == 1 and q["addons"][0]["total"] == "132.00"


def test_more_than_three_bikes_is_refused(client, camper):
    for bad in ["ebike:4", "ebike:0", "ebike:x"]:
        assert quote(client, park="vogel", addons=[bad]).status_code == 400


def test_other_extras_are_one_each(client, camper):
    assert quote(client, park="lake-nottely", addons=["jetski:2"]).status_code == 400


def test_booking_saves_the_bike_count(client, camper, sent_emails):
    res = post_booking(client, day(10), day(14), park="vogel", addons="ebike:2")
    assert res.status_code == 201, res.get_json()
    b = db.session.query(Booking).one()
    assert b.addons[0]["qty"] == 2
    assert b.addons_total == Decimal("264.00")
    owner = next(m for m in sent_emails if m["to"] == "owner@example.com")
    assert "Electric bike x2" in owner["body"]


def test_free_cancellation_deadline_is_24_hours_before_pickup(client, camper, sent_emails):
    from datetime import timedelta

    from app.catalog import FREE_CHANGE_HOURS

    assert FREE_CHANGE_HOURS == 24
    res = post_booking(client, day(40), day(44))
    b = db.session.query(Booking).one()
    public = client.get(f"/api/bookings/{b.reference}").get_json()["booking"]
    assert public["free_change_until"] == (day(40) - timedelta(days=1)).isoformat()
    customer = next(m for m in sent_emails if m["to"] != "owner@example.com")
    assert "24 hours before pickup" in customer["body"]
    assert "free for 24 hours after payment" in customer["body"]
