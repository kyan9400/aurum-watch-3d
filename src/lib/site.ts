/** Absolute site URL for metadata, robots and sitemap. Set NEXT_PUBLIC_SITE_URL after deploying. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurum-watch-3d.vercel.app").replace(/\/$/, "");

/** True in the GitHub Pages mirror build (static export under /aurum-watch-3d). */
export const IS_PAGES = process.env.GH_PAGES === "1";

/** Origin used to resolve metadata files (OG images); Next adds the basePath itself. */
export const METADATA_ORIGIN = IS_PAGES ? "https://kyan9400.github.io" : SITE_URL;
