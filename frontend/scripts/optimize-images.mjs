// Makes phone-, tablet- and desktop-sized WebP copies of every photo in
// public/images, into public/_img/<width>/images/... (git-ignored).
// lib/image-loader.ts points <Image> at these, so the site needs no image server.
// Runs before `npm run dev` and every build; only redoes files that changed.
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..", "public");
const WIDTHS = [640, 1080, 1920]; // keep in sync with lib/image-loader.ts
const SOURCE = path.join(ROOT, "images");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) yield full;
  }
}

let made = 0;
for await (const file of walk(SOURCE)) {
  const rel = path.relative(ROOT, file).replace(/\.(jpe?g|png)$/i, ".webp");
  const changed = (await stat(file)).mtimeMs;
  for (const width of WIDTHS) {
    const out = path.join(ROOT, "_img", String(width), rel);
    const existing = await stat(out).catch(() => null);
    if (existing && existing.mtimeMs >= changed) continue;
    await mkdir(path.dirname(out), { recursive: true });
    await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    made++;
  }
}
console.log(made ? `Optimized images: wrote ${made} files.` : "Optimized images: up to date.");
