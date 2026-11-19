import type { Park, Ramp } from "@/lib/api";
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

/** What a campsite needs for the 40 ft trailer (Destinations and park pages). */
export const SITE_NEEDS: [string, string][] = [
  ["Site length", "A pull-through or back-in site of 45 feet or more."],
  ["Power", "50 amp electric service."],
  ["Hookups", "Water and sewer at the site for the full-comfort experience."],
  ["Access", "Paved or well-graded roads without low bridges. The trailer stands 13 ft 4 in tall."],
];

/** "Mountains and lake", "Mountains", "Lake", "Off-road riding" or "Foothills". */
export function terrainLabel(p: Pick<Park, "terrain">): string {
  if (p.terrain.includes("offroad")) return "Off-road riding";
  const m = p.terrain.includes("mountains");
  const l = p.terrain.includes("lake");
  return m && l ? "Mountains and lake" : m ? "Mountains" : l ? "Lake" : "Foothills";
}

/** Banner photo for a park page, by what the park offers. */
export function parkHero(terrain: readonly string[]): string {
  if (terrain.includes("offroad")) return "/images/blueridge-road.jpg";
  const m = terrain.includes("mountains");
  const l = terrain.includes("lake");
  return m && l ? "/images/lake-fall.jpg" : l ? "/images/lake-campsite.jpg" : m ? "/images/blueridge-rays.jpg" : "/images/smoky-meadow.jpg";
}

/** "In the park · Free" or "Public ramp 2 miles away · Free". */
export function rampWhere(r: Ramp) {
  const where = r.in_park
    ? "In the park"
    : `Public ramp ${r.miles} mile${r.miles === 1 ? "" : "s"} away`;
  return r.fee ? `${where} · ${r.fee}` : where;
}
