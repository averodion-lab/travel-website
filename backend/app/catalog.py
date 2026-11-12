"""Campgrounds we deliver to, and the extras offered at each.

Mountain parks offer a 4-wheeler; lake parks offer a jet ski. A park can be
both. Add-on prices are PLACEHOLDERS until the owner confirms them.
The frontend's preview copy (frontend/lib/preview.ts) mirrors this file.

Coordinates: street addresses geocoded with the US Census geocoder or
OpenStreetMap (Nov 2026); Blue Ridge Falls from its own website; Lake
Nottely from The Dyrt listing (its own website was unreachable).

Getting there: guests tow with their own truck, rent ours (TRUCK, per day,
towing experience required) or have us deliver and set up the trailer
(DELIVERY_PER_MILE, one way: the drive from BASE to the campground at drop-off).
Extras (4-wheeler, jet ski) ride on the trailer, however it gets there.
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

# Delivery and setup: per mile, one way (the drive to the campground at
# drop-off). Picking it up afterwards is not charged.
DELIVERY_PER_MILE = Decimal("3.50")
DELIVERY_TRIPS = 1


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
              "A 4-wheeler that rides along on the trailer, for exploring mountain trails."),
        Addon("jetski", "Jet ski", Decimal("250.00"), "lake",
              "A jet ski that rides along on the trailer, ready for the lake."),
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
        Park("red-top-mountain", "Red Top Mountain State Park", "Georgia", "Acworth",
             "https://gastateparks.org/RedTopMountain",
             "On a wooded peninsula in Lake Allatoona, about half an hour from our base, with RV sites that "
             "have water and electric hookups.",
             34.14676, -84.70765, frozenset({L}), 28),
        Park("don-carter", "Don Carter State Park", "Georgia", "Gainesville", "https://gastateparks.org/DonCarter",
             "The only state park on Lake Lanier, with a sandy swimming beach, a boat ramp and roomy RV sites "
             "with water and electric hookups.",
             34.39011, -83.74615, frozenset({L}), 62),
        Park("unicoi", "Unicoi State Park & Lodge", "Georgia", "Helen", "https://gastateparks.org/Unicoi",
             "In the North Georgia mountains just outside the Alpine town of Helen, with a small lake, trails to "
             "Anna Ruby Falls and water and electric RV sites.",
             34.71350, -83.72616, frozenset({M}), 75),
        Park("cloudland-canyon", "Cloudland Canyon State Park", "Georgia", "Rising Fawn",
             "https://gastateparks.org/CloudlandCanyon",
             "On the edge of a deep sandstone gorge on Lookout Mountain, with waterfalls, canyon-rim trails and "
             "water and electric RV sites.",
             34.83850, -85.47664, frozenset({M}), 97),
        Park("devils-fork", "Devils Fork State Park", "South Carolina", "Salem", "https://southcarolinaparks.com/devils-fork",
             "The only public access to Lake Jocassee, with clear mountain water and waterfalls. Lakeside RV sites "
             "with water and electric; some take rigs up to 40 feet.",
             34.95869, -82.95442, frozenset({M, L}), 133),
        Park("harrison-bay", "Harrison Bay State Park", "Tennessee", "Harrison", "https://tnstateparks.com/parks/harrison-bay",
             "On the shore of Chickamauga Lake near Chattanooga, with a marina and lakeside RV sites with water "
             "and electric hookups.",
             35.14751, -85.10395, frozenset({L}), 100),
        Park("lake-guntersville", "Lake Guntersville State Park", "Alabama", "Guntersville",
             "https://www.alapark.com/parks/lake-guntersville-state-park",
             "High on the bluffs above Lake Guntersville, with full-hookup sites (water, electric and sewer), "
             "forest trails and a lakeside beach.",
             34.39491, -86.20797, frozenset({M, L}), 127),
        Park("quail-creek", "Quail Creek Resort", "Alabama", "Hartselle", "https://www.qcresort.com/",
             "A quiet, rural park in the Appalachian foothills with a fishing pond, a golf course and "
             "pull-through RV sites.",
             34.38876, -86.86359, frozenset(), 174),
    )
}

_NEEDS = {"mountains": "mountain parks", "lake": "lake parks"}

# A destination the guest types in instead of choosing one of our parks.
CUSTOM_SLUG = "custom"
MAX_DELIVERY_MILES = 400
# Rough box around the Southeast; anything outside is refused before measuring.
REGION = {"lat": (24.0, 40.0), "lng": (-92.0, -75.0)}


@dataclass(frozen=True)
class Place:
    """A campground or address the guest typed in. Road miles are measured by
    the server (services.distance), never taken from the client. Both extras
    can be requested; the owner confirms them with the guest."""

    name: str
    lat: float
    lng: float
    delivery_miles: int
    slug: str = CUSTOM_SLUG
    city: str = ""
    state: str = ""
    terrain: frozenset[str] = frozenset({"mountains", "lake"})

    @property
    def addons(self) -> list[Addon]:
        return list(ADDONS.values())


def custom_place(name, lat, lng) -> Place:
    """Validate a typed destination and measure its road miles from BASE."""
    from .services import distance  # here, to avoid an import cycle

    name = " ".join(str(name or "").split())[:200]
    if not name:
        raise ApiError("Please type where you're staying and pick it from the suggestions.")
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        raise ApiError("Please pick the place from the suggestions so we can find it on the map.") from None
    if not (REGION["lat"][0] <= lat <= REGION["lat"][1] and REGION["lng"][0] <= lng <= REGION["lng"][1]):
        raise ApiError("That place is outside the area we deliver to. Please contact us about it.")
    miles = distance.road_miles(lat, lng)
    if miles > MAX_DELIVERY_MILES:
        raise ApiError(
            f"That place is {miles} miles from our base, further than we deliver. Please contact us and we'll "
            "see what we can do."
        )
    return Place(name=name, lat=lat, lng=lng, delivery_miles=miles)


def resolve(
    park_slug: str | None, addon_codes: list[str] | None, place: Place | None = None
) -> tuple[Park | Place | None, list[Addon]]:
    """Validate a park choice (or a typed place) and the extras requested for it."""
    park = None
    if park_slug == CUSTOM_SLUG:
        if place is None:
            raise ApiError("Please type where you're staying and pick it from the suggestions.")
        park = place
    elif park_slug:
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


def resolve_transport(code: str | None, park: Park | Place | None, towing_experience: bool) -> str:
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
            "Delivery is priced by distance, so please choose a campground or type where you're staying."
        )
    return code
