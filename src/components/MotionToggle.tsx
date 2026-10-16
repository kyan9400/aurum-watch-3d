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

/** First visit with the OS reduce-motion setting on: the site still starts in full motion, so offer the calm version. */
export function MotionNotice() {
  const { systemReduced, choice } = useMotion();
  if (!systemReduced || choice) return null;
  return (
    <div className="motion-notice" role="region" aria-label="Motion preference">
      <p>Full motion is on. Your system asks for reduced motion — you can switch it off here.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-gold" onClick={() => setMotionChoice("reduced")}>
          Reduce motion
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMotionChoice("full")}>
          Keep full motion
        </button>
      </div>
    </div>
  );
}
