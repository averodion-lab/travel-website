"""Jet skis are only offered at lake parks with a known boat ramp."""
from app.catalog import ADDONS, PARKS, RAMPS


def test_every_lake_park_has_a_ramp():
    lake = {p.slug for p in PARKS.values() if "lake" in p.terrain}
    assert lake == set(RAMPS), f"lake parks without a ramp: {lake - set(RAMPS)}; ramps for non-lake parks: {set(RAMPS) - lake}"


def test_jet_ski_only_where_there_is_a_ramp():
    for park in PARKS.values():
        offers_jetski = ADDONS["jetski"] in park.addons
        assert offers_jetski == (park.ramp is not None), park.slug


def test_ramps_are_near_their_park():
    for slug, ramp in RAMPS.items():
        park = PARKS[slug]
        assert abs(ramp.lat - park.lat) < 0.1 and abs(ramp.lng - park.lng) < 0.1, slug
        assert ramp.in_park or ramp.miles > 0


def test_parks_api_includes_the_ramp(client):
    parks = {p["slug"]: p for p in client.get("/api/parks").get_json()["parks"]}
    assert parks["harrison-bay"]["ramp"]["name"] == "Wolftever Bridge boat launch"
    assert parks["harrison-bay"]["ramp"]["in_park"] is True
    assert parks["vogel"]["ramp"] is None
