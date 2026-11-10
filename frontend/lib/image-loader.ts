/** <Image> loader for the self-hosted photos: picks the pre-made WebP copy
 *  (from scripts/optimize-images.mjs) that is at least as wide as needed. */
const WIDTHS = [640, 1080, 1920]; // keep in sync with scripts/optimize-images.mjs

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("/images/") || !/\.(jpe?g|png)$/i.test(src)) return src;
  const size = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `${basePath}/_img/${size}${src.replace(/\.(jpe?g|png)$/i, ".webp")}`;
}
