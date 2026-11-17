// Writes public/robots.txt and public/sitemap.xml (git-ignored) before every
// build and `npm run dev`, so both the Node build and the static export serve
// them. The site address follows lib/seo.ts: NEXT_PUBLIC_SITE_URL for the real
// domain, the GitHub preview when a base path is set, localhost otherwise.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC = path.resolve(import.meta.dirname, "..", "public");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (basePath ? `https://averodion-lab.github.io${basePath}` : "") ||
  "http://localhost:3210"
).replace(/\/$/, "");

// Keep in sync with the pages that have pageMeta() (the indexable ones).
const PAGES = ["/", "/fleet/montana", "/gallery", "/how-it-works", "/destinations", "/book-now", "/faq", "/policies", "/contact"];
// One page per campground: the slugs come from the built-in park list.
const preview = await readFile(path.resolve(import.meta.dirname, "..", "lib", "preview.ts"), "utf8");
const parks = preview.slice(preview.indexOf("export const PREVIEW_PARKS"));
for (const m of parks.matchAll(/"slug": "([a-z0-9-]+)"/g)) PAGES.push(`/destinations/${m[1]}`);

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  PAGES.map((p) => `  <url><loc>${SITE_URL}${p === "/" ? "/" : p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

// Crawlers may read everything public; the booking steps, the manage page and
// the owner dashboard are private.
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /book\nDisallow: /booking/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

await writeFile(path.join(PUBLIC, "sitemap.xml"), sitemap);
await writeFile(path.join(PUBLIC, "robots.txt"), robots);
console.log(`SEO files: sitemap and robots for ${SITE_URL}`);
