/** Preview mode: the site runs with no backend (a static build for showing the
 *  site before the booking system is online). The whole booking flow can be
 *  clicked through, but nothing is saved, charged or sent anywhere.
 *  Turn it on with NEXT_PUBLIC_BOOKING_MODE=preview (see `npm run build:preview`). */
import type { Camper, QuoteResponse } from "./api";

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
  "description": "A 2026 Keystone Montana 3795FK. Four slide-outs open it up into a real home: a raised front kitchen with a residential refrigerator, a living room with theater seating, two sofas and a fireplace, and a private king bedroom with its own closet. It sleeps six, runs two-zone air conditioning on 50 amp service and carries 70 gallons of fresh water. We deliver it to your campsite, level it and hook everything up, so you arrive to a home that is ready.",
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

function quote(body: { start?: string; end?: string }): QuoteResponse {
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

  const subtotal = cents(Number(t.daily_rate) * nights);
  const total = cents(subtotal + Number(t.cleaning_fee));
  const deposit = cents((total * DEPOSIT_PERCENT) / 100);
  return {
    available: true,
    deposit_percent: DEPOSIT_PERCENT,
    quote: {
      days: nights,
      daily_rate: fixed(Number(t.daily_rate)),
      subtotal: fixed(subtotal),
      cleaning_fee: fixed(Number(t.cleaning_fee)),
      total: fixed(total),
      deposit_due: fixed(deposit),
      balance_due: fixed(total - deposit),
      security_deposit: fixed(Number(t.security_deposit)),
    },
  };
}

/** Answers the API calls the public pages make, without a server. */
export async function previewApi<T>(path: string, init?: RequestInit): Promise<T> {
  const route = path.split("?")[0];
  const slug = PREVIEW_TRAILER.slug;
  let result: unknown;
  if (route === "/api/campers") result = { campers: [PREVIEW_TRAILER] };
  else if (route === `/api/campers/${slug}`) result = { camper: PREVIEW_TRAILER };
  else if (route === `/api/campers/${slug}/availability`) result = { booked: [] };
  else if (route === "/api/quote") result = quote(JSON.parse(String(init?.body ?? "{}")));
  else if (route.startsWith("/api/campers/")) throw new PreviewError("Camper not found.", 404);
  else if (route.startsWith("/api/admin")) {
    throw new PreviewError("The owner dashboard goes online together with the booking system.", 503);
  } else {
    throw new PreviewError("Online booking isn't open yet. Nothing was saved or charged.", 503);
  }
  return result as T;
}
