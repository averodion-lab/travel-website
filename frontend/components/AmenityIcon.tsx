import type { ReactNode } from "react";

/** A small full-colour illustration of a trailer feature, picked by keywords
 *  in its name ("King bedroom with closet" → bed, "Glass-door shower" →
 *  shower …). Drawn in the site palette (brass wood, olive fabric, cream and
 *  white, dark glass) and shown in the same white round badge as the extras. */

const O = "#2f3a2c"; // outline (olive ink)
const B = "#9c7b4b"; // brass / wood
const BD = "#7d6139"; // dark brass
const BL = "#e4d5bb"; // light brass
const C = "#f3ede2"; // cream
const W = "#ffffff";
const P = "#5d6b55"; // olive fabric
const PL = "#a9b59e"; // light olive
const G = "#2a2f2a"; // glass / screen
const FIRE = "#d98b3a";
const GLOW = "#f3cf86";
const WATER = "#8db3c2";

const ICONS: Record<string, ReactNode> = {
  bed: (
    <>
      <rect x="8" y="10" width="32" height="16" rx="4" fill={B} />
      <path d="M12 14h24" stroke={BD} />
      <rect x="10.5" y="17.5" width="12" height="6" rx="3" fill={W} />
      <rect x="25.5" y="17.5" width="12" height="6" rx="3" fill={W} />
      <rect x="6" y="23" width="36" height="9" rx="2" fill={C} />
      <path d="M6 26.5h36v5.5H6z" fill={P} />
      <path d="M6 26.5c8 1.5 20 1.5 36 0" stroke={PL} fill="none" />
      <rect x="5" y="32" width="38" height="4" rx="1" fill={BD} />
      <path d="M8 36v4M40 36v4" />
    </>
  ),
  sofa: (
    <>
      <rect x="9" y="12" width="30" height="16" rx="5" fill={P} />
      <path d="M24 13v14" stroke={PL} />
      <rect x="11" y="24" width="13" height="7" rx="2.5" fill={PL} />
      <rect x="24" y="24" width="13" height="7" rx="2.5" fill={PL} />
      <rect x="4.5" y="19" width="8" height="15" rx="4" fill={P} />
      <rect x="35.5" y="19" width="8" height="15" rx="4" fill={P} />
      <rect x="15" y="16" width="7" height="7" rx="2" fill={BL} transform="rotate(-10 18.5 19.5)" />
      <rect x="7" y="31" width="34" height="4" rx="1" fill={BD} />
      <path d="M10 35v4M38 35v4" />
    </>
  ),
  armchair: (
    <>
      <rect x="14" y="6" width="20" height="22" rx="6" fill={B} />
      <path d="M18 11h12M18 15.5h12" stroke={BD} />
      <rect x="12" y="25" width="24" height="8" rx="3" fill={BL} />
      <rect x="7.5" y="19" width="7" height="16" rx="3.5" fill={BD} />
      <rect x="33.5" y="19" width="7" height="16" rx="3.5" fill={BD} />
      <circle cx="11" cy="21.5" r="2" fill={C} />
      <rect x="15" y="34" width="18" height="4" rx="2" fill={BL} />
      <path d="M17 38l-2 3M31 38l2 3" />
    </>
  ),
  flame: (
    <>
      <rect x="6" y="11" width="36" height="28" rx="2" fill={C} />
      <rect x="3.5" y="8" width="41" height="4.5" rx="1" fill={B} />
      <rect x="11" y="17" width="26" height="16" rx="1.5" fill={G} />
      <path
        d="M24 19c3.5 3.5 6 6 6 9.5a6 6 0 0 1-12 0c0-2.3 1.4-4 3-5.4 0 2.2 1 3.4 2.2 3.4 0-3-.6-5 .8-7.5Z"
        fill={FIRE}
        stroke="none"
      />
      <path d="M24 25.5c1.6 1.7 2.6 2.8 2.6 4.3a2.6 2.6 0 0 1-5.2 0c0-1.4 1.2-2.6 2.6-4.3Z" fill={GLOW} stroke="none" />
      <path d="M15 31.5h18" stroke={B} strokeWidth="2" />
      <path d="M6 36h36" stroke={BL} />
    </>
  ),
  tv: (
    <>
      <rect x="5" y="6" width="38" height="23" rx="2" fill={G} />
      <path d="M9 10l7-2.5M9 14l11-4" stroke={W} strokeOpacity="0.35" />
      <path d="M21 29v3h6v-3" fill={BL} />
      <rect x="6" y="32" width="36" height="8" rx="1" fill={B} />
      <path d="M18 32v8M30 32v8" stroke={BD} />
      <circle cx="12" cy="36" r=".9" fill={C} stroke="none" />
      <circle cx="24" cy="36" r=".9" fill={C} stroke="none" />
      <circle cx="36" cy="36" r=".9" fill={C} stroke="none" />
    </>
  ),
  kitchen: (
    <>
      <rect x="6" y="5" width="36" height="10" rx="1" fill={BL} />
      <path d="M18 5v10M30 5v10" />
      <path d="M15 11v2M21 11v2M33 11v2" stroke={BD} />
      <rect x="10" y="18" width="8" height="5" rx="1" fill={P} />
      <path d="M9 18h10" />
      <path d="M31 23v-5a3 3 0 0 1 6 0v1" fill="none" />
      <rect x="5" y="23" width="38" height="3.5" rx=".8" fill={G} />
      <rect x="6" y="26.5" width="36" height="13" fill={B} />
      <path d="M18 26.5v13M30 26.5v13" stroke={BD} />
      <path d="M15.5 30.5v3M20.5 30.5v3M27.5 30.5v3M32.5 30.5v3" stroke={C} strokeWidth="1.6" />
    </>
  ),
  fridge: (
    <>
      <rect x="12" y="3" width="24" height="38" rx="3" fill={W} />
      <path d="M33 4v36" stroke={C} strokeWidth="3" />
      <path d="M12 26h24M24 3v23" />
      <rect x="15" y="8" width="5" height="8" rx="1" fill={G} />
      <path d="M21.5 11v8M26.5 11v8M21 30h6" stroke={B} strokeWidth="2.2" />
      <path d="M14 41v2M34 41v2" />
    </>
  ),
  stove: (
    <>
      <rect x="7" y="5" width="34" height="7" rx="1.5" fill={B} />
      <circle cx="13" cy="8.5" r="1.6" fill={C} />
      <circle cx="19.5" cy="8.5" r="1.6" fill={C} />
      <circle cx="28.5" cy="8.5" r="1.6" fill={C} />
      <circle cx="35" cy="8.5" r="1.6" fill={C} />
      <rect x="6" y="12" width="36" height="3.5" rx=".8" fill={G} />
      <rect x="7" y="15.5" width="34" height="25" rx="1.5" fill={W} />
      <path d="M13 19.5h22" stroke={B} strokeWidth="2.2" />
      <rect x="12" y="23" width="24" height="13" rx="1.5" fill={G} />
      <rect x="15" y="27" width="18" height="6" rx="1" fill={FIRE} fillOpacity="0.55" stroke="none" />
      <path d="M15 26l5-2" stroke={W} strokeOpacity="0.4" />
    </>
  ),
  microwave: (
    <>
      <rect x="4" y="10" width="40" height="27" rx="3" fill={W} />
      <rect x="8" y="14" width="23" height="19" rx="1.5" fill={G} />
      <ellipse cx="19.5" cy="29" rx="7" ry="1.6" fill={B} stroke="none" opacity="0.7" />
      <path d="M11 18l5-2M11 22l8-3.5" stroke={W} strokeOpacity="0.35" />
      <rect x="33.5" y="14" width="7" height="19" rx="1" fill={C} />
      <rect x="34.8" y="15.5" width="4.4" height="3" rx=".5" fill={P} stroke="none" />
      <path d="M35.3 22h.01M38.7 22h.01M35.3 25h.01M38.7 25h.01M35.3 28h.01M38.7 28h.01" strokeWidth="1.8" />
      <path d="M8 37v2M40 37v2" />
    </>
  ),
  pantry: (
    <>
      <rect x="8" y="3" width="32" height="38" rx="2" fill={B} />
      <rect x="11" y="6" width="26" height="32" fill={C} />
      <path d="M11 16h26M11 27h26" stroke={BD} strokeWidth="1.8" />
      <rect x="13" y="9.5" width="5" height="6.5" rx="1" fill={W} />
      <path d="M13 9.5h5" stroke={B} strokeWidth="2" />
      <rect x="20" y="11" width="5" height="5" rx="1" fill={PL} />
      <rect x="27" y="8.5" width="7" height="7.5" rx="1" fill={BL} />
      <rect x="13" y="20" width="9" height="7" rx="1" fill={P} />
      <circle cx="29" cy="23.5" r="3.5" fill={FIRE} fillOpacity="0.75" />
      <rect x="14" y="31" width="20" height="7" rx="1" fill={BL} />
    </>
  ),
  sink: (
    <>
      <rect x="9" y="3" width="30" height="13" rx="6.5" fill={WATER} fillOpacity="0.35" />
      <path d="M14 8l5-2.5M15 12l9-4.5" stroke={W} />
      <path d="M14.5 21v-3a1.6 1.6 0 0 1 3.2 0M30.3 21v-3a1.6 1.6 0 0 1 3.2 0" fill="none" />
      <rect x="5" y="21" width="38" height="4" rx="1" fill={W} />
      <ellipse cx="16" cy="23" rx="5" ry="1" fill={C} />
      <ellipse cx="32" cy="23" rx="5" ry="1" fill={C} />
      <rect x="6" y="25" width="36" height="14" fill={B} />
      <path d="M24 25v14" stroke={BD} />
      <path d="M20.5 30v4M27.5 30v4" stroke={C} strokeWidth="1.6" />
    </>
  ),
  shower: (
    <>
      <rect x="7" y="4" width="34" height="34" fill={C} />
      <path d="M7 12h15M7 20h15M7 28h15M14.5 4v34" stroke={BL} />
      <path d="M11 4v4h7" fill="none" />
      <path d="M15 8h6l-1 2.5h-4Z" fill={B} />
      <path d="M16 13v2M18 14v2.5M20 13v2M17 18v2M19 18.5v2" stroke={WATER} strokeWidth="1.6" />
      <rect x="22" y="5" width="18" height="33" fill={WATER} fillOpacity="0.3" />
      <path d="M25 12l9-5M25 18l13-7" stroke={W} strokeWidth="1.6" />
      <path d="M25 22v6" stroke={B} strokeWidth="2.2" />
      <rect x="5" y="38" width="38" height="3.5" rx="1" fill={W} />
    </>
  ),
  outshower: (
    <>
      <path d="M2 20c3-6 6-9 8-9s3 3 3 3v26H2Z" fill={PL} stroke="none" opacity="0.6" />
      <rect x="14" y="6" width="30" height="34" rx="2" fill={W} />
      <rect x="18" y="10" width="14" height="14" rx="1" fill={C} />
      <path d="M32 11l6 3v9l-6 1" fill={BL} />
      <circle cx="25" cy="14" r="1.4" fill={B} />
      <path d="M25 15.5c0 4 4 4 4 8" fill="none" stroke={O} />
      <path d="M27 23.5h4l-.6 2h-2.8Z" fill={B} />
      <path d="M27.5 28v2.2M29.5 28.5v2.5M31 28v2" stroke={WATER} strokeWidth="1.6" />
      <path d="M20 21h3M20 18.5h2" stroke={B} strokeWidth="1.6" />
      <path d="M14 40h30" />
      <path d="M6 42h34" stroke={BL} />
    </>
  ),
  slideout: (
    <>
      <rect x="15" y="4" width="18" height="38" rx="3" fill={W} />
      <rect x="6" y="11" width="9" height="11" rx="1" fill={B} />
      <rect x="33" y="22" width="9" height="12" rx="1" fill={B} />
      <rect x="18" y="8" width="12" height="6" rx="1" fill={G} />
      <path d="M18 30h12M18 34h8" stroke={BL} />
      <path d="M3 16.5h4M4.5 15l-1.5 1.5L4.5 18M45 28h-4M43.5 26.5 45 28l-1.5 1.5" stroke={P} strokeWidth="1.6" />
    </>
  ),
  climate: (
    <>
      <rect x="7" y="7" width="34" height="34" rx="9" fill={W} />
      <circle cx="24" cy="24" r="11.5" fill={C} />
      <path d="M24 12.5a11.5 11.5 0 0 0 0 23" stroke={WATER} strokeWidth="3" fill="none" />
      <path d="M24 12.5a11.5 11.5 0 0 1 0 23" stroke={FIRE} strokeWidth="3" fill="none" />
      <circle cx="24" cy="24" r="7" fill={W} />
      <text x="24" y="27" textAnchor="middle" fontSize="8" fontFamily="sans-serif" fill={O} stroke="none">
        72°
      </text>
    </>
  ),
  awning: (
    <>
      <rect x="4" y="16" width="40" height="23" rx="2" fill={W} />
      <rect x="9" y="21" width="9" height="18" rx="1" fill={B} />
      <circle cx="16" cy="30" r=".9" fill={C} stroke="none" />
      <rect x="23" y="21" width="15" height="8" rx="1" fill={G} />
      <path d="M4 16 2 9h44l-2 7Z" fill={C} />
      <path d="M9.3 9 10 16M16.6 9l.4 7M24 9v7M31.4 9l-.4 7M38.7 9 38 16" stroke={P} strokeWidth="3.4" />
      <path d="M4 16 2 9h44l-2 7" fill="none" />
      <path d="M6 39v3h36v-3" fill="none" />
    </>
  ),
  speaker: (
    <>
      <rect x="12" y="4" width="22" height="37" rx="3" fill={G} />
      <circle cx="23" cy="12.5" r="4" fill="#4a5446" stroke={C} />
      <circle cx="23" cy="27.5" r="8.5" fill="#4a5446" stroke={C} />
      <circle cx="23" cy="27.5" r="4" fill={B} />
      <path d="M38 22a8 8 0 0 1 0 11M41.5 18.5a13 13 0 0 1 0 18" stroke={B} strokeWidth="1.6" fill="none" />
    </>
  ),
  storage: (
    <>
      <rect x="6" y="15" width="22" height="25" rx="3" fill={B} />
      <path d="M13 15v-3h8v3" fill="none" />
      <path d="M12 15v25M22 15v25" stroke={BD} strokeWidth="1.8" />
      <rect x="25" y="22" width="17" height="18" rx="2.5" fill={P} />
      <path d="M30.5 22v-2.5h6V22" fill="none" />
      <path d="M25 29h17" stroke={PL} strokeWidth="1.6" />
      <path d="M8 40v2M26 40v2M27 40v2M40 40v2" />
    </>
  ),
  linen: (
    <>
      <rect x="7" y="30" width="34" height="8" rx="3" fill={W} />
      <rect x="9" y="22" width="30" height="8" rx="3" fill={BL} />
      <rect x="11" y="14" width="26" height="8" rx="3" fill={PL} />
      <path d="M7 34h34M9 26h30M11 18h26" stroke={C} strokeOpacity="0.9" />
      <path d="M24 14c0-4 2-6.5 5-7.5-.5 3.5-2.5 6-5 7.5ZM24 14c0-3-1.5-5-4-6 .3 3 1.8 4.8 4 6Z" fill={P} />
    </>
  ),
  dishes: (
    <>
      <circle cx="24" cy="24" r="14" fill={W} />
      <circle cx="24" cy="24" r="9.5" fill={C} />
      <circle cx="24" cy="24" r="11.8" stroke={B} strokeDasharray="1.5 2" fill="none" />
      <path d="M5 8v8a2.2 2.2 0 0 0 4.4 0V8M7.2 8v32" fill="none" />
      <path d="M43 8c-2.4 1.8-3 6.5-3 9.5h3V40" fill={BL} />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="15" fill={P} />
      <path d="M17 24.5l5 5 9.5-10" stroke={W} strokeWidth="2.4" fill="none" />
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
  [/outside shower|outdoor shower/i, "outshower"],
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
    <span
      className={`inline-grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_4px_10px_-4px_rgba(0,0,0,0.35)] ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        className="h-[2.4rem] w-[2.4rem]"
        stroke={O}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ellipse cx="24" cy="44" rx="15" ry="1.8" fill={O} opacity="0.08" stroke="none" />
        {ICONS[key]}
      </svg>
    </span>
  );
}
