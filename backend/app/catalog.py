"""Campgrounds we deliver to, and the extras offered at each.

Mountain parks offer a 4-wheeler; lake parks offer a jet ski. A park can be
both. Add-on prices are PLACEHOLDERS until the owner confirms them.
The frontend's preview copy (frontend/lib/preview.ts) mirrors this file.

Coordinates: street addresses geocoded with the US Census geocoder or
OpenStreetMap (Nov 2026); Blue Ridge Falls from its own website; Lake
Nottely from The Dyrt listing (its own website was unreachable).

Getting there: guests tow with their own truck, rent ours (TRUCK, per day,
towing experience required) or have us deliver and set up the trailer
(DELIVERY_PER_MILE, for the drive there at drop-off and back at pick-up).
Delivery miles are road miles from BASE, measured with OSRM (Nov 2026).
The truck's daily rate is a PLACEHOLDER until the owner confirms it.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from .errors import ApiError


@dataclass(frozen=True)
class Addon:
    code: str
    name: str
    daily_rate: Decimal
    terrain: str  # the park must have this terrain to offer it
    description: str

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "name": self.name,
            "daily_rate": str(self.daily_rate),
            "terrain": self.terrain,
            "description": self.description,
        }


# Where the trailer is kept; delivery miles are counted from here.
BASE = "Canton / Woodstock, GA"
BASE_LAT, BASE_LNG = 34.169, -84.505

# Delivery and setup: per mile, counted for the drive there (drop-off) and
# the drive back (pick-up).
DELIVERY_PER_MILE = Decimal("3.50")
DELIVERY_TRIPS = 2


@dataclass(frozen=True)
class Truck:
    code: str
    name: str
    daily_rate: Decimal
    description: str

    def to_dict(self) -> dict:
        return {"code": self.code, "name": self.name, "daily_rate": str(self.daily_rate), "description": self.description}


TRUCK = Truck(
    "truck",
    "2026 RAM 2500 Turbo Diesel",
    Decimal("175.00"),
    "Our black 2026 RAM 2500 Turbo Diesel with a fifth-wheel hitch. For drivers with experience towing a large trailer.",
)

TRANSPORT_CODES = ("self", "truck", "delivery")


@dataclass(frozen=True)
class Park:
    slug: str
    name: str
    state: str
    city: str
    url: str
    description: str
    lat: float
    lng: float
    terrain: frozenset[str]
    delivery_miles: int = 0  # road miles from BASE

    @property
    def addons(self) -> list[Addon]:
        return [a for a in ADDONS.values() if a.terrain in self.terrain]

    def to_dict(self) -> dict:
        return {
            "slug": self.slug,
            "name": self.name,
            "state": self.state,
            "city": self.city,
            "url": self.url,
            "description": self.description,
            "lat": self.lat,
            "lng": self.lng,
            "terrain": sorted(self.terrain),
            "addons": [a.to_dict() for a in self.addons],
            "delivery_miles": self.delivery_miles,
        }


ADDONS: dict[str, Addon] = {
    a.code: a
    for a in (
        Addon("atv", "4-wheeler", Decimal("150.00"), "mountains",
              "A 4-wheeler delivered with the trailer for exploring mountain trails."),
        Addon("jetski", "Jet ski", Decimal("250.00"), "lake",
              "A jet ski delivered with the trailer, ready for the lake."),
    )
}

M, L = "mountains", "lake"

PARKS: dict[str, Park] = {
    p.slug: p
    for p in (
        Park("vogel", "Vogel State Park", "Georgia", "Blairsville", "https://gastateparks.org/Vogel",
             "At the base of Blood Mountain in the Chattahoochee National Forest, with a 22-acre mountain "
             "lake (Lake Trahlyta) and full-hookup RV sites.",
             34.76294, -83.92843, frozenset({M}), 92),
        Park("fort-mountain", "Fort Mountain State Park", "Georgia", "Chatsworth", "https://gastateparks.org/FortMountain",
             "High-elevation overlooks, hiking trails and a tucked-away mountain lake with a swimming beach. "
             "RV sites have water and electric hookups.",
             34.76069, -84.69515, frozenset({M}), 61),
        Park("lake-nottely", "Lake Nottely RV Park", "Georgia", "Blairsville", "https://lakenottelyrv.com/",
             "In the Blue Ridge Mountains, with full hookups, mountain views and direct access to Lake Nottely "
             "for boating and fishing.",
             34.872, -84.006, frozenset({M, L}), 79),
        Park("carolina-landing", "Thousand Trails Carolina Landing", "South Carolina", "Fair Play",
             "https://thousandtrails.com/south-carolina/carolina-landing-rv-resort",
             "In the Appalachian foothills right on the shore of Lake Hartwell: classic lakeside camping with "
             "full hookups for large rigs.",
             34.499, -82.97757, frozenset({L}), 106),
        Park("sugar-lake", "Sugar Lake RV Park", "South Carolina", "Travelers Rest", "https://www.sugarlakervpark.com/",
             "A peaceful park near the Blue Ridge Mountains, centered on a private 3-acre fishing lake, with "
             "spacious full-hookup sites.",
             35.04014, -82.44025, frozenset({M}), 163),
        Park("bear-den", "Spacious Skies Bear Den", "North Carolina", "Spruce Pine",
             "https://spaciousskiescampgrounds.com/bear-den/",
             "High in the Blue Ridge Mountains, right off the Blue Ridge Parkway, with a private lake, forest "
             "trails and full RV hookups.",
             35.89239, -81.97537, frozenset({M}), 245),
        Park("blue-ridge-falls", "Blue Ridge Falls RV & Glamping Resort", "North Carolina", "Lake Toxaway",
             "https://blueridgefallsrvresort.com/",
             "A mountain retreat surrounded by creeks and waterfalls, a base for hiking, kayaking and rock "
             "climbing.",
             35.1438145, -82.930422, frozenset({M}), 150),
        Park("twin-creek", "Twin Creek RV Resort", "Tennessee", "Gatlinburg", "https://twincreekrvresort.com/",
             "A wooded resort bordering Great Smoky Mountains National Park, with a running creek and fully "
             "equipped concrete RV pads.",
             35.72521, -83.48267, frozenset({M}), 177),
        Park("nashville-shores", "Nashville Shores RV Park", "Tennessee", "Hermitage",
             "https://nashvilleshores.com/lodging/",
             "Right on the shore of Percy Priest Lake: lakefront sites with concrete pads and full hookups, a "
             "short drive from Nashville.",
             36.15645, -86.60642, frozenset({L}), 226),
        Park("mountain-lakes", "Mountain Lakes Resort", "Alabama", "Langston", "https://mountainlakesrvpark.com/",
             "On the eastern shore of 68,000-acre Lake Guntersville, with waterfront access, mountain-lake views "
             "and full hookups.",
             34.46252, -86.18366, frozenset({L}), 122),
        Park("quail-creek", "Quail Creek Resort", "Alabama", "Hartselle", "https://www.qcresort.com/",
             "A quiet, rural park in the Appalachian foothills with a fishing pond, a golf course and "
             "pull-through RV sites.",
             34.38876, -86.86359, frozenset(), 174),
    )
}

_NEEDS = {"mountains": "mountain parks", "lake": "lake parks"}


def resolve(park_slug: str | None, addon_codes: list[str] | None) -> tuple[Park | None, list[Addon]]:
    """Validate a park choice and the extras requested for it."""
    park = None
    if park_slug:
        park = PARKS.get(park_slug)
        if park is None:
            raise ApiError("Please choose a campground from the list.")
    codes = list(dict.fromkeys(c for c in (addon_codes or []) if c))  # unique, in order
    addons = []
    for code in codes:
        addon = ADDONS.get(code)
        if addon is None:
            raise ApiError("That extra isn't available.")
        if park is None:
            raise ApiError("Choose your campground to add extras.")
        if addon.terrain not in park.terrain:
            raise ApiError(f"{addon.name}s are only available at {_NEEDS[addon.terrain]}.")
        addons.append(addon)
    return park, addons


def resolve_transport(code: str | None, park: Park | None, towing_experience: bool) -> str:
    """Validate how the trailer gets to the campsite."""
    code = code or "self"
    if code not in TRANSPORT_CODES:
        raise ApiError("Please choose how the trailer gets to the campsite.")
    if code == "truck" and not towing_experience:
        raise ApiError(
            "Renting our truck requires experience towing a large trailer. Please confirm it, or choose delivery."
        )
    if code == "delivery" and park is None:
        raise ApiError(
            "Delivery is priced by distance, so please choose a campground from the list (or call us about another one)."
        )
    return code
