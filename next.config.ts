import type { NextConfig } from "next";

/**
 * Two build targets share this config:
 *
 *   npm run build        → Vercel / Node (no basePath, server features available)
 *   npm run build:pages  → static export for GitHub Pages under /react-19-persian-guide
 *
 * PAGES_BUILD=1 switches on `output: "export"` + basePath so the same source
 * ships to both hosts without hand-editing anything. The `/book` online
 * edition is a regular App Router route, so no rewrites are needed: with
 * `trailingSlash` the static export emits `book/index.html`, keeping the
 * long-standing `/book/` URL (and every `#ch-NN` deep link) intact.
 */
const isPages = process.env.PAGES_BUILD === "1";
const basePath = isPages ? "/react-19-persian-guide" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  ...(isPages && {
    output: "export",
    basePath,
    // GitHub Pages has no image optimizer.
    images: { unoptimized: true },
  }),

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  trailingSlash: true,

  // Dev-only: allow the sandbox preview proxy origins.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "localhost", "127.0.0.1"],
};

export default nextConfig;
