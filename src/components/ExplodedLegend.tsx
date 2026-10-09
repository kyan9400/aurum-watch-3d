"use client";

import { useEffect, useState } from "react";
import { readStage, type StagePhases } from "@/lib/stage";

const PARTS = [
  { name: "Sapphire crystal", text: "Domed, anti-reflective on both faces." },
  { name: "Hands", text: "Dauphine, diamond-cut and polished." },
  { name: "Dial", text: "Fired, printed and applied by hand." },
  { name: "Case", text: "39 mm, 10.4 mm thick, water-resistant to 50 m." },
  { name: "Calibre AU-28", text: "31 jewels, 28,800 vibrations an hour." },
  { name: "Caseback", text: "Sapphire, so the rotor stays in view." },
];

export default function ExplodedLegend() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const phases: StagePhases = { toConfig: 0, toExplode: 0, explode: 0 };
    const onScroll = () => {
      readStage(phases);
      setActive(Math.min(PARTS.length - 1, Math.floor(phases.explode * PARTS.length)));
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <ol className="legend">
      {PARTS.map((p, i) => (
        <li key={p.name} className="legend-item" data-active={i === active ? "true" : undefined}>
          <span className="legend-num" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="legend-name">{p.name}</span>
            <span className="legend-text">{p.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
