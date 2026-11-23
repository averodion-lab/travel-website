"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { preconnect } from "react-dom";
import Link from "next/link";
import type { Map as LeafletMap, Marker } from "leaflet";
import AddonIcon, { ADDON_ICONS } from "@/components/AddonIcon";
import FilterSelect from "@/components/FilterSelect";
import type { Park, Ramp } from "@/lib/api";
import { rate } from "@/lib/format";
import { STATE_ORDER, rampWhere } from "@/lib/parks";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Pin colour by what the park offers. */
function kind(p: Park): "both" | "mountains" | "lake" | "offroad" | "none" {
  if (p.terrain.includes("offroad")) return "offroad";
  const m = p.terrain.includes("mountains");
  const l = p.terrain.includes("lake");
  return m && l ? "both" : m ? "mountains" : l ? "lake" : "none";
}
const KIND_LABEL = {
  both: "Mountains and lake",
  mountains: "Mountains",
  lake: "Lake",
  offroad: "Off-road riding",
  none: "Foothills",
};

/** Legend buttons: show only one kind of park. "Mountains" and "Lake" include
 * the parks that have both; "ramp" keeps parks with a jet ski launch. */
type Only = keyof typeof KIND_LABEL | "ramp" | null;
function matches(p: Park, only: Only) {
  if (!only) return true;
  if (only === "ramp") return !!p.ramp;
  const k = kind(p);
  if (only === "mountains" || only === "lake")
    return k === only || k === "both";
  return k === only;
}

const TILES = "https://tile.openstreetmap.org";
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Round white badge around an extra's mini 3D model (same look as <AddonIcon>).
const BADGE =
  "display:inline-grid;place-items:center;width:22px;height:22px;border-radius:9999px;background:#fff;overflow:hidden;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06),0 3px 8px -3px rgba(0,0,0,.35)";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A small anchor: the boat-ramp symbol on the map and in park details. */
const ANCHOR_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M8 11h8M4.5 14a7.5 7.5 0 0 0 15 0"/></svg>';

const directions = (r: Ramp) =>
  `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;

/** `slug` adds a "Show ramp" link that flies the map to the ramp. */
function rampHtml(r: Ramp, slug?: string) {
  const show = slug
    ? `<a href="#" data-ramp="${esc(slug)}">Show ramp</a> · `
    : "";
  return `<div class="pm-ramp"><span class="pm-ramp-icon">${ANCHOR_SVG}</span><div><p class="pm-ramp-title">Jet ski launch: ${esc(r.name)}</p><p class="pm-ramp-where">${esc(rampWhere(r))}</p><p class="pm-ramp-where">${show}<a href="${directions(r)}" target="_blank" rel="noopener noreferrer">Directions ↗</a></p></div></div>`;
}

function popupHtml(p: Park) {
  const extras = p.addons
    .filter((a) => a.code !== "atv" || p.terrain.includes("offroad"))
    .map((a) => {
      const icon = ADDON_ICONS[a.code];
      const img = icon
        ? // Styled inline: popups are plain HTML strings, so they can't use the badge component.
          `<span style="${BADGE}"><img src="${BASE}${icon.src.replace("/images/", "/_img/320/images/").replace(/\.png$/, ".webp")}" alt="" style="width:92%;height:92%;object-fit:contain;display:block"></span>`
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
      ${p.ramp ? rampHtml(p.ramp, p.slug) : ""}
      <a class="pm-book" data-pick="${esc(p.slug)}" href="${BASE}/fleet?park=${encodeURIComponent(p.slug)}#book">Book the trailer here →</a>
      <a class="pm-more" href="${BASE}/destinations/${encodeURIComponent(p.slug)}">Park details, delivery price and extras →</a>
    </div>`;
}

/** `compact` (home page): just the map, no park list beside it. */
/** `onPick`: when given (home page), a pin's "Book the trailer here" link hands
 *  the park to the page's booking card instead of going to the trailer page. */
export default function ParksMap({
  parks,
  compact = false,
  onPick,
}: {
  parks: Park[];
  compact?: boolean;
  onPick?: (slug: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const rampMarkers = useRef(new Map<string, Marker>());
  const [state, setState] = useState("All");
  const [only, setOnly] = useState<Only>(null);
  const onlyRef = useRef<Only>(null);
  const showRampsRef = useRef<() => void>(() => {});
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
    () =>
      parks.filter(
        (p) => (state === "All" || p.state === state) && matches(p, only),
      ),
    [parks, state, only],
  );

  // On the home page the popup's "Book" link fills in the booking card below
  // instead of leaving the page.
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      // "Show ramp" in a park's popup: fly to its boat ramp and open it.
      const rampLink = (e.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[data-ramp]",
      );
      if (rampLink) {
        e.preventDefault();
        const m = map.current;
        const marker = rampMarkers.current.get(rampLink.dataset.ramp ?? "");
        if (!m || !marker) return;
        m.closePopup();
        m.once("moveend", () => marker.openPopup());
        m.flyTo(marker.getLatLng(), 14, {
          animate: !reducedMotion(),
          duration: 0.9,
        });
        return;
      }
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[data-pick]",
      );
      if (!link || !pickRef.current) return;
      e.preventDefault();
      map.current?.closePopup();
      pickRef.current(link.dataset.pick ?? "");
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

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
      // No prefix (Leaflet's "🇺🇦 Leaflet" link; its licence doesn't require it).
      // The OpenStreetMap credit below must stay visible: it's a condition of
      // using their free map tiles.
      m.attributionControl.setPrefix(false);
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
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
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
      // Boat ramps (where the jet ski goes in): shown once zoomed in on an area,
      // so at state level they don't crowd the park pins, or always when the
      // "Boat ramps" button is on.
      parks
        .filter((p) => p.ramp)
        .forEach((p) => {
          const r = p.ramp!;
          const rm = L.marker([r.lat, r.lng], {
            icon: L.divIcon({
              className: "",
              html: `<span class="pm-ramp-pin">${ANCHOR_SVG}</span>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
              popupAnchor: [0, -12],
            }),
            title: `${r.name} (boat ramp for ${p.name})`,
            alt: r.name,
            keyboard: true,
          }).bindPopup(
            `<div class="pm-popup"><p class="pm-place">Boat ramp · ${esc(p.name)}</p>${rampHtml(r)}</div>`,
            { maxWidth: narrow ? 230 : 280, className: "pm-leaflet-popup" },
          );
          rampMarkers.current.set(p.slug, rm);
        });
      const showRamps = () => {
        const f = onlyRef.current;
        const near = m.getZoom() >= 10.5 || f === "ramp";
        for (const p of parks) {
          const rm = rampMarkers.current.get(p.slug);
          if (!rm) continue;
          if (near && matches(p, f)) rm.addTo(m);
          else rm.remove();
        }
      };
      showRampsRef.current = showRamps;
      m.on("zoomend", showRamps);
      m.fitBounds(L.latLngBounds(parks.map((p) => [p.lat, p.lng])), {
        padding: [40, 40],
      });
      showRamps();
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

  // Legend buttons: hide the pins (and ramps) of other kinds of park.
  useEffect(() => {
    onlyRef.current = only;
    const m = map.current;
    if (!ready || !m) return;
    for (const p of parks) {
      const pin = markers.current.get(p.slug);
      if (!pin) continue;
      if (matches(p, only)) pin.addTo(m);
      else pin.remove();
    }
    showRampsRef.current();
  }, [only, ready, parks]);

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
      {/* Two drop-downs: state, and kind of park (each kind with its pin
          colour, so the list is the map's colour key too). */}
      <div className="flex flex-wrap gap-3">
        <FilterSelect
          label="State"
          value={state}
          onChange={setState}
          options={["All", ...states].map((s) => ({
            value: s,
            label: s === "All" ? "All states" : s,
            count: parks.filter(
              (p) => (s === "All" || p.state === s) && matches(p, only),
            ).length,
          }))}
        />
        <FilterSelect
          label="Kind of park"
          value={only ?? "all"}
          onChange={(v) => setOnly(v === "all" ? null : v)}
          options={(
            [
              "all",
              "mountains",
              "lake",
              "both",
              "offroad",
              "none",
              "ramp",
            ] as const
          ).map((k) => ({
            value: k,
            label:
              k === "all"
                ? "All parks"
                : k === "ramp"
                  ? "Boat ramps"
                  : KIND_LABEL[k],
            count: parks.filter(
              (p) =>
                (state === "All" || p.state === state) &&
                matches(p, k === "all" ? null : k),
            ).length,
            icon:
              k === "ramp" ? (
                <span
                  className="pm-ramp-key"
                  dangerouslySetInnerHTML={{ __html: ANCHOR_SVG }}
                />
              ) : k === "all" ? undefined : (
                <span className={`pm-dot pm-${k}`} />
              ),
          }))}
        />
      </div>

      <div
        className={`mt-6 ${compact ? "" : "grid gap-6 lg:grid-cols-[1.5fr_1fr]"}`}
      >
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
              className="parks-map h-[26rem] overflow-hidden rounded-md border border-line sm:h-[30rem] lg:h-[32rem]"
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
        </div>

        {!compact && (
          <ul className="space-y-3 lg:h-[32rem] lg:overflow-y-auto lg:pr-1">
            {shown.length === 0 && (
              <li className="rounded-2xl bg-white p-5 text-sm text-bark">
                No parks of that kind here.{" "}
                <button
                  type="button"
                  onClick={() => setOnly(null)}
                  className="tap underline"
                >
                  Show all parks
                </button>
              </li>
            )}
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
                {p.addons.some(
                  (a) => a.code !== "atv" || p.terrain.includes("offroad"),
                ) && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {p.addons
                      .filter(
                        (a) =>
                          a.code !== "atv" || p.terrain.includes("offroad"),
                      )
                      .map((a) => (
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
                {p.ramp && (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-bark">
                    <span
                      className="pm-ramp-key mt-0.5"
                      dangerouslySetInnerHTML={{ __html: ANCHOR_SVG }}
                    />
                    <span>
                      <span className="font-semibold">
                        Jet ski launch: {p.ramp.name}
                      </span>
                      <br />
                      {rampWhere(p.ramp)} ·{" "}
                      <a
                        href={directions(p.ramp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap underline hover:text-clay"
                      >
                        Directions ↗
                      </a>
                    </span>
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
