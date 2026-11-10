import type { NextConfig } from "next";

// `npm run build:preview` sets NEXT_OUTPUT=export: the whole site becomes plain
// files in out/ that any static host can serve (no Node server needed).
const staticExport = process.env.NEXT_OUTPUT === "export";
const basePath = process.env.BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Partial prerendering can't be used in a static export, so the preview
  // build renders every page fully at build time instead.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  output: staticExport ? "export" : undefined,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    // Photos are resized ahead of time by scripts/optimize-images.mjs.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [640, 828, 1080, 1280, 1920],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
