"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { probeGPU, TIERS, wants3D } from "@/lib/quality";

// three.js for this piece lives in its own lazy chunk, requested only when the atelier nears the viewport
const HeritageCanvas = dynamic(() => import("./three/HeritageCanvas"), { ssr: false });

const POSTER = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/models/pocket-watch-1911.webp`;

/* Meridian No. 1 (1911), the house's first piece: a still photograph-like poster first, then the real 3D scan on a
   slow turntable once the section is close (and only after the page has loaded, on real GPU hardware). */
export default function HeritagePiece() {
  const ref = useRef<HTMLDivElement>(null);
  const [dprCap, setDprCap] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | null = null;
    const start = () => {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          const probe = probeGPU();
          if (wants3D(probe)) setDprCap(Math.min(TIERS[probe.tier].dprCap, 2));
        },
        { rootMargin: "900px 0px" },
      );
      io.observe(el);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      io?.disconnect();
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => {
    setLost(true);
    setReady(false);
  }, []);

  return (
    <figure className="heritage" data-reveal="fade">
      <div ref={ref} className={`heritage-stage ${ready ? "is-ready" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static still of the same scan; shown until the 3D is ready */}
        <img className="heritage-poster" src={POSTER} alt="Meridian No. 1, a gold pocket watch with an engraved case" width={720} height={720} loading="lazy" decoding="async" />
        {dprCap !== null && !lost && <HeritageCanvas dprCap={dprCap} onReady={onReady} onLost={onLost} />}
      </div>
      <figcaption className="heritage-caption">
        <span className="heritage-no">Meridian No. 1 · 1911</span>
        The first watch to leave our bench: a pocket watch with a hand-engraved case. It still sits in the atelier, and
        the Meridian you configure keeps its proportions.
      </figcaption>
    </figure>
  );
}
