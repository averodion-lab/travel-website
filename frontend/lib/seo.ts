import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/api";

/** Where the site lives, including any base path (so canonical links, the
 *  sitemap and Open Graph images are absolute). Set NEXT_PUBLIC_SITE_URL for
 *  the real domain; the GitHub preview and local dev are worked out here. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_BASE_PATH ? `https://averodion-lab.github.io${process.env.NEXT_PUBLIC_BASE_PATH}` : "") ||
  "http://localhost:3210"
).replace(/\/$/, "");

/** The GitHub preview is kept out of search results, so the placeholder name
 *  and address never compete with the real domain. Set NEXT_PUBLIC_SITE_URL
 *  (the real domain) and the site is indexed. */
export const INDEXABLE = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

/** The one trailer; pages are listed under this slug in the sitemap. */
export const TRAILER_SLUG = "montana";

/** Open Graph preview images (1200×630, scripts/og-images.mjs). */
export const OG = {
  home: "/images/og/home.jpg",
  trailer: "/images/og/trailer.jpg",
  interior: "/images/og/interior.jpg",
  lake: "/images/og/lake.jpg",
  mountains: "/images/og/mountains.jpg",
  campfire: "/images/og/campfire.jpg",
};

/** Everything a page needs for search and link previews, in one call:
 *  title and description (also used for Open Graph and Twitter), the
 *  canonical link and the preview image. */
export function pageMeta({
  title,
  description,
  path,
  image = OG.home,
  index = true,
}: {
  title: string;
  description: string;
  /** The page's path, e.g. "/faq". */
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const url = path === "/" ? SITE_URL + "/" : SITE_URL + path;
  // Browser tab and search result: "Page | Site". The home page is written in
  // full here so the layout's "%s | Site" template isn't applied twice.
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title: path === "/" ? { absolute: fullTitle } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
    robots: index && INDEXABLE ? { index: true, follow: true } : { index: false, follow: index },
  };
}
