"use client";

import { useEffect, useRef } from "react";
import { findCase, findDial, findStrap } from "@/lib/options";
import { useConfig } from "@/lib/store";

const ROMAN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
// 3 o'clock gives way to the date, 6 o'clock to the open heart (as on the 3D dial)
const INDICES = Array.from({ length: 12 }, (_, h) => h).filter((h) => h !== 3 && h !== 6);
// open heart: the 3D aperture (0, -0.37, r 0.225 on a 0.805 dial) mapped onto this 100-unit dial
const AX = 200;
const AY = 366;
const AR = 28;
// a blued hairspring: half-turn arcs with a growing radius
const SPRING = Array.from({ length: 13 }, (_, i) => {
  const r = 1.5 + i;
  return `a${r} ${r} 0 0 1 0 ${i % 2 ? -2 * r : 2 * r}`;
}).join(" ");

/* The code-drawn poster: shown while the 3D warms up and kept when WebGL is missing or lost.
   It follows the configurator, so the page still works without 3D. A simplified drawing of the 3D hero:
   amber halo, tilted chapter ring and light shaft behind the watch, open heart at 6 o'clock, skeletonised hands. */
export default function WatchPoster({ className = "" }: { className?: string }) {
  const config = useConfig();
  const c = findCase(config.case);
  const d = findDial(config.dial);
  const s = findStrap(config.strap);
  const strapFill = s.kind === "bracelet" ? "url(#poster-links)" : s.color;
  const hourRef = useRef<SVGPathElement>(null);
  const minuteRef = useRef<SVGPathElement>(null);
  const secondRef = useRef<SVGGElement>(null);

  // the server HTML shows 10:09; after hydration the hands move to local time, refreshed once a minute
  useEffect(() => {
    let timer = 0;
    const set = (el: SVGElement | null, deg: number) => el?.setAttribute("transform", `translate(200 320) rotate(${deg.toFixed(1)})`);
    const update = () => {
      const now = new Date();
      const m = now.getMinutes() + now.getSeconds() / 60;
      set(hourRef.current, ((now.getHours() % 12) + m / 60) * 30);
      set(minuteRef.current, m * 6);
      set(secondRef.current, now.getSeconds() * 6);
    };
    const schedule = () => {
      window.clearTimeout(timer);
      update();
      timer = window.setTimeout(schedule, 60000 - (Date.now() % 60000));
    };
    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <svg className={className} viewBox="0 0 400 640" overflow="visible" role="img" aria-label={`Aurum Meridian 39 in ${c.label} with a ${d.label} dial on a ${s.label}`}>
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
        <radialGradient id="poster-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c98a3a" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#a8742f" stopOpacity="0.12" />
          <stop offset="1" stopColor="#7a4f1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="poster-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d29a" stopOpacity="0.07" />
          <stop offset="1" stopColor="#f3d29a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="poster-heart" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#3a3b40" />
          <stop offset="1" stopColor="#101114" />
        </radialGradient>
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
      {/* backdrop: amber halo, a slanted light shaft and the giant engraved chapter ring, tilted like an orbit */}
      <g aria-hidden="true">
        <circle cx="200" cy="330" r="300" fill="url(#poster-halo)" />
        <path d="M300 -160 L420 -160 L200 700 L80 700 Z" fill="url(#poster-shaft)" transform="rotate(12 200 320)" />
        <g transform="translate(190 335) rotate(-14) scale(1 0.92)" fill="none" stroke="#D2AE6D">
          <circle r="244" strokeOpacity="0.16" strokeWidth="1" />
          <circle r="237" strokeOpacity="0.2" strokeWidth="7" strokeDasharray="0.7 5.5" />
          <circle r="230" strokeOpacity="0.12" strokeWidth="0.7" />
          <circle r="180" strokeOpacity="0.1" strokeWidth="0.7" />
          <circle r="174" strokeOpacity="0.07" strokeWidth="5" strokeDasharray="1.2 2.2" />
          <circle r="168" strokeOpacity="0.1" strokeWidth="0.7" />
          <g fill="#D2AE6D" fillOpacity="0.2" stroke="none" fontFamily="var(--ff-display), Georgia, serif" fontSize="22" textAnchor="middle">
            {ROMAN.map((r, i) => (
              <text key={r} transform={`rotate(${i * 30}) translate(0 -203)`} dominantBaseline="central">
                {r}
              </text>
            ))}
          </g>
        </g>
      </g>
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
      {/* dial with a railway minute track */}
      <circle cx="200" cy="320" r="100" fill="url(#poster-dial)" />
      <g fill="none" stroke={d.ink} strokeOpacity="0.6">
        <circle cx="200" cy="320" r="95.5" strokeWidth="0.6" />
        <circle cx="200" cy="320" r="90.5" strokeWidth="0.6" />
        <circle cx="200" cy="320" r="93" strokeWidth="5" strokeDasharray="0.45 9.29" transform="rotate(-90.1 200 320)" />
      </g>
      <g fill={c.trim}>
        {INDICES.map((h) => (
          <g key={h} transform={`translate(200 320) rotate(${h * 30})`}>
            {(h === 0 ? [-3.5, 3.5] : [0]).map((off) => (
              <rect key={off} x={off - 2.2} y={-88} width="4.4" height="16" rx="0.8" />
            ))}
          </g>
        ))}
      </g>
      <rect x="250" y="312.5" width="20" height="15" fill="#000" opacity="0.4" />
      <rect x="251.5" y="314" width="17" height="12" fill="#F7F2E8" />
      <g fill={d.ink} textAnchor="middle" fontFamily="var(--ff-display), Georgia, serif" dominantBaseline="central">
        <text x="200" y="270" fontWeight="600" fontSize="14" letterSpacing="2.4">
          AURUM
        </text>
        <text x="200" y="281.5" fontFamily="var(--ff-sans), system-ui, sans-serif" fontSize="3.8" letterSpacing="1.2" opacity="0.8">
          HORLOGERIE · 1911
        </text>
        <text x="200" y="291" fontStyle="italic" fontSize="8.4">
          Meridian
        </text>
      </g>
      {/* open heart at 6 o'clock: polished rim, dark sleeve, cock bridge, balance wheel and blued hairspring */}
      <g aria-hidden="true">
        <circle cx={AX} cy={AY} r={AR + 3.5} fill="#000" opacity="0.35" />
        <circle cx={AX} cy={AY} r={AR + 1.6} fill="url(#poster-case)" />
        <circle cx={AX} cy={AY} r={AR} fill="url(#poster-heart)" />
        <path d={`M${AX - 30} ${AY + 12} Q${AX} ${AY + 1} ${AX + 30} ${AY + 12}`} stroke="#9a9aa2" strokeOpacity="0.45" strokeWidth="8" fill="none" />
        <path d={`M${AX} ${AY - 2} ${SPRING}`} fill="none" stroke="#4f7fd6" strokeWidth="0.9" transform={`translate(${AX} ${AY - 1}) scale(0.62 0.62) translate(${-AX} ${-AY + 1})`} />
        <g transform={`translate(${AX} ${AY - 1}) rotate(20)`}>
          <circle r="20" fill="none" stroke="#D9B66E" strokeWidth="2.6" />
          <path d="M0 -19 V19 M-19 0 H19" stroke="#D9B66E" strokeWidth="1.3" />
          <circle r="2.6" fill="#b1243a" />
          <circle r="1" fill="#f3e2b8" />
        </g>
        <path d={`M${AX - AR + 3} ${AY - 10} A${AR} ${AR} 0 0 1 ${AX + 8} ${AY - AR + 2}`} stroke="#fff" strokeOpacity="0.16" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* hands: skeletonised dauphines; 10:09 in the server HTML (clear of the text and the open heart), local time once hydrated */}
      <g fill={c.trim} fillRule="evenodd">
        <path ref={hourRef} d="M0 -58 L5.6 -2.5 L2.5 11 L-2.5 11 L-5.6 -2.5 Z M-3.7 -8.3 L0 -45.1 L3.7 -8.3 Z" transform="translate(200 320) rotate(-55)" />
        <path ref={minuteRef} d="M0 -87 L4.5 -2.5 L2 13.7 L-2 13.7 L-4.5 -2.5 Z M-3.2 -7.3 L0 -67.1 L3.2 -7.3 Z" transform="translate(200 320) rotate(54)" />
        <g ref={secondRef} transform="translate(200 320) rotate(240)">
          <path d="M-0.75 15 L-0.45 -94 L0.45 -94 L0.75 15 Z" />
          <circle cy="21" r="4.2" />
        </g>
        <circle cx="200" cy="320" r="5.4" />
      </g>
      {/* crystal glint */}
      <path d="M130 270 A100 100 0 0 1 250 232" stroke="#fff" strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  );
}
