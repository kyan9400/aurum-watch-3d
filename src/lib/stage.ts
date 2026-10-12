/* Scroll phases of the sticky 3D stage, read straight from the section boxes (no scroll library).
   toConfig  0 -> 1 while the configurator section scrolls up into view
   toExplode 0 -> 1 while the movement section scrolls up into view
   explode   0 -> 1 across the pinned part of the movement section
   One shared reader: a single scroll/resize listener, at most one layout read per frame. */

export type StagePhases = { toConfig: number; toExplode: number; explode: number };
export type ScrollState = StagePhases & { y: number; progress: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function readStage(out: ScrollState | StagePhases): StagePhases {
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
  if ("progress" in out) {
    // layout is already fresh after the reads above, so these cost nothing extra
    const max = document.documentElement.scrollHeight - vh;
    out.y = window.scrollY;
    out.progress = max > 0 ? clamp01(out.y / max) : 0;
  }
  return out;
}

/* ---------- shared store ---------- */

type Listener = (s: ScrollState) => void;
const shared: ScrollState = { toConfig: 0, toExplode: 0, explode: 0, y: 0, progress: 0 };
const listeners = new Set<Listener>();
let raf = 0;

function tick() {
  raf = 0;
  readStage(shared);
  listeners.forEach((l) => l(shared));
}

function request() {
  if (!raf) raf = requestAnimationFrame(tick);
}

/** Subscribe to scroll phases. The listener runs on the next frame and then once per scrolled frame. */
export function subscribeStage(fn: Listener) {
  listeners.add(fn);
  if (listeners.size === 1) {
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
  }
  request();
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export function getStage(): Readonly<ScrollState> {
  return shared;
}

/* ---------- exploded-view timeline windows (shared by the legend and the 3D) ---------- */

export const LAYER_COUNT = 6;
/** Layer i opens inside [i * LAYER_STEP, i * LAYER_STEP + LAYER_SPAN]. */
export const LAYER_STEP = 0.08;
export const LAYER_SPAN = 0.22;
export const REVEAL_START = 0.62;
export const ASSEMBLE_START = 0.82;

/** The part in focus: it changes as each layer passes the middle of its window, then holds on the caseback. */
export function activeLayer(explode: number) {
  for (let i = LAYER_COUNT - 1; i > 0; i--) if (explode >= i * LAYER_STEP + LAYER_SPAN * 0.5) return i;
  return 0;
}
