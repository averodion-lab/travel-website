"use client";

import { useEffect, useState } from "react";
import { api, type TypedPlace } from "./api";

/** The park value used for "somewhere else (typed in)". */
export const CUSTOM = "custom";

/** Reads a typed place from the URL (?place=…&plat=…&plng=…). */
export function placeFromParams(params: URLSearchParams | { get(k: string): string | null }): TypedPlace | null {
  const name = params.get("place");
  const lat = Number(params.get("plat"));
  const lng = Number(params.get("plng"));
  return name && Number.isFinite(lat) && Number.isFinite(lng) && params.get("plat") ? { name, lat, lng } : null;
}

/** Writes a typed place into URL search params. */
export function setPlaceParams(qs: URLSearchParams, place: TypedPlace | null) {
  if (!place) return;
  qs.set("place", place.name);
  qs.set("plat", place.lat.toFixed(5));
  qs.set("plng", place.lng.toFixed(5));
}

export type PlaceMiles = { miles?: number; total?: string; error?: string; loading: boolean };

/** Road miles from our base to a typed place, measured by the server. */
export function usePlaceMiles(place: TypedPlace | null): PlaceMiles {
  const key = place ? `${place.lat.toFixed(5)},${place.lng.toFixed(5)}` : "";
  const [result, setResult] = useState<{ key: string; miles?: number; total?: string; error?: string } | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const [lat, lng] = key.split(",");
    api<{ delivery_miles: number; delivery_total: string }>(`/api/distance?lat=${lat}&lng=${lng}`)
      .then((d) => !cancelled && setResult({ key, miles: d.delivery_miles, total: d.delivery_total }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key]);
  const current = result?.key === key ? result : null;
  return { miles: current?.miles, total: current?.total, error: current?.error, loading: !!key && !current };
}
