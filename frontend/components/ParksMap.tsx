"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { Park } from "@/lib/api";
import { rate } from "@/lib/format";
import { STATE_ORDER } from "@/lib/parks";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Pin colour by what the park offers. */
function kind(p: Park): "both" | "mountains" | "lake" | "none" {
  const m = p.terrain.includes("mountains");
  const l = p.terrain.includes("lake");
  return m && l ? "both" : m ? "mountains" : l ? "lake" : "none";
}
const KIND_LABEL = { both: "Mountains and lake", mountains: "Mountains", lake: "Lake", none: "Foothills" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function popupHtml(p: Park) {
  const extras = p.addons.map((a) => `<span class="pm-chip">${esc(a.name)} · ${esc(rate(a.daily_rate))}/day</span>`).join("");
  return `
    <div class="pm-popup">
      <p class="pm-place">${esc(p.city)}, ${esc(p.state)}</p>
      <a class="pm-name" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)} ↗</a>
      <p class="pm-text">${esc(p.description)}</p>
      ${extras ? `<div class="pm-chips">${extras}</div>` : ""}
      <a class="pm-book" href="${BASE}/fleet?park=${encodeURIComponent(p.slug)}#book">Book the trailer here →</a>
    </div>`;
}

export default function ParksMap({ parks }: { parks: Park[] }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const [state, setState] = useState("All");
  const [ready, setReady] = useState(false);

  const states = STATE_ORDER.filter((s) => parks.some((p) => p.state === s));
  const shown = useMemo(() => (state === "All" ? parks : parks.filter((p) => p.state === state)), [parks, state]);

  // Build the map once, in the browser only.
  useEffect(() => {
    let cancelled = false;
    const pins = markers.current;
    import("leaflet").then((L) => {
      if (cancelled || !box.current || map.current) return;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const m = L.map(box.current, {
        scrollWheelZoom: false, // don't hijack page scrolling
        dragging: !touch, // on phones, one finger scrolls the page; use the + and − buttons
        zoomSnap: 0.25,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(m);
      for (const p of parks) {
        const icon = L.divIcon({
          className: "",
          html: `<span class="pm-pin pm-${kind(p)}"><span></span></span>`,
          iconSize: [30, 40],
          iconAnchor: [15, 38],
          popupAnchor: [0, -34],
        });
        const marker = L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name, keyboard: true })
          .bindPopup(popupHtml(p), { maxWidth: 280, className: "pm-leaflet-popup" })
          .addTo(m);
        pins.set(p.slug, marker);
      }
      m.fitBounds(L.latLngBounds(parks.map((p) => [p.lat, p.lng])), { padding: [40, 40] });
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      pins.clear();
    };
  }, [parks]);

  // Zoom to the chosen state.
  useEffect(() => {
    if (!ready || !map.current || shown.length === 0) return;
    import("leaflet").then((L) => {
      const m = map.current;
      if (!m) return;
      m.closePopup();
      if (shown.length === 1) m.flyTo([shown[0].lat, shown[0].lng], 11, { duration: 0.8 });
      else m.flyToBounds(L.latLngBounds(shown.map((p) => [p.lat, p.lng])), { padding: [50, 50], duration: 0.8, maxZoom: 10 });
    });
  }, [shown, ready]);

  function focus(p: Park) {
    const m = map.current;
    const marker = markers.current.get(p.slug);
    if (!m || !marker) return;
    box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    m.flyTo([p.lat, p.lng], 12, { duration: 0.8 });
    m.once("moveend", () => marker.openPopup());
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Show parks in">
        {["All", ...states].map((s) => {
          const count = s === "All" ? parks.length : parks.filter((p) => p.state === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              aria-pressed={state === s}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${state === s ? "bg-ink text-cream" : "bg-white text-bark hover:bg-sand"}`}
            >
              {s === "All" ? "All states" : s} <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <div ref={box} className="parks-map h-[26rem] overflow-hidden rounded-[1.75rem] border border-line bg-sand sm:h-[34rem] lg:h-[40rem]" aria-label="Map of campgrounds" />
          <ul className="pointer-events-none absolute bottom-4 left-4 z-[400] flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-cream/95 px-4 py-2.5 text-xs text-bark shadow-md">
            {(["mountains", "lake", "both", "none"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className={`pm-dot pm-${k}`} /> {KIND_LABEL[k]}
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-3 lg:h-[40rem] lg:overflow-y-auto lg:pr-1">
          {shown.map((p) => (
            <li key={p.slug} className="rounded-2xl bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow text-muted">{p.city}, {p.state}</p>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 block font-display text-2xl leading-tight hover:text-clay hover:underline">
                    {p.name} <span aria-hidden="true" className="text-base">↗</span>
                    <span className="sr-only"> (opens the park&apos;s website)</span>
                  </a>
                </div>
                <span className={`pm-dot pm-${kind(p)} mt-2 shrink-0`} title={KIND_LABEL[kind(p)]} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-bark">{p.description}</p>
              {p.addons.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-2">
                  {p.addons.map((a) => (
                    <span key={a.code} className="rounded-full bg-cream px-3 py-1 text-xs text-bark">
                      {a.name} available · {rate(a.daily_rate)}/day
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <button type="button" onClick={() => focus(p)} className="eyebrow text-pine hover:underline">
                  Show on map
                </button>
                <Link href={`/fleet?park=${p.slug}#book`} className="eyebrow text-clay hover:underline">
                  Book here →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
