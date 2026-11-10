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
