"use client";

import { useEffect, useState } from "react";
import { activeLayer, subscribeStage } from "@/lib/stage";

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

  // same windows as the 3D timeline, so the words and the watch change together
  useEffect(() => subscribeStage((s) => setActive(Math.min(PARTS.length - 1, activeLayer(s.explode)))), []);

  return (
    <ol className="legend" aria-label="Parts of the watch">
      {PARTS.map((p, i) => (
        <li
          key={p.name}
          className="legend-item"
          data-active={i === active ? "true" : undefined}
          aria-current={i === active ? "step" : undefined}
        >
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
