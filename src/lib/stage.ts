/* Scroll phases of the sticky 3D stage, read straight from the section boxes (no scroll library).
   toConfig  0 -> 1 while the configurator section scrolls up into view
   toExplode 0 -> 1 while the movement section scrolls up into view
   explode   0 -> 1 across the pinned part of the movement section */

export type StagePhases = { toConfig: number; toExplode: number; explode: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function readStage(out: StagePhases): StagePhases {
  const vh = window.innerHeight || 1;
  const config = document.getElementById("configure");
  const movement = document.getElementById("movement");
  if (config) {
    const top = config.getBoundingClientRect().top;
    out.toConfig = clamp01(1 - top / (vh * 0.85));
  }
  if (movement) {
    const r = movement.getBoundingClientRect();
    out.toExplode = clamp01(1 - r.top / (vh * 0.85));
    const travel = Math.max(1, r.height - vh);
    out.explode = clamp01((-r.top - vh * 0.1) / (travel * 0.8));
  }
  return out;
}
