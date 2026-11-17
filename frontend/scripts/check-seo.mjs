// Checks the built pages (out/ from `npm run build:preview`) for the basics
// search engines care about: one <h1>, a title under 60 characters, a
// description under 155, a canonical link, Open Graph tags and alt text on
// every image. Exits 1 if anything is off, so it can run in CI.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
const SKIP = new Set(["404.html", "_not-found.html", "admin", "book", "booking", "design-ideas"]); // not indexed / local only

async function* pages(dir, rel = "") {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || SKIP.has(e.name.replace(/\.html$/, ""))) continue;
    if (e.isDirectory()) yield* pages(path.join(dir, e.name), path.join(rel, e.name));
    else if (e.name.endsWith(".html")) yield [path.join(rel, e.name), path.join(dir, e.name)];
  }
}

const attr = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : null;
};

let problems = 0;
const rows = [];
for await (const [name, file] of pages(OUT)) {
  const html = await readFile(file, "utf8");
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const description = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const og = attr(html, /<meta property="og:image" content="([^"]*)"/);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  const noAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  let jump = "";
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      jump = `h${headings[i - 1]}→h${headings[i]}`;
      break;
    }
  }
  const issues = [];
  if (!title) issues.push("no title");
  else if (title.length > 60) issues.push(`title ${title.length} chars`);
  if (!description) issues.push("no description");
  else if (description.length > 155) issues.push(`description ${description.length} chars`);
  if (h1s !== 1) issues.push(`${h1s} h1`);
  if (!canonical) issues.push("no canonical");
  if (!og) issues.push("no og:image");
  if (noAlt) issues.push(`${noAlt} img without alt`);
  if (jump) issues.push(`heading jump ${jump}`);
  if (issues.length) problems++;
  rows.push({ page: name, title: title?.length ?? 0, desc: description?.length ?? 0, h1: h1s, issues: issues.join("; ") || "ok" });
}
console.table(rows);
if (problems) {
  console.error(`${problems} page(s) need attention.`);
  process.exit(1);
}
console.log("All pages pass the SEO checks.");
