"use client";

import { findCase, findDial, findStrap } from "@/lib/options";
import { useConfig } from "@/lib/store";

/* The code-drawn poster: shown while the 3D warms up and kept when WebGL is missing or lost.
   It follows the configurator, so the page still works without 3D. */
export default function WatchPoster({ className = "" }: { className?: string }) {
  const config = useConfig();
  const c = findCase(config.case);
  const d = findDial(config.dial);
  const s = findStrap(config.strap);
  const strapFill = s.kind === "bracelet" ? "url(#poster-links)" : s.color;
  const indices = Array.from({ length: 12 }, (_, h) => h).filter((h) => h !== 3);

  return (
    <svg className={className} viewBox="0 0 400 640" role="img" aria-label={`Aurum Meridian 39 in ${c.label} with a ${d.label} dial on a ${s.label}`}>
      <defs>
        <radialGradient id="poster-dial" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor={d.accent} />
          <stop offset="1" stopColor={d.base} />
        </radialGradient>
        <linearGradient id="poster-case" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor={c.color} stopOpacity="1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.55" />
        </linearGradient>
        <pattern id="poster-links" width="100" height="26" patternUnits="userSpaceOnUse">
          <rect width="100" height="26" fill={c.color} />
          <rect x="0" y="2" width="30" height="22" rx="5" fill="#000" opacity="0.18" />
          <rect x="70" y="2" width="30" height="22" rx="5" fill="#000" opacity="0.18" />
          <rect x="33" y="1" width="34" height="24" rx="6" fill="#fff" opacity="0.25" />
        </pattern>
        <linearGradient id="poster-strap-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.12" stopColor="#000" stopOpacity="0" />
          <stop offset="0.88" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {/* straps */}
      <g>
        <path d="M150 0 H250 V220 H150 Z" fill={strapFill} />
        <path d="M150 0 H250 V220 H150 Z" fill="url(#poster-strap-shade)" />
        <path d="M150 420 H250 V640 H150 Z" fill={strapFill} />
        <path d="M150 420 H250 V640 H150 Z" fill="url(#poster-strap-shade)" />
        {s.kind !== "bracelet" && s.kind !== "silk" && (
          <g stroke={s.stitch} strokeWidth="2" strokeDasharray="6 5" opacity="0.8">
            <path d="M160 0 V215 M240 0 V215 M160 425 V640 M240 425 V640" />
          </g>
        )}
        {s.kind === "silk" && <path d="M196 0 V220 M196 420 V640" stroke={s.stitch} strokeWidth="6" />}
      </g>
      {/* lugs */}
      <g fill="url(#poster-case)">
        <rect x="136" y="186" width="30" height="70" rx="10" />
        <rect x="234" y="186" width="30" height="70" rx="10" />
        <rect x="136" y="384" width="30" height="70" rx="10" />
        <rect x="234" y="384" width="30" height="70" rx="10" />
      </g>
      {/* crown */}
      <rect x="318" y="302" width="18" height="36" rx="4" fill="url(#poster-case)" />
      {/* case + bezel */}
      <circle cx="200" cy="320" r="124" fill="url(#poster-case)" />
      <circle cx="200" cy="320" r="112" fill={c.color} />
      <circle cx="200" cy="320" r="112" fill="url(#poster-case)" opacity="0.6" />
      {/* dial */}
      <circle cx="200" cy="320" r="100" fill="url(#poster-dial)" />
      <circle cx="200" cy="320" r="92" fill="none" stroke={d.ink} strokeOpacity="0.5" strokeWidth="1" />
      <g fill={c.trim}>
        {indices.map((h) => (
          <rect key={h} x={h === 0 ? -6 : -2.5} y={-86} width={h === 0 ? 12 : 5} height="16" rx="1" transform={`translate(200 320) rotate(${h * 30})`} />
        ))}
      </g>
      <rect x="252" y="313" width="18" height="14" fill="#F7F2E8" />
      <text x="200" y="282" textAnchor="middle" fontFamily="var(--ff-display), Georgia, serif" fontWeight="600" fontSize="17" letterSpacing="3" fill={d.ink}>
        AURUM
      </text>
      <text x="200" y="365" textAnchor="middle" fontFamily="var(--ff-display), Georgia, serif" fontStyle="italic" fontSize="13" fill={d.ink}>
        Meridian
      </text>
      {/* hands at 10:09 */}
      <g fill={c.trim}>
        <path d="M0 -50 L6 0 L0 8 L-6 0 Z" transform="translate(200 320) rotate(-55)" />
        <path d="M0 -74 L5 0 L0 9 L-5 0 Z" transform="translate(200 320) rotate(54)" />
        <rect x="-1" y="-82" width="2" height="100" transform="translate(200 320) rotate(190)" />
        <circle cx="200" cy="320" r="5" />
      </g>
      {/* crystal glint */}
      <path d="M130 270 A100 100 0 0 1 250 232" stroke="#fff" strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  );
}
