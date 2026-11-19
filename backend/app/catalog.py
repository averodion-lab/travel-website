"""Campgrounds we deliver to, and the extras offered at each.

Off-road parks (terrain "offroad") are private ATV/UTV parks with an RV campground.

Lake parks offer a jet ski. The 4-wheeler is an extra on any trip, but it is
not tied to a park or shown on the map (many parks do not allow riding; the
guest checks with the campground). A park can be mountains, lake or both. Add-on prices are PLACEHOLDERS until the owner confirms them.
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
    daily_rate: Decimal  # per day, per unit
    terrain: str  # the park must have this terrain to offer it ("any" = everywhere)
    description: str
    max_qty: int = 1  # how many a guest may add (e-bikes: up to 3)
    gear: str = ""  # safety gear that comes with it, shown with an icon

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "name": self.name,
            "daily_rate": str(self.daily_rate),
            "terrain": self.terrain,
            "description": self.description,
            "max_qty": self.max_qty,
            "gear": self.gear,
        }


@dataclass(frozen=True)
class AddonChoice:
    """An extra the guest picked, with how many."""

    addon: Addon
    qty: int = 1

    @property
    def code(self) -> str:
        return self.addon.code

    @property
    def name(self) -> str:
        return self.addon.name

    @property
    def daily_rate(self) -> Decimal:
        return self.addon.daily_rate


# Date changes are free up to this many hours before pickup (with no set
# pickup time, that means through the day before the pickup date).
FREE_CHANGE_HOURS = 24

# Cancelling: free for this many hours after payment, whenever the trip is.
FREE_CANCEL_HOURS = 24
# After that, the share of the paid deposit refunded by days left before
# pickup (first matching row wins). Kinder than the big RV platforms, which
# usually refund in full only 30+ days out and add processing fees.
CANCEL_REFUNDS: tuple[tuple[int, int], ...] = ((14, 100), (7, 50), (0, 0))

# The refundable security deposit (held at pickup) applies to every booking,
# including the trailer on its own.

# Where the trailer is kept; delivery miles are counted from here.
BASE = "Canton / Woodstock, GA"
BASE_LAT, BASE_LNG = 34.169, -84.505

# Delivery and setup: per mile, one way (the drive to the campground at
# drop-off). Picking it up afterwards is not charged.
DELIVERY_PER_MILE = Decimal("4.50")
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
class Ramp:
    """Where a jet ski goes into the water at a lake park: a boat ramp mapped
    in OpenStreetMap (leisure=slipway), checked against the park's own pages.
    `in_park`: inside the park itself; otherwise the nearest public ramp."""

    name: str
    lat: float
    lng: float
    in_park: bool
    miles: float  # straight-line miles from the campground
    fee: str = ""  # e.g. "Free", "Park parking fee"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "in_park": self.in_park,
            "miles": self.miles,
            "fee": self.fee,
        }


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
    def ramp(self) -> Ramp | None:
        return RAMPS.get(self.slug)

    @property
    def addons(self) -> list[Addon]:
        return [a for a in ADDONS.values() if a.terrain == "any" or a.terrain in self.terrain]

    def to_dict(self) -> dict:
        return {
            "ramp": self.ramp.to_dict() if self.ramp else None,
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
        Addon("atv", "4-wheeler", Decimal("150.00"), "any",
              "A 4-wheeler that rides along on the trailer. Check that your campground allows riding.",
              gear="Helmet included"),
        Addon("jetski", "Jet ski", Decimal("250.00"), "lake",
              "A jet ski that rides along on the trailer, ready for the lake.",
              gear="Life jacket included"),
        Addon("ebike", "Electric bike", Decimal("33.00"), "any",
              "Electric bikes waiting at the trailer, for the trails and the lake path. Up to three.",
              max_qty=3),
    )
}

M, L, O = "mountains", "lake", "offroad"

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
        # Off-road riding parks: private ATV/UTV parks with an RV campground. Pins are checked
        # against the parks' own pages (Nov 2026); Windrock also answered our questions by email.
        Park("windrock", "Windrock Park", "Tennessee", "Oliver Springs", "https://windrockpark.com/",
             "A privately owned off-road park with hundreds of miles of ATV and off-road trails, open around the "
             "clock. The campground has dry camping and full-hookup sites, and rigs well over 40 feet are "
             "regulars (the road up is steep and winding: gear down). A land-use permit is needed to ride.",
             36.054454, -84.329461, frozenset({O}), 179),
        Park("top-trails", "Top Trails Outdoor Park", "Alabama", "Talladega", "https://toptrails.net/",
             "A 2,800-acre off-road park with more than 100 miles of ATV, UTV and dirt-bike trails. Its website "
             "lists primitive camping and full RV hookups.",
             33.469817, -86.063624, frozenset({O}), 130),
        Park("carolina-adventure-world", "Carolina Adventure World", "South Carolina", "Winnsboro",
             "https://carolinaadventureworld.com/",
             "A 2,600-acre off-road park with 100+ miles of ATV, UTV and dirt-bike trails. Its website lists RV "
             "sites with water and electric and an improved dry-camping option.",
             34.48654, -80.954798, frozenset({O}), 285),
        Park("durhamtown", "Durhamtown Off Road Resort", "Georgia", "Union Point", "https://durhamtown.com/",
             "A big off-road resort east of Atlanta, with more than 100 miles of trails for ATVs, side-by-sides "
             "and 4x4s, and RV parks and cabins on site.",
             33.672104, -82.997593, frozenset({O}), 128),
        Park("choccolocco", "Choccolocco Mountain ORV Park", "Alabama", "Jacksonville",
             "https://www.alabama.travel/places-to-go/choccolocco-mountain-off-road-vehicle-park",
             "A mountain off-road park with ATV trails and an on-site campground; directory listings mention "
             "primitive camping and RV hookups.",
             33.811295, -85.741722, frozenset({O}), 98),
    )
}

# Boat ramps for the lake parks (jet skis go in here). Positions are mapped
# boat ramps from OpenStreetMap (leisure=slipway), Nov 2026; names, fees and
# "inside the park" from the parks' own pages and ramp directories. Every
# park with "lake" terrain must have one (tests/test_ramps.py).
RAMPS: dict[str, Ramp] = {
    "red-top-mountain": Ramp("Red Top Mountain boat ramp", 34.14711, -84.71862, True, 0.6, "Park parking fee"),
    "don-carter": Ramp("Don Carter State Park boat ramp", 34.39073, -83.73889, True, 0.4, "Park parking fee"),
    "devils-fork": Ramp("Devils Fork main boat ramp", 34.96325, -82.94961, True, 0.4, "Park entry fee"),
    "harrison-bay": Ramp("Wolftever Bridge boat launch", 35.15016, -85.10798, True, 0.3, "Free"),
    "lake-guntersville": Ramp("Lake Guntersville State Park ramp", 34.39957, -86.20956, True, 0.3),
    "nashville-shores": Ramp("Nashville Shores marina ramp", 36.15485, -86.60553, True, 0.1),
    "lake-nottely": Ramp("Lake Nottely RV Park boat ramp", 34.8736, -84.00427, True, 0.2),
    "carolina-landing": Ramp("Glenn Ferry boat ramp", 34.48826, -82.94535, False, 2.0, "Free"),
    "mountain-lakes": Ramp("Town Creek (Hwy 227) boat ramp", 34.4063, -86.1781, False, 3.9, "Free"),
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


def _parse_addon(value: str) -> tuple[str, int]:
    """'ebike:2' -> ('ebike', 2); 'jetski' -> ('jetski', 1)."""
    code, _, qty = value.partition(":")
    if not qty:
        return code, 1
    try:
        return code, int(qty)
    except ValueError:
        raise ApiError("Please choose how many.") from None


def resolve(
    park_slug: str | None, addon_codes: list[str] | None, place: Place | None = None
) -> tuple[Park | Place | None, list[AddonChoice]]:
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
    picked: dict[str, int] = {}
    for value in addon_codes or []:
        if not value:
            continue
        code, qty = _parse_addon(value)
        picked.setdefault(code, qty)  # first mention wins, order kept
    addons = []
    for code, qty in picked.items():
        addon = ADDONS.get(code)
        if addon is None:
            raise ApiError("That extra isn't available.")
        if park is None:
            raise ApiError("Choose your campground to add extras.")
        if addon.terrain != "any" and addon.terrain not in park.terrain:
            raise ApiError(f"{addon.name}s are only available at {_NEEDS[addon.terrain]}.")
        if not 1 <= qty <= addon.max_qty:
            raise ApiError(
                f"You can add up to {addon.max_qty} {addon.name.lower()}s."
                if addon.max_qty > 1
                else f"One {addon.name.lower()} per booking."
            )
        addons.append(AddonChoice(addon, qty))
    return park, addons


def resolve_transport(
    code: str | None, park: Park | Place | None, towing_experience: bool, booking: bool = False
) -> str:
    """Validate how the trailer gets to the campsite. Towing it yourself needs
    confirmed towing experience too, checked when booking (`booking`): a quote
    for "your own truck" is free either way."""
    code = code or "self"
    if code not in TRANSPORT_CODES:
        raise ApiError("Please choose how the trailer gets to the campsite.")
    if code == "self" and booking and not towing_experience:
        raise ApiError(
            "Towing the trailer yourself requires experience towing a large fifth-wheel trailer. "
            "Please confirm it, or choose delivery."
        )
    if code == "truck" and not towing_experience:
        raise ApiError(
            "Renting our truck requires experience towing a large trailer. Please confirm it, or choose delivery."
        )
    if code == "delivery" and park is None:
        raise ApiError(
            "Delivery is priced by distance, so please choose a campground or type where you're staying."
        )
    return code
