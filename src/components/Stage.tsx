"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { probeGPU, type Probe } from "@/lib/quality";
import { readStage, type StagePhases } from "@/lib/stage";
import WatchPoster from "./WatchPoster";

// three.js + R3F live in this lazy chunk only; the page HTML never waits for it
const WatchCanvas = dynamic(() => import("./three/WatchCanvas"), { ssr: false });

type Phase = "hero" | "configure" | "movement";

export default function Stage({ children }: { children: ReactNode }) {
  const [probe, setProbe] = useState<Probe | null>(null);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [phase, setPhase] = useState<Phase>("hero");

  // decide WebGL + quality tier once the page is idle, before any Canvas exists
  useEffect(() => {
    let idleId = 0;
    let timeoutId = 0;
    const run = () => setProbe(probeGPU());
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(run, { timeout: 1200 });
      else timeoutId = window.setTimeout(run, 200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idleId) window.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  // which part of the stage we are in (moves the poster when there is no 3D)
  useEffect(() => {
    const phases: StagePhases = { toConfig: 0, toExplode: 0, explode: 0 };
    const onScroll = () => {
      readStage(phases);
      setPhase(phases.toExplode > 0.5 ? "movement" : phases.toConfig > 0.5 ? "configure" : "hero");
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => {
    setLost(true);
    setReady(false);
  }, []);

  const show3D = !!probe?.webgl && !lost;
  const posterVisible = !ready || !show3D;

  return (
    <div className="relative" data-stage-phase={phase}>
      <div className="stage-layer">
        <div className="stage-glow" aria-hidden="true" />
        <div className={`stage-poster ${posterVisible ? "" : "is-hidden"}`} data-phase={phase}>
          <WatchPoster className="h-full w-auto" />
        </div>
        {show3D && (
          <div className={`stage-canvas ${ready ? "is-ready" : ""}`}>
            <WatchCanvas tier={probe.tier} onReady={onReady} onLost={onLost} />
          </div>
        )}
        {probe && !probe.webgl && (
          <p className="stage-note">3D is not available in this browser, so you are seeing a drawing of the watch.</p>
        )}
      </div>
      {children}
    </div>
  );
}
