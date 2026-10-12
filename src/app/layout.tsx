import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { METADATA_ORIGIN, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
});

// body font: not in the hero heading, so it is not preloaded (the size-matched fallback keeps CLS at 0)
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-sans",
  display: "swap",
  preload: false,
});


export const metadata: Metadata = {
  metadataBase: new URL(METADATA_ORIGIN),
  title: "Aurum — Meridian 39 watch configurator",
  description:
    "Configure the Aurum Meridian 39: choose the case, dial and strap of a hand-built automatic watch, then take it apart layer by layer in 3D.",
  applicationName: "Aurum",
  authors: [{ name: "Alhassan Alfarran", url: "https://github.com/kyan9400" }],
  creator: "Alhassan Alfarran",
  keywords: ["watch configurator", "3D product configurator", "three.js", "Next.js", "creative development"],
  // absolute, so the Pages mirror also points search engines at the main site
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Aurum",
    title: "Aurum — Time, turned by hand.",
    description: "A watch configurator in real-time 3D: pick the metal, dial and strap, then scroll to see the movement.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurum — Time, turned by hand.",
    description: "A watch configurator in real-time 3D: pick the metal, dial and strap, then scroll to see the movement.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0F0E0C",
  colorScheme: "dark",
};

/* Runs before paint so CSS knows the visitor's motion choice (and that JS runs) on the very first frame. */
const MOTION_BOOT = `(function(){try{var d=document.documentElement;d.classList.add("js");var u=new URLSearchParams(location.search).get("motion"),s=null;try{s=localStorage.getItem("aurum-motion")}catch(e){}var c=(u==="full"||u==="reduced")?u:s;var r=c==="full"?false:c==="reduced"?true:matchMedia("(prefers-reduced-motion: reduce)").matches;d.classList.toggle("reduce-motion",r)}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
