import type { NextConfig } from "next";

// GH_PAGES=1 builds a static mirror for GitHub Pages (served under /aurum-watch-3d).
const isPages = process.env.GH_PAGES === "1";
const PAGES_BASE = "/aurum-watch-3d";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isPages
    ? {
        // static export: no server, so no custom headers
        output: "export",
        basePath: PAGES_BASE,
        assetPrefix: PAGES_BASE,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // basic hardening; no CSP, because the inline motion boot script and the JSON-LD must run
        async headers() {
          return [{ source: "/(.*)", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
