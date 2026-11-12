import { PREVIEW, previewApi } from "./preview";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001").replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "YourName";

export type Camper = {
  id: number;
  slug: string;
  name: string;
  class_type: string;
  tagline: string | null;
  description: string | null;
  layout: string | null;
  sleeps: number;
  towing_weight_lbs: number | null;
  length_ft: number | null;
  hitch_type: string | null;
  hookups: string | null;
  amenities: string[];
  daily_rate: string;
  cleaning_fee: string;
  security_deposit: string;
  min_nights: number;
  image_url: string | null;
  gallery: string[];
  featured: boolean;
};

export type Addon = {
  code: string;
  name: string;
  daily_rate: string;
  terrain: "mountains" | "lake";
  description: string;
};

export type Park = {
  slug: string;
  name: string;
  state: string;
  city: string;
  url: string;
  description: string;
  lat: number;
  lng: number;
  terrain: ("mountains" | "lake")[];
  addons: Addon[];
  /** Road miles from the base, for delivery pricing. */
  delivery_miles: number;
};

export type TransportCode = "self" | "truck" | "delivery";

/** What the API says about getting the trailer to the campsite. */
export type TransportInfo = {
  base: string;
  truck: { code: "truck"; name: string; daily_rate: string; description: string };
  delivery: { per_mile: string; trips: number };
};

export type ParksResponse = { parks: Park[]; addons: Addon[]; transport: TransportInfo };

/** The getting-there line of a quote or booking. */
export type TransportLine = {
  code: TransportCode;
  name: string;
  total: string;
  miles?: number | null;
  trips?: number;
  per_mile?: string;
  days?: number;
  daily_rate?: string;
};

/** One extra on a quote or booking. */
export type AddonLine = { code: string; name: string; daily_rate: string; days: number; total: string };

export type Quote = {
  days: number;
  daily_rate: string;
  subtotal: string;
  cleaning_fee: string;
  total: string;
  deposit_due: string;
  balance_due: string;
  security_deposit: string;
  addons: AddonLine[];
  addons_total: string;
  transport: TransportLine;
};

export type QuoteResponse = { quote: Quote; available: boolean; deposit_percent: number };

export type PublicBooking = {
  reference: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  first_name: string;
  camper: { slug: string; name: string; image_url: string | null };
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: string;
  cleaning_fee: string;
  total_price: string;
  deposit_due: string;
  balance_due: string;
  security_deposit: string;
  park: { slug: string; name: string; city?: string; state?: string } | null;
  addons: AddonLine[];
  addons_total: string;
  transport: TransportLine;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Call the Flask API. Throws ApiError with a message that is safe to show. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (PREVIEW) {
    try {
      return await previewApi<T>(path, init);
    } catch (e) {
      const err = e as Error & { status?: number; code?: string };
      throw new ApiError(err.message, err.status ?? 400, err.code);
    }
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError("We couldn't reach the server. Please try again in a moment.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? "Something went wrong. Please try again.", res.status, body?.code);
  }
  return body as T;
}

export const CAMPER_CLASSES = ["Travel Trailer", "Fifth Wheel", "Class B", "Class C"];
