/** Descriptive alt text for the trailer's photos, by file name, so search
 *  engines and screen readers know what each picture shows. Unknown files fall
 *  back to "<trailer name>, photo N". */
const DESCRIPTIONS: Record<string, string> = {
  exterior: "exterior: a 40-foot fifth wheel with four slide-outs",
  campside: "campside with the power awning out, parked at a campsite",
  "off-campside": "the off-door side, showing the slide-outs",
  "living-1": "living room with theater seating, two sofas and the electric fireplace",
  "living-2": "living room looking toward the entertainment center and TV",
  kitchen: "front kitchen with the island, residential refrigerator and pantry",
  fridge: "residential refrigerator in the front kitchen",
  "stove-oven": "gas range and oven with the microwave above",
  pantry: "walk-in pantry shelves",
  "bedroom-1": "king bedroom with the bed made up",
  "bedroom-2": "king bedroom from the doorway, with the wardrobe",
  "bedroom-closet": "walk-in closet in the bedroom",
  "bathroom-1": "bathroom with the double-sink vanity",
  "bathroom-2": "glass-door shower in the bathroom",
  "entertainment-center": "entertainment center with the TV and fireplace",
  fireplace: "electric fireplace under the TV",
  "pass-through-storage": "pass-through storage bay underneath",
  floorplan: "floor plan",
};

export function photoAlt(src: string, trailerName: string, index: number): string {
  const file = src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "";
  const text = DESCRIPTIONS[file];
  return text ? `${trailerName}, ${text}` : `${trailerName}, photo ${index + 1}`;
}
