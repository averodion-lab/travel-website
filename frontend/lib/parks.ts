import type { Ramp } from "@/lib/api";
import { api, type ParksResponse } from "./api";

/** Campgrounds and extras, or null if the API is down. Server components only. */
export async function getParks(): Promise<ParksResponse | null> {
  try {
    return await api<ParksResponse>("/api/parks");
  } catch {
    return null;
  }
}

export const STATE_ORDER = ["Georgia", "South Carolina", "North Carolina", "Tennessee", "Alabama"];

/** "In the park · Free" or "Public ramp 2 miles away · Free". */
export function rampWhere(r: Ramp) {
  const where = r.in_park
    ? "In the park"
    : `Public ramp ${r.miles} mile${r.miles === 1 ? "" : "s"} away`;
  return r.fee ? `${where} · ${r.fee}` : where;
}
