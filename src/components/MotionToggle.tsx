"use client";

import { setMotionChoice, useMotion } from "@/lib/motion";

export function MotionToggle({ className = "" }: { className?: string }) {
  const { reduced } = useMotion();
  return (
    <button
      type="button"
      className={`btn-text ${className}`}
      aria-pressed={!reduced}
      onClick={() => setMotionChoice(reduced ? "full" : "reduced")}
    >
      {reduced ? "Turn on full motion" : "Reduce motion"}
    </button>
  );
}

/** First visit with the OS setting on: say why things are calm and offer full motion. */
export function MotionNotice() {
  const { systemReduced, choice } = useMotion();
  if (!systemReduced || choice) return null;
  return (
    <div className="motion-notice" role="region" aria-label="Motion preference">
      <p>Animations are calmed to match your system setting.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-gold" onClick={() => setMotionChoice("full")}>
          Turn on full motion
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMotionChoice("reduced")}>
          Keep it calm
        </button>
      </div>
    </div>
  );
}
