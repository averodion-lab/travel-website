// Makes the 1200×630 link-preview images (Open Graph) from the site's photos,
// into public/images/og/ (committed: social networks fetch them directly).
// Run by hand after changing a source photo: `node scripts/og-images.mjs`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGES = path.resolve(import.meta.dirname, "..", "public", "images");
const OUT = path.join(IMAGES, "og");

// name → [source photo, focus]
const SOURCES = {
  home: ["montana/campside.jpg", "centre"],
  trailer: ["montana/exterior.jpg", "centre"],
  interior: ["montana/living-1.jpg", "centre"],
  lake: ["lake-campsite.jpg", "centre"],
  mountains: ["blueridge-rays.jpg", "centre"],
  campfire: ["campfire-night.jpg", "centre"],
};

await mkdir(OUT, { recursive: true });
for (const [name, [src, position]] of Object.entries(SOURCES)) {
  await sharp(path.join(IMAGES, src))
    .rotate()
    .resize({ width: 1200, height: 630, fit: "cover", position })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(OUT, `${name}.jpg`));
  console.log(`wrote og/${name}.jpg from ${src}`);
}
