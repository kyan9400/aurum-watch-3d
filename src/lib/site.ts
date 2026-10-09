/** Absolute site URL for metadata, robots and sitemap. Set NEXT_PUBLIC_SITE_URL after deploying. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurum-watch-3d.vercel.app").replace(/\/$/, "");
