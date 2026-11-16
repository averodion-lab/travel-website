import type { ReactNode } from "react";

/** A detailed 2D icon for a trailer feature, picked by keywords in its name
 *  ("King bedroom with closet" → bed, "Glass-door shower" → shower …).
 *  Two-tone: thin brass outlines with lightly shaded areas. */

// Shaded areas use this class so they pick up the brass colour at low opacity.
const F = "fill-current opacity-[0.18]";

const ICONS: Record<string, ReactNode> = {
  bed: (
    <>
      <path className={F} d="M3.5 13.5h17v4h-17z" />
      <path d="M3.5 18.5V7.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v11" />
      <path d="M3.5 13.5h17M3.5 17.5h17M3.5 18.5v1.5M20.5 18.5v1.5" />
      <rect x="5.5" y="9" width="5.5" height="3.2" rx="1.2" />
      <rect x="13" y="9" width="5.5" height="3.2" rx="1.2" />
      <path d="M12 13.5c1.5 1.2 3.5 1.6 8.5 1.2" />
    </>
  ),
  sofa: (
    <>
      <path className={F} d="M6 13h12v3.5H6z" />
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M12 6.5V13" />
      <path d="M3 12.2a1.6 1.6 0 0 1 3.2 0V13h11.6v-.8a1.6 1.6 0 0 1 3.2 0V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.8Z" />
      <path d="M6.2 16.5h11.6M5 18v1.6M19 18v1.6" />
    </>
  ),
  armchair: (
    <>
      <path className={F} d="M8.5 5.5h6l1 6.5h-8z" />
      <path d="M8 12 7 5.8A1.4 1.4 0 0 1 8.4 4.2h6.2a1.4 1.4 0 0 1 1.4 1.6L15.2 12" />
      <path d="M5 13a1.5 1.5 0 0 1 3 0v1h8v-1a1.5 1.5 0 0 1 3 0v4.5H5V13Z" />
      <path d="M16.5 17.5l2.5 2.5M7.5 17.5 5 20" />
      <circle cx="20" cy="11.2" r="1.2" />
      <path d="M19 12.2v1.3h2v-1.3" />
    </>
  ),
  flame: (
    <>
      <path className={F} d="M6.5 10h11v8.5h-11z" />
      <rect x="3.5" y="5.5" width="17" height="15" rx="1" />
      <path d="M3.5 8.5h17M6.5 10h11v8.5h-11z" />
      <path d="M12 11.5c1.5 1.8 2.6 2.9 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1 .6-1.8 1.3-2.4 0 1 .5 1.6 1 1.6 0-1.4-.3-2.4.3-3.6Z" />
      <path d="M8 18.5l8-1.5M8.5 17l7.5 1.5" />
    </>
  ),
  tv: (
    <>
      <path className={F} d="M4.5 5.5h15v9h-15z" />
      <rect x="3.5" y="4.5" width="17" height="11" rx="1" />
      <path d="M6.5 7.5l3-1.5M6.5 10l5.5-3" />
      <path d="M2.5 18h19v2.5h-19z" />
      <path d="M9 15.5 8 18M15 15.5l1 2.5M12 18v2.5" />
    </>
  ),
  kitchen: (
    <>
      <path className={F} d="M3.5 12.5h17v8h-17z" />
      <path d="M3.5 12.5h17v8h-17zM12 12.5v8M3.5 15h17" />
      <path d="M10.5 16.8h-1M14.5 16.8h-1" />
      <path d="M8 12.5v-1.5h4.5v1.5" />
      <path d="M14.5 12.5V8.2a1.7 1.7 0 0 1 3.4 0" />
      <path d="M3.5 3.5h7v5h-7zM13 3.5h7.5" />
      <path d="M7 5.8v.6" />
    </>
  ),
  fridge: (
    <>
      <path className={F} d="M6 3.5h12v6.5H6z" />
      <rect x="6" y="2.5" width="12" height="19" rx="1.2" />
      <path d="M6 10.5h12M12 2.5v8" />
      <path d="M10.6 5.5v3M13.4 5.5v3M9 13v5" />
      <path d="M6 21.5v1M18 21.5v1" />
    </>
  ),
  stove: (
    <>
      <path className={F} d="M6.5 11h11v6.5h-11z" />
      <rect x="3.5" y="3.5" width="17" height="17.5" rx="1" />
      <path d="M3.5 8.5h17" />
      <circle cx="7" cy="6" r="1" />
      <circle cx="10.3" cy="6" r="1" />
      <circle cx="13.7" cy="6" r="1" />
      <circle cx="17" cy="6" r="1" />
      <rect x="6.5" y="11" width="11" height="6.5" rx=".6" />
      <path d="M8.5 9.8h7" />
      <path d="M8.5 13.5l2.5-1.2" />
    </>
  ),
  microwave: (
    <>
      <path className={F} d="M4.5 7.5h10v9h-10z" />
      <rect x="2.5" y="5.5" width="19" height="13" rx="1" />
      <rect x="4.5" y="7.5" width="10" height="9" rx=".6" />
      <path d="M16.8 5.5v13" />
      <path d="M18.3 8h1.6M18.3 10h.5M19.4 10h.5M18.3 12h.5M19.4 12h.5M18.3 14h.5M19.4 14h.5" />
      <path d="M6.5 10l2.5-1.2M6.5 12.8 11 10.5" />
    </>
  ),
  pantry: (
    <>
      <path className={F} d="M5 3h14v18H5z" />
      <rect x="5" y="3" width="14" height="18" rx=".8" />
      <path d="M5 8.5h14M5 14h14" />
      <rect x="7" y="5" width="2.4" height="3.5" rx=".6" />
      <rect x="10.5" y="6" width="2.4" height="2.5" rx=".6" />
      <path d="M14.5 8.5V5.5h2.5v3" />
      <rect x="7" y="10.5" width="4.5" height="3.5" rx=".6" />
      <circle cx="15" cy="12" r="1.8" />
      <path d="M7 19.5h10" />
    </>
  ),
  sink: (
    <>
      <path className={F} d="M4 13h16v7H4z" />
      <path d="M3 13h18M4 13v7.5h16V13M12 13v7.5" />
      <path d="M5.5 11.2c1-.8 4-.8 5 0M13.5 11.2c1-.8 4-.8 5 0" />
      <path d="M8 11V9.2a1 1 0 0 1 2 0M16 11V9.2a1 1 0 0 1 2 0" />
      <rect x="5" y="2.5" width="14" height="5" rx="1" />
      <path d="M9.5 16.5h-1M15.5 16.5h-1" />
    </>
  ),
  shower: (
    <>
      <path className={F} d="M11.5 4h9v17h-9z" />
      <path d="M3.5 21V7.5a3.5 3.5 0 0 1 7 0V9" />
      <path d="M8 9h5" />
      <path d="M9 11.5v1M10.5 12.5v1M12 11.5v1M9.5 15v1M11.5 15v1" />
      <rect x="11.5" y="4" width="9" height="17" rx=".5" />
      <path d="M13.5 12v3M14 6l3-1.5" />
      <path d="M3 21h18" />
    </>
  ),
  slideout: (
    <>
      <path className={F} d="M8 6h8v12H8z" />
      <rect x="8" y="6" width="8" height="12" rx=".6" />
      <path d="M8 8.5H4.5v7H8M16 8.5h3.5v7H16" />
      <path d="M2.5 12H5M21.5 12H19M3.7 10.8 2.5 12l1.2 1.2M20.3 10.8l1.2 1.2-1.2 1.2" />
      <path d="M10 9.5h4v3h-4zM11 18v-3h2v3" />
    </>
  ),
  climate: (
    <>
      <path className={F} d="M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 12l2.6-2.6" />
      <path d="M5.5 4.5v3M4 6h3M4.5 5l2 2M6.5 5l-2 2" />
      <path d="M18.5 4.2c.9 1.1 1.5 1.8 1.5 2.7a1.5 1.5 0 0 1-3 0c0-.6.3-1 .7-1.4 0 .6.3.9.6.9 0-.8-.1-1.4.2-2.2Z" />
      <path d="M8 20.5h8" />
    </>
  ),
  awning: (
    <>
      <path className={F} d="M3 8.5 5 4.5h14l2 4z" />
      <path d="M3 8.5 5 4.5h14l2 4H3Z" />
      <path d="M3 8.5c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0 1 .8 1.8 1.8 1.8S21 9.5 21 8.5" />
      <path d="M8 4.5 7 8.5M12 4.5v4M16 4.5l1 4" />
      <path d="M4.8 10.3V20M19.2 10.3V20M3 20h18" />
    </>
  ),
  speaker: (
    <>
      <path className={F} d="M6 2.5h12v19H6z" />
      <rect x="6" y="2.5" width="12" height="19" rx="1.5" />
      <circle cx="12" cy="7.2" r="2.2" />
      <circle cx="12" cy="7.2" r=".6" />
      <circle cx="12" cy="15.5" r="3.6" />
      <circle cx="12" cy="15.5" r="1.4" />
      <path d="M8 19.8h.01M16 19.8h.01" />
    </>
  ),
  storage: (
    <>
      <path className={F} d="M3.5 8.5h17v11h-17z" />
      <rect x="2.5" y="5" width="19" height="15" rx="1" />
      <path d="M2.5 8.5h19" />
      <path d="M10 6.7h4" />
      <path d="M6 12h5v5H6zM6 14.5h5" />
      <path d="M13.5 17v-4.5l2-1.5h2.5V17z" />
      <path d="M13.5 12.5h4.5" />
    </>
  ),
  linen: (
    <>
      <path className={F} d="M4.5 14.5h15v5h-15z" />
      <path d="M4.5 19.5h15a1 1 0 0 0 1-1V16a1.5 1.5 0 0 0-1.5-1.5H4.5" />
      <path d="M4.5 14.5a2.5 2.5 0 0 0 0 5" />
      <path d="M5.5 14.5V11h13a1.5 1.5 0 0 1 1.5 1.5v2" />
      <path d="M5.5 11a2 2 0 0 0 0 3.5" />
      <path d="M6.5 11V7.5h11a1.5 1.5 0 0 1 1.5 1.5v2M6.5 7.5a1.8 1.8 0 0 0 0 3.5" />
      <path d="M10 7.5V4.5M14 7.5V4.5" />
    </>
  ),
  dishes: (
    <>
      <path className={F} d="M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="4" />
      <path d="M2.5 3.5v5.5a1.5 1.5 0 0 0 3 0V3.5M4 3.5v17" />
      <path d="M21.5 3.5c-1.6 1.2-2 4.5-2 6.5h2v10.5" />
    </>
  ),
  check: (
    <>
      <circle className={F} cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12.2l2.7 2.7L16.2 9.3" />
    </>
  ),
};

const RULES: [RegExp, string][] = [
  [/bedding|towel|linen/i, "linen"],
  [/sofa|couch/i, "sofa"],
  [/bed(room)?\b|king|queen|bunk/i, "bed"],
  [/theat(er|re)|recliner|seating/i, "armchair"],
  [/fireplace/i, "flame"],
  [/tv|entertainment|television/i, "tv"],
  [/refrigerator|fridge/i, "fridge"],
  [/range|oven|stove|cooktop/i, "stove"],
  [/microwave/i, "microwave"],
  [/pantry|cabinet/i, "pantry"],
  [/cookware|dishes|utensil/i, "dishes"],
  [/kitchen/i, "kitchen"],
  [/shower/i, "shower"],
  [/bath|sink|toilet/i, "sink"],
  [/slide/i, "slideout"],
  [/air condition|furnace|heat|a\/c/i, "climate"],
  [/awning/i, "awning"],
  [/speaker|sound|stereo/i, "speaker"],
  [/storage/i, "storage"],
];

export default function AmenityIcon({ name, className = "" }: { name: string; className?: string }) {
  const key = RULES.find(([re]) => re.test(name))?.[1] ?? "check";
  return (
    <span className={`inline-grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sand text-clay ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-9 w-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[key]}
      </svg>
    </span>
  );
}
