/** Preview mode: the site runs with no backend (a static build for showing the
 *  site before the booking system is online). The whole booking flow can be
 *  clicked through, but nothing is saved, charged or sent anywhere.
 *  Turn it on with NEXT_PUBLIC_BOOKING_MODE=preview (see `npm run build:preview`). */
import type { AddonLine, Camper, ParksResponse, QuoteResponse, TransportLine } from "./api";

export const PREVIEW = process.env.NEXT_PUBLIC_BOOKING_MODE === "preview";

// Copy of the trailer as the API returns it (backend/app/seed_data.py).
// Keep the two in sync when the trailer's details or prices change.
export const PREVIEW_TRAILER: Camper = {
  "amenities": [
    "King bedroom with closet",
    "Two hide-a-bed sofas",
    "Theater seating",
    "Electric fireplace",
    "Entertainment center with TV",
    "Front kitchen",
    "Residential refrigerator",
    "Gas range and oven",
    "Microwave",
    "Walk-in pantry",
    "Double-sink bathroom",
    "Glass-door shower",
    "Four slide-outs",
    "Air conditioning and furnace",
    "Power awnings",
    "Outside shower",
    "Outdoor speakers",
    "Pass-through storage",
    "Bedding and towels",
    "Cookware and dishes"
  ],
  "class_type": "Luxury Fifth Wheel",
  "cleaning_fee": "175.00",
  "daily_rate": "249.00",
  "description": "A 2026 Keystone Montana 3795FK. Four slide-outs open it up into a real home: a raised front kitchen with a residential refrigerator, a living room with theater seating, two sofas and a fireplace, and a private king bedroom with its own closet. It sleeps six, runs two-zone air conditioning on 50 amp service and carries 70 gallons of fresh water. Tow it with your truck, rent ours, or have us deliver it, level it and hook everything up, so you arrive to a home that is ready.",
  "featured": true,
  "gallery": [
    "/images/montana/exterior.jpg",
    "/images/montana/living-1.jpg",
    "/images/montana/kitchen.jpg",
    "/images/montana/bedroom-1.jpg",
    "/images/montana/living-2.jpg",
    "/images/montana/fridge.jpg",
    "/images/montana/stove-oven.jpg",
    "/images/montana/bedroom-2.jpg",
    "/images/montana/bathroom-1.jpg",
    "/images/montana/entertainment-center.jpg",
    "/images/montana/fireplace.jpg",
    "/images/montana/bathroom-2.jpg",
    "/images/montana/pantry.jpg",
    "/images/montana/bedroom-closet.jpg",
    "/images/montana/campside.jpg",
    "/images/montana/off-campside.jpg",
    "/images/montana/pass-through-storage.jpg",
    "/images/montana/floorplan.jpg"
  ],
  "hitch_type": "Fifth-wheel hitch, one-ton truck (17,070 lb GVWR). Delivery available.",
  "hookups": "Full hookups: 50 amp electric, water, sewer. 70 gal fresh water tank.",
  "id": 7,
  "image_url": "/images/montana/exterior.jpg",
  "layout": "Front kitchen, central living room, king bedroom",
  "length_ft": 39.9,
  "min_nights": 3,
  "name": "The Montana",
  "security_deposit": "2000.00",
  "sleeps": 6,
  "slug": "montana",
  "tagline": "Forty feet of residential comfort, parked wherever the view is best.",
  "towing_weight_lbs": 13870
};

// Copy of GET /api/parks (backend/app/catalog.py). Keep in sync with it.
export const PREVIEW_PARKS: ParksResponse = {
  "addons": [
    {
      "code": "atv",
      "daily_rate": "150.00",
      "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
      "name": "4-wheeler",
      "terrain": "mountains"
    },
    {
      "code": "jetski",
      "daily_rate": "250.00",
      "description": "A jet ski that rides along on the trailer, ready for the lake.",
      "name": "Jet ski",
      "terrain": "lake"
    }
  ],
  "parks": [
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Blairsville",
      "delivery_miles": 92,
      "description": "At the base of Blood Mountain in the Chattahoochee National Forest, with a 22-acre mountain lake (Lake Trahlyta) and full-hookup RV sites.",
      "lat": 34.76294,
      "lng": -83.92843,
      "name": "Vogel State Park",
      "slug": "vogel",
      "state": "Georgia",
      "terrain": [
        "mountains"
      ],
      "url": "https://gastateparks.org/Vogel"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Chatsworth",
      "delivery_miles": 61,
      "description": "High-elevation overlooks, hiking trails and a tucked-away mountain lake with a swimming beach. RV sites have water and electric hookups.",
      "lat": 34.76069,
      "lng": -84.69515,
      "name": "Fort Mountain State Park",
      "slug": "fort-mountain",
      "state": "Georgia",
      "terrain": [
        "mountains"
      ],
      "url": "https://gastateparks.org/FortMountain"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        },
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Blairsville",
      "delivery_miles": 79,
      "description": "In the Blue Ridge Mountains, with full hookups, mountain views and direct access to Lake Nottely for boating and fishing.",
      "lat": 34.872,
      "lng": -84.006,
      "name": "Lake Nottely RV Park",
      "slug": "lake-nottely",
      "state": "Georgia",
      "terrain": [
        "lake",
        "mountains"
      ],
      "url": "https://lakenottelyrv.com/"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Fair Play",
      "delivery_miles": 106,
      "description": "In the Appalachian foothills right on the shore of Lake Hartwell: classic lakeside camping with full hookups for large rigs.",
      "lat": 34.499,
      "lng": -82.97757,
      "name": "Thousand Trails Carolina Landing",
      "slug": "carolina-landing",
      "state": "South Carolina",
      "terrain": [
        "lake"
      ],
      "url": "https://thousandtrails.com/south-carolina/carolina-landing-rv-resort"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Travelers Rest",
      "delivery_miles": 163,
      "description": "A peaceful park near the Blue Ridge Mountains, centered on a private 3-acre fishing lake, with spacious full-hookup sites.",
      "lat": 35.04014,
      "lng": -82.44025,
      "name": "Sugar Lake RV Park",
      "slug": "sugar-lake",
      "state": "South Carolina",
      "terrain": [
        "mountains"
      ],
      "url": "https://www.sugarlakervpark.com/"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Spruce Pine",
      "delivery_miles": 245,
      "description": "High in the Blue Ridge Mountains, right off the Blue Ridge Parkway, with a private lake, forest trails and full RV hookups.",
      "lat": 35.89239,
      "lng": -81.97537,
      "name": "Spacious Skies Bear Den",
      "slug": "bear-den",
      "state": "North Carolina",
      "terrain": [
        "mountains"
      ],
      "url": "https://spaciousskiescampgrounds.com/bear-den/"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Lake Toxaway",
      "delivery_miles": 150,
      "description": "A mountain retreat surrounded by creeks and waterfalls, a base for hiking, kayaking and rock climbing.",
      "lat": 35.1438145,
      "lng": -82.930422,
      "name": "Blue Ridge Falls RV & Glamping Resort",
      "slug": "blue-ridge-falls",
      "state": "North Carolina",
      "terrain": [
        "mountains"
      ],
      "url": "https://blueridgefallsrvresort.com/"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Gatlinburg",
      "delivery_miles": 177,
      "description": "A wooded resort bordering Great Smoky Mountains National Park, with a running creek and fully equipped concrete RV pads.",
      "lat": 35.72521,
      "lng": -83.48267,
      "name": "Twin Creek RV Resort",
      "slug": "twin-creek",
      "state": "Tennessee",
      "terrain": [
        "mountains"
      ],
      "url": "https://twincreekrvresort.com/"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Hermitage",
      "delivery_miles": 226,
      "description": "Right on the shore of Percy Priest Lake: lakefront sites with concrete pads and full hookups, a short drive from Nashville.",
      "lat": 36.15645,
      "lng": -86.60642,
      "name": "Nashville Shores RV Park",
      "slug": "nashville-shores",
      "state": "Tennessee",
      "terrain": [
        "lake"
      ],
      "url": "https://nashvilleshores.com/lodging/"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Langston",
      "delivery_miles": 122,
      "description": "On the eastern shore of 68,000-acre Lake Guntersville, with waterfront access, mountain-lake views and full hookups.",
      "lat": 34.46252,
      "lng": -86.18366,
      "name": "Mountain Lakes Resort",
      "slug": "mountain-lakes",
      "state": "Alabama",
      "terrain": [
        "lake"
      ],
      "url": "https://mountainlakesrvpark.com/"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Acworth",
      "delivery_miles": 28,
      "description": "On a wooded peninsula in Lake Allatoona, about half an hour from our base, with RV sites that have water and electric hookups.",
      "lat": 34.14676,
      "lng": -84.70765,
      "name": "Red Top Mountain State Park",
      "slug": "red-top-mountain",
      "state": "Georgia",
      "terrain": [
        "lake"
      ],
      "url": "https://gastateparks.org/RedTopMountain"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Gainesville",
      "delivery_miles": 62,
      "description": "The only state park on Lake Lanier, with a sandy swimming beach, a boat ramp and roomy RV sites with water and electric hookups.",
      "lat": 34.39011,
      "lng": -83.74615,
      "name": "Don Carter State Park",
      "slug": "don-carter",
      "state": "Georgia",
      "terrain": [
        "lake"
      ],
      "url": "https://gastateparks.org/DonCarter"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Helen",
      "delivery_miles": 75,
      "description": "In the North Georgia mountains just outside the Alpine town of Helen, with a small lake, trails to Anna Ruby Falls and water and electric RV sites.",
      "lat": 34.7135,
      "lng": -83.72616,
      "name": "Unicoi State Park & Lodge",
      "slug": "unicoi",
      "state": "Georgia",
      "terrain": [
        "mountains"
      ],
      "url": "https://gastateparks.org/Unicoi"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        }
      ],
      "city": "Rising Fawn",
      "delivery_miles": 97,
      "description": "On the edge of a deep sandstone gorge on Lookout Mountain, with waterfalls, canyon-rim trails and water and electric RV sites.",
      "lat": 34.8385,
      "lng": -85.47664,
      "name": "Cloudland Canyon State Park",
      "slug": "cloudland-canyon",
      "state": "Georgia",
      "terrain": [
        "mountains"
      ],
      "url": "https://gastateparks.org/CloudlandCanyon"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        },
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Salem",
      "delivery_miles": 133,
      "description": "The only public access to Lake Jocassee, with clear mountain water and waterfalls. Lakeside RV sites with water and electric; some take rigs up to 40 feet.",
      "lat": 34.95869,
      "lng": -82.95442,
      "name": "Devils Fork State Park",
      "slug": "devils-fork",
      "state": "South Carolina",
      "terrain": [
        "lake",
        "mountains"
      ],
      "url": "https://southcarolinaparks.com/devils-fork"
    },
    {
      "addons": [
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Harrison",
      "delivery_miles": 100,
      "description": "On the shore of Chickamauga Lake near Chattanooga, with a marina and lakeside RV sites with water and electric hookups.",
      "lat": 35.14751,
      "lng": -85.10395,
      "name": "Harrison Bay State Park",
      "slug": "harrison-bay",
      "state": "Tennessee",
      "terrain": [
        "lake"
      ],
      "url": "https://tnstateparks.com/parks/harrison-bay"
    },
    {
      "addons": [
        {
          "code": "atv",
          "daily_rate": "150.00",
          "description": "A 4-wheeler that rides along on the trailer, for exploring mountain trails.",
          "name": "4-wheeler",
          "terrain": "mountains"
        },
        {
          "code": "jetski",
          "daily_rate": "250.00",
          "description": "A jet ski that rides along on the trailer, ready for the lake.",
          "name": "Jet ski",
          "terrain": "lake"
        }
      ],
      "city": "Guntersville",
      "delivery_miles": 127,
      "description": "High on the bluffs above Lake Guntersville, with full-hookup sites (water, electric and sewer), forest trails and a lakeside beach.",
      "lat": 34.39491,
      "lng": -86.20797,
      "name": "Lake Guntersville State Park",
      "slug": "lake-guntersville",
      "state": "Alabama",
      "terrain": [
        "lake",
        "mountains"
      ],
      "url": "https://www.alapark.com/parks/lake-guntersville-state-park"
    },
    {
      "addons": [],
      "city": "Hartselle",
      "delivery_miles": 174,
      "description": "A quiet, rural park in the Appalachian foothills with a fishing pond, a golf course and pull-through RV sites.",
      "lat": 34.38876,
      "lng": -86.86359,
      "name": "Quail Creek Resort",
      "slug": "quail-creek",
      "state": "Alabama",
      "terrain": [],
      "url": "https://www.qcresort.com/"
    }
  ],
  "transport": {
    "base": "Canton / Woodstock, GA",
    "delivery": {
      "per_mile": "3.50",
      "trips": 1
    },
    "truck": {
      "code": "truck",
      "daily_rate": "175.00",
      "description": "Our black 2026 RAM 2500 Turbo Diesel with a fifth-wheel hitch. For drivers with experience towing a large trailer.",
      "name": "2026 RAM 2500 Turbo Diesel"
    }
  }
};

// Same rules as backend/app/services/pricing.py, for display only.
const DEPOSIT_PERCENT = 30;
const MAX_NIGHTS = 60;

class PreviewError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const cents = (n: number) => Math.round(n * 100) / 100;
const fixed = (n: number) => cents(n).toFixed(2);

const NEEDS = { mountains: "mountain parks", lake: "lake parks" } as const;

/* A destination the guest typed in: same rules as catalog.custom_place() on the
   server. The preview has no server, so the browser measures the road miles
   from the same routing service. */
const BASE = { lat: 34.169, lng: -84.505 };
const MAX_DELIVERY_MILES = 400;
const REGION = { lat: [24, 40], lng: [-92, -75] };
const milesCache = new Map<string, number>();

type TypedPlace = { name: string; lat: number; lng: number; delivery_miles: number };

async function typedPlace(raw: { name?: string; lat?: number; lng?: number } | undefined): Promise<TypedPlace> {
  const name = (raw?.name ?? "").trim();
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!name) throw new PreviewError("Please type where you're staying and pick it from the suggestions.");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new PreviewError("Please pick the place from the suggestions so we can find it on the map.");
  }
  if (lat < REGION.lat[0] || lat > REGION.lat[1] || lng < REGION.lng[0] || lng > REGION.lng[1]) {
    throw new PreviewError("That place is outside the area we deliver to. Please contact us about it.");
  }
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  let miles = milesCache.get(key);
  if (miles === undefined) {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${BASE.lng},${BASE.lat};${lng},${lat}?overview=false`,
      );
      const data = await res.json();
      miles = Math.round(data.routes[0].distance / 1609.344);
      milesCache.set(key, miles);
    } catch {
      throw new PreviewError(
        "We couldn't measure the distance to that place right now. Please try again, choose a campground from the list, or contact us.",
        503,
      );
    }
  }
  if (miles > MAX_DELIVERY_MILES) {
    throw new PreviewError(
      `That place is ${miles} miles from our base, further than we deliver. Please contact us and we'll see what we can do.`,
    );
  }
  return { name, lat, lng, delivery_miles: miles };
}

/** Same checks as catalog.resolve() on the server. */
function extras(parkSlug: string | undefined, codes: string[] | undefined, nights: number, place?: TypedPlace): AddonLine[] {
  // A typed place may ask for either extra (the owner confirms).
  const park = place
    ? { terrain: ["mountains", "lake"] as string[] }
    : parkSlug
      ? PREVIEW_PARKS.parks.find((p) => p.slug === parkSlug)
      : undefined;
  if (parkSlug && !park) throw new PreviewError("Please choose a campground from the list.");
  return [...new Set(codes ?? [])].map((code) => {
    const addon = PREVIEW_PARKS.addons.find((a) => a.code === code);
    if (!addon) throw new PreviewError("That extra isn't available.");
    if (!park) throw new PreviewError("Choose your campground to add extras.");
    if (!(park.terrain as string[]).includes(addon.terrain)) {
      throw new PreviewError(`${addon.name}s are only available at ${NEEDS[addon.terrain]}.`);
    }
    const rate = Number(addon.daily_rate);
    return { code, name: addon.name, daily_rate: fixed(rate), days: nights, total: fixed(rate * nights) };
  });
}

/** Same rules as catalog.resolve_transport() and pricing.transport_line(). */
function getThere(
  code: string | undefined,
  parkSlug: string | undefined,
  experience: boolean,
  nights: number,
  place?: TypedPlace,
): TransportLine {
  const c = code || "self";
  const park = place ?? PREVIEW_PARKS.parks.find((p) => p.slug === parkSlug);
  const t = PREVIEW_PARKS.transport;
  if (c === "truck") {
    if (!experience) {
      throw new PreviewError("Renting our truck requires experience towing a large trailer. Please confirm it, or choose delivery.");
    }
    const rate = Number(t.truck.daily_rate);
    return { code: "truck", name: `${t.truck.name} rental`, daily_rate: fixed(rate), days: nights, total: fixed(rate * nights) };
  }
  if (c === "delivery") {
    if (!park) {
      throw new PreviewError("Delivery is priced by distance, so please choose a campground or type where you're staying.");
    }
    const per = Number(t.delivery.per_mile);
    return {
      code: "delivery",
      name: "Delivery and setup",
      miles: park.delivery_miles,
      trips: t.delivery.trips,
      per_mile: fixed(per),
      total: fixed(per * park.delivery_miles * t.delivery.trips),
    };
  }
  if (c !== "self") throw new PreviewError("Please choose how the trailer gets to the campsite.");
  return { code: "self", name: "Your own truck", total: "0.00" };
}

async function quote(body: {
  start?: string;
  end?: string;
  park?: string;
  place?: { name?: string; lat?: number; lng?: number };
  addons?: string[];
  transport?: string;
  towing_experience?: boolean;
}): Promise<QuoteResponse> {
  const t = PREVIEW_TRAILER;
  const start = body.start ?? "";
  const end = body.end ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new PreviewError("Please choose valid dates.");
  }
  const nights = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
  if (nights <= 0) throw new PreviewError("Return date must be after the pickup date.");
  if (nights < t.min_nights) throw new PreviewError(`This camper has a ${t.min_nights}-night minimum rental.`);
  if (nights > MAX_NIGHTS) throw new PreviewError(`Rentals are limited to ${MAX_NIGHTS} nights. Contact us for longer trips.`);

  const place = body.park === "custom" ? await typedPlace(body.place) : undefined;
  const lines = extras(body.park, body.addons, nights, place);
  const transport = getThere(body.transport, body.park, body.towing_experience === true, nights, place);
  const addonsTotal = cents(lines.reduce((sum, l) => sum + Number(l.total), 0));
  const subtotal = cents(Number(t.daily_rate) * nights);
  const total = cents(subtotal + Number(t.cleaning_fee) + addonsTotal + Number(transport.total));
  const deposit = cents((total * DEPOSIT_PERCENT) / 100);
  return {
    available: true,
    deposit_percent: DEPOSIT_PERCENT,
    place: place ? { name: place.name, delivery_miles: place.delivery_miles } : null,
    quote: {
      days: nights,
      daily_rate: fixed(Number(t.daily_rate)),
      subtotal: fixed(subtotal),
      cleaning_fee: fixed(Number(t.cleaning_fee)),
      total: fixed(total),
      deposit_due: fixed(deposit),
      balance_due: fixed(total - deposit),
      security_deposit: fixed(Number(t.security_deposit)),
      addons: lines,
      addons_total: fixed(addonsTotal),
      transport,
    },
  };
}

/** Answers the API calls the public pages make, without a server. */
export async function previewApi<T>(path: string, init?: RequestInit): Promise<T> {
  const route = path.split("?")[0];
  const slug = PREVIEW_TRAILER.slug;
  let result: unknown;
  if (route === "/api/parks") result = PREVIEW_PARKS;
  else if (route === "/api/campers") result = { campers: [PREVIEW_TRAILER] };
  else if (route === `/api/campers/${slug}`) result = { camper: PREVIEW_TRAILER };
  else if (route === `/api/campers/${slug}/availability`) result = { booked: [] };
  else if (route === "/api/quote") result = await quote(JSON.parse(String(init?.body ?? "{}")));
  else if (route === "/api/distance") {
    const q = new URLSearchParams(path.split("?")[1] ?? "");
    const place = await typedPlace({ name: "place", lat: Number(q.get("lat")), lng: Number(q.get("lng")) });
    const per = Number(PREVIEW_PARKS.transport.delivery.per_mile);
    result = { delivery_miles: place.delivery_miles, delivery_total: fixed(per * place.delivery_miles * PREVIEW_PARKS.transport.delivery.trips) };
  } else if (route === "/api/contact") {
    throw new PreviewError(
      "The contact form goes online together with booking. Nothing was sent; please email or call us for now.",
      503,
    );
  }
  else if (route.startsWith("/api/campers/")) throw new PreviewError("Camper not found.", 404);
  else if (route.startsWith("/api/admin")) {
    throw new PreviewError("The owner dashboard goes online together with the booking system.", 503);
  } else {
    throw new PreviewError("Online booking isn't open yet. Nothing was saved or charged.", 503);
  }
  return result as T;
}
