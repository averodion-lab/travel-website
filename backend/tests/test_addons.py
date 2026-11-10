"""Parks and add-ons: 4-wheelers at mountain parks, jet skis at lake parks.
Add-on prices come from the server catalog, never from the client."""
from decimal import Decimal

from app.catalog import ADDONS, PARKS
from app.extensions import db
from app.models import Booking

from .conftest import day, post_booking

MOUNTAIN = "twin-creek"        # mountains only
LAKE = "nashville-shores"      # lake only
BOTH = "lake-nottely"          # mountains and lake


def quote(client, **extra):
    body = {"camper": "test-trailer", "start": day(10).isoformat(), "end": day(14).isoformat(), **extra}
    return client.post("/api/quote", json=body)


def test_every_park_has_a_location_link_and_terrain():
    assert len(PARKS) == 11
    for park in PARKS.values():
        assert park.url.startswith("https://")
        assert 30 < park.lat < 37 and -88 < park.lng < -81  # the Southeast
        assert park.state in {"Georgia", "South Carolina", "North Carolina", "Tennessee", "Alabama"}
        assert park.terrain <= {"mountains", "lake"}


def test_parks_endpoint_lists_parks_and_what_each_offers(client):
    data = client.get("/api/parks").get_json()
    parks = {p["slug"]: p for p in data["parks"]}
    assert len(parks) == 11
    assert [a["code"] for a in parks[MOUNTAIN]["addons"]] == ["atv"]
    assert [a["code"] for a in parks[LAKE]["addons"]] == ["jetski"]
    assert {a["code"] for a in parks[BOTH]["addons"]} == {"atv", "jetski"}
    assert {a["code"] for a in data["addons"]} == {"atv", "jetski"}


def test_quote_without_park_or_addons_is_unchanged(client, camper):
    q = quote(client).get_json()["quote"]
    assert q["total"] == "680.00"  # 4 x 150 + 80 cleaning
    assert q["addons"] == [] and q["addons_total"] == "0.00"


def test_addons_are_charged_per_day_and_included_in_deposit(client, camper):
    q = quote(client, park=BOTH, addons=["atv", "jetski"]).get_json()["quote"]
    atv, jetski = ADDONS["atv"].daily_rate * 4, ADDONS["jetski"].daily_rate * 4
    assert {a["code"]: a["total"] for a in q["addons"]} == {"atv": f"{atv:.2f}", "jetski": f"{jetski:.2f}"}
    total = Decimal("680.00") + atv + jetski
    assert q["addons_total"] == f"{atv + jetski:.2f}"
    assert q["total"] == f"{total:.2f}"
    assert q["deposit_due"] == f"{(total * Decimal('0.30')).quantize(Decimal('0.01')):.2f}"


def test_addon_must_suit_the_park(client, camper):
    res = quote(client, park=LAKE, addons=["atv"])
    assert res.status_code == 400 and "mountain" in res.get_json()["error"]
    res = quote(client, park=MOUNTAIN, addons=["jetski"])
    assert res.status_code == 400 and "lake" in res.get_json()["error"]


def test_addons_need_a_park_and_must_exist(client, camper):
    assert quote(client, addons=["atv"]).status_code == 400
    assert quote(client, park="nowhere").status_code == 400
    assert quote(client, park=MOUNTAIN, addons=["helicopter"]).status_code == 400


def test_booking_saves_park_and_addons_at_server_prices(client, camper, sent_emails):
    res = post_booking(client, day(10), day(14), park=MOUNTAIN, addons="atv", addons_total="1")
    assert res.status_code == 201, res.get_json()
    b = db.session.query(Booking).one()
    assert b.park == MOUNTAIN
    assert [a["code"] for a in b.addons] == ["atv"]
    assert b.addons_total == ADDONS["atv"].daily_rate * 4
    assert b.total_price == Decimal("680.00") + b.addons_total

    public = client.get(f"/api/bookings/{b.reference}").get_json()["booking"]
    assert public["park"]["name"] == PARKS[MOUNTAIN].name
    assert public["addons"][0]["name"] == "4-wheeler"
    customer_email = next(m for m in sent_emails if m["to"] == "jane@example.com")
    assert "4-wheeler" in customer_email["body"] and PARKS[MOUNTAIN].name in customer_email["body"]


def test_booking_rejects_addon_the_park_does_not_offer(client, camper):
    res = post_booking(client, day(10), day(14), park=LAKE, addons="atv")
    assert res.status_code == 400
    assert db.session.query(Booking).count() == 0
