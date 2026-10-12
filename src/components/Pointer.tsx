"use client";

import { useEffect, useRef } from "react";
import { getMotion, subscribeMotion } from "@/lib/motion";

/* Desktop-only pointer extras: magnetic gold/ghost buttons and a companion cursor ring.
   The native cursor always stays visible. Starts after window load, only for a fine pointer with full motion. */
export default function Pointer() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const fine = window.matchMedia("(pointer: fine)");
    let stop: (() => void) | null = null;

    const start = () => {
      let tx = -100,
        ty = -100,
        x = -100,
        y = -100,
        loop = 0;
      let mag: HTMLElement | null = null;
      let magRect: DOMRect | null = null;
      let magFrame = 0;
      let px = 0,
        py = 0;

      const frame = () => {
        x += (tx - x) * 0.2;
        y += (ty - y) * 0.2;
        cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        loop = Math.abs(tx - x) + Math.abs(ty - y) > 0.2 ? requestAnimationFrame(frame) : 0;
      };

      const release = () => {
        if (!mag) return;
        mag.style.transform = "";
        const label = mag.querySelector<HTMLElement>(".btn-label");
        if (label) label.style.transform = "";
        mag = null;
        magRect = null;
      };

      const pull = () => {
        magFrame = 0;
        if (!mag || !magRect) return;
        const r = magRect;
        const dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 2)));
        const dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 2)));
        mag.style.transform = `translate(${(dx * 6).toFixed(2)}px, ${(dy * 6).toFixed(2)}px)`;
        const label = mag.querySelector<HTMLElement>(".btn-label");
        if (label) label.style.transform = `translate(${(dx * 3).toFixed(2)}px, ${(dy * 3).toFixed(2)}px)`;
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        tx = e.clientX;
        ty = e.clientY;
        px = e.clientX;
        py = e.clientY;
        cursor.removeAttribute("data-hidden");
        if (!loop) loop = requestAnimationFrame(frame);

        const t = e.target as Element | null;
        const btn = t?.closest<HTMLElement>(".btn-gold, .btn-ghost") ?? null;
        if (btn !== mag) {
          release();
          if (btn) {
            mag = btn;
            magRect = btn.getBoundingClientRect(); // read once on entry, at rest
          }
        }
        if (mag && !magFrame) magFrame = requestAnimationFrame(pull);

        let state = "";
        if (t?.closest(".stage-canvas") && t.closest('[data-stage-phase="configure"]')) state = "drag";
        else if (t?.closest("a, button, label, input, select, textarea")) state = "link";
        if (cursor.dataset.state !== state) cursor.dataset.state = state;
      };
      const onLeave = (e: MouseEvent) => {
        if (!e.relatedTarget) {
          cursor.setAttribute("data-hidden", "");
          release();
        }
      };

      cursor.setAttribute("data-on", "");
      cursor.setAttribute("data-hidden", "");
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseout", onLeave);
      return () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("mouseout", onLeave);
        cancelAnimationFrame(loop);
        cancelAnimationFrame(magFrame);
        release();
        cursor.removeAttribute("data-on");
      };
    };

    const sync = () => {
      const want = fine.matches && !getMotion().reduced;
      if (want && !stop) stop = start();
      else if (!want && stop) {
        stop();
        stop = null;
      }
    };

    let unMotion: (() => void) | null = null;
    const boot = () => {
      sync();
      unMotion = subscribeMotion(sync);
      fine.addEventListener("change", sync);
    };
    if (document.readyState === "complete") boot();
    else window.addEventListener("load", boot, { once: true });

    return () => {
      window.removeEventListener("load", boot);
      unMotion?.();
      fine.removeEventListener("change", sync);
      stop?.();
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" aria-hidden="true">
      <span className="cursor-ring" />
      <span className="cursor-label">Drag</span>
    </div>
  );
}
