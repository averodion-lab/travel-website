"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { preconnect } from "react-dom";
import Link from "next/link";
import type { Map as LeafletMap, Marker } from "leaflet";
import AddonIcon, { ADDON_ICONS } from "@/components/AddonIcon";
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
const KIND_LABEL = {
  both: "Mountains and lake",
  mountains: "Mountains",
  lake: "Lake",
  none: "Foothills",
};

const TILES = "https://tile.openstreetmap.org";
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Round white badge around an extra's mini 3D model (same look as <AddonIcon>).
const BADGE =
  "display:inline-grid;place-items:center;width:22px;height:22px;border-radius:9999px;background:#fff;overflow:hidden;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06),0 3px 8px -3px rgba(0,0,0,.35)";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function popupHtml(p: Park) {
  const extras = p.addons
    .map((a) => {
      const icon = ADDON_ICONS[a.code];
      const img = icon
        ? // Styled inline: popups are plain HTML strings, so they can't use the badge component.
          `<span style="${BADGE}"><img src="${BASE}${icon.src.replace("/images/", "/_img/640/images/").replace(/\.png$/, ".webp")}" alt="" style="width:92%;height:92%;object-fit:contain;display:block"></span>`
        : "";
      return `<span class="pm-chip">${img}${esc(a.name)} · ${esc(rate(a.daily_rate))}/day</span>`;
    })
    .join("");
  return `
    <div class="pm-popup">
      <p class="pm-place">${esc(p.city)}, ${esc(p.state)}</p>
      <a class="pm-name" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)} ↗</a>
      <p class="pm-text">${esc(p.description)}</p>
      ${extras ? `<div class="pm-chips">${extras}</div>` : ""}
      <a class="pm-book" href="${BASE}/fleet?park=${encodeURIComponent(p.slug)}#book">Book the trailer here →</a>
    </div>`;
}

/** `compact` (home page): a shorter list without the park descriptions. */
/** `onPick`: when given, the list's "Book" button hands the park to the page
 *  (the home page's booking bar) instead of going to the trailer page. */
export default function ParksMap({
  parks,
  compact = false,
  picked = "",
  onPick,
}: {
  parks: Park[];
  compact?: boolean;
  picked?: string;
  onPick?: (slug: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const [state, setState] = useState("All");
  const [ready, setReady] = useState(false);
  // Short tip shown over the map ("use two fingers", "click to zoom").
  const [hint, setHint] = useState("");
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Start the connection to the map server before the first tiles are requested.
  preconnect(TILES);

  const states = STATE_ORDER.filter((s) => parks.some((p) => p.state === s));
  const shown = useMemo(
    () => (state === "All" ? parks : parks.filter((p) => p.state === state)),
    [parks, state],
  );

  // Build the map once, in the browser only.
  useEffect(() => {
    let cancelled = false;
    const pins = markers.current;
    import("leaflet").then((L) => {
      if (cancelled || !box.current || map.current) return;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const narrow = box.current.clientWidth < 520;
      const flash = (text: string) => {
        setHint(text);
        clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHint(""), 1600);
      };
      const m = L.map(box.current, {
        // Phones: one finger scrolls the page, two fingers move and pinch-zoom the map.
        dragging: !touch,
        // Desktop: the scroll wheel zooms only after the map is clicked, so it never traps page scrolling.
        scrollWheelZoom: false,
        wheelPxPerZoomLevel: 110,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        inertiaDeceleration: 2600,
        easeLinearity: 0.2,
        zoomAnimation: !reducedMotion(),
        fadeAnimation: !reducedMotion(),
      });
      if (touch) {
        // Only when a finger slides across the map, not when a pin is tapped.
        box.current.addEventListener(
          "touchmove",
          (e) => {
            if (e.touches.length === 1)
              flash("Use two fingers to move the map");
            else setHint("");
          },
          { passive: true },
        );
      } else {
        const wheelOn = () => m.scrollWheelZoom.enable();
        const wheelOff = () => m.scrollWheelZoom.disable();
        m.on("click focus", wheelOn);
        m.on("mouseout blur", wheelOff);
        box.current.addEventListener(
          "wheel",
          (e) => {
            if (!m.scrollWheelZoom.enabled() && !e.ctrlKey)
              flash("Click the map to zoom with your scroll wheel");
          },
          { passive: true },
        );
      }
      L.tileLayer(`${TILES}/{z}/{x}/{y}.png`, {
        maxZoom: 18,
        keepBuffer: 6, // keep more tiles around the view so panning doesn't show gaps
        updateWhenZooming: false, // load new tiles when a zoom ends, not on every animation frame
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(m);
      for (const p of parks) {
        const icon = L.divIcon({
          className: "",
          html: `<span class="pm-pin pm-${kind(p)}"><span></span></span>`,
          iconSize: [30, 40],
          iconAnchor: [15, 38],
          popupAnchor: [0, -34],
        });
        const marker = L.marker([p.lat, p.lng], {
          icon,
          title: p.name,
          alt: p.name,
          keyboard: true,
        })
          .bindPopup(popupHtml(p), {
            maxWidth: narrow ? 230 : 280,
            className: "pm-leaflet-popup",
            // Keep popups clear of the + and − buttons in the top-left corner.
            autoPanPaddingTopLeft: [58, 16],
            autoPanPaddingBottomRight: [16, 16],
          })
          .addTo(m);
        pins.set(p.slug, marker);
      }
      m.fitBounds(L.latLngBounds(parks.map((p) => [p.lat, p.lng])), {
        padding: [40, 40],
      });
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      pins.clear();
      clearTimeout(hintTimer.current);
    };
  }, [parks]);

  // Zoom to the chosen state.
  useEffect(() => {
    if (!ready || !map.current || shown.length === 0) return;
    import("leaflet").then((L) => {
      const m = map.current;
      if (!m) return;
      m.closePopup();
      const animate = !reducedMotion();
      if (shown.length === 1)
        m.flyTo([shown[0].lat, shown[0].lng], 11, { animate, duration: 0.9 });
      else
        m.flyToBounds(L.latLngBounds(shown.map((p) => [p.lat, p.lng])), {
          padding: [50, 50],
          maxZoom: 10,
          animate,
          duration: 0.9,
        });
    });
  }, [shown, ready]);

  function focus(p: Park) {
    const m = map.current;
    const marker = markers.current.get(p.slug);
    const el = box.current;
    if (!m || !marker || !el) return;
    const animate = !reducedMotion();
    const fly = () => {
      m.once("moveend", () => marker.openPopup());
      m.flyTo([p.lat, p.lng], 12, { animate, duration: 0.9 });
    };
    // Scroll first and fly once the page has stopped, so the two don't fight.
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return fly();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", go);
      fly();
    };
    window.addEventListener("scrollend", go);
    setTimeout(go, 700); // browsers without the scrollend event
    el.scrollIntoView({
      behavior: animate ? "smooth" : "auto",
      block: "center",
    });
  }

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Show parks in"
      >
        {["All", ...states].map((s) => {
          const count =
            s === "All"
              ? parks.length
              : parks.filter((p) => p.state === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              aria-pressed={state === s}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${state === s ? "bg-ink text-cream" : "bg-white text-bark hover:bg-sand"}`}
            >
              {s === "All" ? "All states" : s}{" "}
              <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* `isolate` keeps Leaflet's high z-index layers inside the map, so they
            can't cover the sticky header or the date pop-up. */}
        <div className="relative isolate">
          {/* The fade lives on a wrapper: Leaflet adds its own classes to the map
              element, and React must never re-render that element's className. */}
          <div
            className={`transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          >
            <div
              ref={box}
              className="parks-map h-[26rem] overflow-hidden rounded-[1.75rem] border border-line sm:h-[34rem] lg:h-[40rem]"
              aria-label="Map of campgrounds"
            />
          </div>
          {!ready && (
            <div
              className="absolute inset-0 animate-pulse rounded-[1.75rem] bg-sand/70"
              aria-hidden="true"
            />
          )}
          <p
            aria-live="polite"
            className={`pointer-events-none absolute inset-x-0 top-1/2 z-[500] mx-auto w-max max-w-[85%] -translate-y-1/2 rounded-full bg-ink/80 px-5 py-2.5 text-center text-sm text-cream transition-opacity duration-300 ${hint ? "opacity-100" : "opacity-0"}`}
          >
            {hint}
          </p>
          {/* Colour key: under the map on phones, over its corner on bigger screens. */}
          <ul className="pointer-events-none mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-bark sm:absolute sm:bottom-4 sm:left-4 sm:z-[400] sm:mt-0 sm:rounded-xl sm:bg-cream/95 sm:px-4 sm:py-2.5 sm:shadow-md">
            {(["mountains", "lake", "both", "none"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className={`pm-dot pm-${k}`} /> {KIND_LABEL[k]}
              </li>
            ))}
          </ul>
        </div>

        {compact ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white lg:h-[40rem] lg:overflow-y-auto">
            {shown.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className={`pm-dot pm-${kind(p)} shrink-0`}
                  title={KIND_LABEL[kind(p)]}
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-display text-xl leading-tight sm:truncate hover:text-clay hover:underline"
                  >
                    {p.name}{" "}
                    <span aria-hidden="true" className="text-sm">
                      ↗
                    </span>
                    <span className="sr-only">
                      {" "}
                      (opens the park&apos;s website)
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => focus(p)}
                    className="text-xs text-muted hover:text-pine hover:underline"
                  >
                    {p.city}, {p.state} · show on map
                  </button>
                </div>
                <span className="flex shrink-0 -space-x-1.5">
                  {p.addons.map((a) => (
                    <span key={a.code} title={`${a.name} available`}>
                      <AddonIcon code={a.code} size={26} />
                    </span>
                  ))}
                </span>
                {onPick ? (
                  <button
                    type="button"
                    onClick={() => onPick(p.slug)}
                    aria-pressed={picked === p.slug}
                    className={`eyebrow shrink-0 rounded-full px-3 py-1.5 transition-colors ${
                      picked === p.slug
                        ? "bg-clay text-white"
                        : "text-clay hover:bg-clay/10"
                    }`}
                    aria-label={`Book the trailer at ${p.name}`}
                  >
                    {picked === p.slug ? "Chosen ✓" : "Book →"}
                  </button>
                ) : (
                  <Link
                    href={`/fleet?park=${p.slug}#book`}
                    className="eyebrow shrink-0 text-clay hover:underline"
                    aria-label={`Book the trailer at ${p.name}`}
                  >
                    Book →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-3 lg:h-[40rem] lg:overflow-y-auto lg:pr-1">
            {shown.map((p) => (
              <li key={p.slug} className="rounded-2xl bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow text-muted">
                      {p.city}, {p.state}
                    </p>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block font-display text-2xl leading-tight hover:text-clay hover:underline"
                    >
                      {p.name}{" "}
                      <span aria-hidden="true" className="text-base">
                        ↗
                      </span>
                      <span className="sr-only">
                        {" "}
                        (opens the park&apos;s website)
                      </span>
                    </a>
                  </div>
                  <span
                    className={`pm-dot pm-${kind(p)} mt-2 shrink-0`}
                    title={KIND_LABEL[kind(p)]}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-bark">
                  {p.description}
                </p>
                {p.addons.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {p.addons.map((a) => (
                      <span
                        key={a.code}
                        className="inline-flex items-center gap-1.5 rounded-full bg-cream py-1 pl-1.5 pr-3 text-xs text-bark"
                      >
                        <AddonIcon code={a.code} size={24} />
                        {a.name} available · {rate(a.daily_rate)}/day
                      </span>
                    ))}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button
                    type="button"
                    onClick={() => focus(p)}
                    className="eyebrow text-pine hover:underline"
                  >
                    Show on map
                  </button>
                  <Link
                    href={`/fleet?park=${p.slug}#book`}
                    className="eyebrow text-clay hover:underline"
                  >
                    Book here →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
