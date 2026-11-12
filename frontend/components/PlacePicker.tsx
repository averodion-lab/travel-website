"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TypedPlace } from "@/lib/api";
import { money } from "@/lib/format";
import type { PlaceMiles } from "@/lib/place";

type Suggestion = TypedPlace & { detail: string };

/** Photon (OpenStreetMap search, free, allows search-as-you-type). Results
 *  are limited to the Southeast and ranked near our base. */
async function search(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en` +
    "&bbox=-92,24,-75,40&lat=34.17&lon=-84.5";
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    features: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[];
  };
  const seen = new Set<string>();
  // Campgrounds, lakes and parks first; streets and buildings after.
  const rank = (p: Record<string, string>) =>
    /camp_site|caravan_site|campground/.test(p.osm_value ?? "")
      ? 0
      : /lake|reservoir|water|park|nature_reserve|beach|peak|village|town|city|hamlet/.test(p.osm_value ?? "")
        ? 1
        : 2;
  return data.features
    .map((f, i) => ({ f, i, r: rank(f.properties) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(({ f }) => {
      const p = f.properties;
      const name = p.name || [p.housenumber, p.street].filter(Boolean).join(" ") || p.city || "";
      const detail = [p.city && p.city !== name ? p.city : p.county, p.state].filter(Boolean).join(", ");
      return { name: detail ? `${name}, ${detail}` : name, detail, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    })
    .filter((s) => s.name && !seen.has(s.name) && seen.add(s.name));
}

/** "Where are you staying?": type a campground, town or address, pick it from
 *  the suggestions, and see the road miles from our base and the delivery
 *  price. */
export default function PlacePicker({
  value,
  onChange,
  measured,
  perMile,
  base,
  compact = false,
}: {
  value: TypedPlace | null;
  onChange: (place: TypedPlace | null) => void;
  measured: PlaceMiles;
  perMile: string;
  base: string;
  compact?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const abort = useRef<AbortController | null>(null);

  // Search as they type (after a short pause).
  useEffect(() => {
    const q = text.trim();
    if (!open || q.length < 3 || q === value?.name) return;
    const t = setTimeout(() => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setSearching(true);
      search(q, ctrl.signal)
        .then((list) => {
          setItems(list);
          setActive(list.length ? 0 : -1);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [text, open, value?.name]);

  function choose(s: Suggestion) {
    setText(s.name);
    setOpen(false);
    setItems([]);
    onChange({ name: s.name, lat: s.lat, lng: s.lng });
  }

  const showList = open && text.trim().length >= 3 && text.trim() !== value?.name;

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <label htmlFor={`${id}-input`} className="label">
        Campground or address
      </label>
      <div className="relative">
        <input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          className="field"
          placeholder="e.g. Lake Burton, GA or a campground name"
          value={text}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onKeyDown={(e) => {
            if (!showList || !items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + items.length) % items.length);
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              choose(items[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {showList && (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-line bg-white py-1 shadow-[0_18px_40px_-20px_rgba(28,26,23,0.45)]"
          >
            {searching && !items.length && <li className="px-4 py-3 text-sm text-muted">Searching…</li>}
            {!searching && !items.length && (
              <li className="px-4 py-3 text-sm text-muted">No matches yet. Try the campground or town name.</li>
            )}
            {items.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2.5 text-sm ${i === active ? "bg-sand" : ""}`}
              >
                {s.name}
              </li>
            ))}
            <li className="border-t border-line px-4 pt-2 text-[0.65rem] text-muted">Search by OpenStreetMap</li>
          </ul>
        )}
      </div>

      {value && (
        <p className={`mt-2 text-sm ${measured.error ? "text-clay-dark" : "text-bark"}`} aria-live="polite">
          {measured.loading
            ? "Measuring the drive from our base…"
            : measured.error
              ? measured.error
              : `${measured.miles} road miles from ${base} · delivery ${money(measured.total ?? "0")} (${money(perMile)}/mile)`}
        </p>
      )}
      {!value && (
        <p className="mt-2 text-xs text-muted">
          Type at least three letters and pick your place from the list. We reserve nothing with the campground; please
          book your site with them.
        </p>
      )}
    </div>
  );
}
