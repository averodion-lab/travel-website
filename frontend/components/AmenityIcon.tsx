/** A small 2D line icon for a trailer feature, picked by keywords in its name
 *  ("King bedroom with closet" → bed, "Glass-door shower" → shower …). */

type Rule = [RegExp, string];

// 24×24 line drawings (stroke only).
const P = {
  bed: "M3 18v-7h18v7M3 14h18M6 11V8.5A1.5 1.5 0 0 1 7.5 7h3A1.5 1.5 0 0 1 12 8.5V11M3 18v2M21 18v2",
  sofa: "M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11M3 12a1.5 1.5 0 0 1 3 0v2h12v-2a1.5 1.5 0 0 1 3 0v5H3v-5ZM5 17v2M19 17v2",
  armchair: "M7 10V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V10M5 11a1.5 1.5 0 0 1 3 0v3h8v-3a1.5 1.5 0 0 1 3 0v5H5v-5ZM7 16v3M17 16v3",
  flame: "M12 3c2.5 3.5 5 5.5 5 9.5a5 5 0 0 1-10 0c0-2 1-3.5 2.5-4.5 0 2 1 3 2 3 0-3.5-1-5.5.5-8ZM4 21h16",
  tv: "M3 6h18v11H3zM8 21h8M12 17v4",
  kitchen: "M4 10h16v10H4zM4 14h16M9 10V6a3 3 0 0 1 6 0v4M8 17h1M15 17h1",
  fridge: "M6 3h12v18H6zM6 10h12M9 6v2M9 13v3",
  stove: "M4 4h16v16H4zM4 9h16M8 6.5h.01M12 6.5h.01M16 6.5h.01M8 12h8v5H8z",
  microwave: "M3 6h18v12H3zM5 8.5h10v7H5zM18 9h.01M18 12h.01M18 15h.01",
  pantry: "M5 3h14v18H5zM12 3v18M10 11v2M14 11v2",
  sink: "M4 12h16v1a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-1ZM8 12V6a2 2 0 0 1 4 0M12 6h3",
  shower: "M5 21V8a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4M11 8h8M13 11v1M16 11v1M19 11v1M14 14.5v1M17.5 14.5v1",
  slideout: "M8 5H4v14h4M16 5h4v14h-4M9 12H3M15 12h6M5 10l-2 2 2 2M19 10l2 2-2 2",
  climate: "M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0ZM12 9v8M18 5h3M18 8h2M18 11h3",
  awning: "M3 9l2-4h14l2 4H3ZM3 9c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2M5 11v9M19 11v9",
  speaker: "M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  storage: "M3 8l9-4 9 4v10l-9 4-9-4V8ZM3 8l9 4 9-4M12 12v10",
  linen: "M5 6h14v4H5zM5 10h14v4H5zM5 14h14v4H5zM8 6v12",
  dishes: "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 3v7M3 7h2M21 3c-1.5 1.5-1.5 5 0 6.5V21",
  check: "M5 12l4 4 10-10",
};

const RULES: Rule[] = [
  [/bedding|towel|linen/i, P.linen],
  [/bed(room)?\b|king|queen|bunk/i, P.bed],
  [/sofa|couch/i, P.sofa],
  [/theat(er|re)|recliner|seating/i, P.armchair],
  [/fireplace/i, P.flame],
  [/tv|entertainment|television/i, P.tv],
  [/refrigerator|fridge/i, P.fridge],
  [/range|oven|stove|cooktop/i, P.stove],
  [/microwave/i, P.microwave],
  [/pantry|cabinet/i, P.pantry],
  [/cookware|dishes|utensil/i, P.dishes],
  [/kitchen/i, P.kitchen],
  [/shower/i, P.shower],
  [/bath|sink|toilet/i, P.sink],
  [/slide/i, P.slideout],
  [/air condition|furnace|heat|a\/c/i, P.climate],
  [/awning/i, P.awning],
  [/speaker|sound|stereo/i, P.speaker],
  [/storage/i, P.storage],
];

export default function AmenityIcon({ name, className = "" }: { name: string; className?: string }) {
  const d = RULES.find(([re]) => re.test(name))?.[1] ?? P.check;
  return (
    <span className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-clay ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
}
