"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeStage } from "@/lib/stage";

const SECTIONS = [
  { id: "top", label: "Hero" },
  { id: "configure", label: "Configure" },
  { id: "movement", label: "Movement" },
  { id: "calibre", label: "Calibre" },
  { id: "family", label: "Family" },
  { id: "ledger", label: "Ledger" },
  { id: "reserve", label: "Reserve" },
];

/* Scroll progress bar, section dots (desktop) and the hide-on-scroll header.
   Everything reads the shared scroll store, so there is still one layout read per frame. */
export default function ScrollChrome() {
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    let lastY = -1;
    const keepHeader = () =>
      !header ||
      header.contains(document.activeElement) ||
      document.getElementById("mobile-menu")?.hasAttribute("data-open") ||
      document.documentElement.classList.contains("reduce-motion");

    const unsub = subscribeStage((s) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${s.progress.toFixed(4)})`;
      if (!header) return;
      const down = lastY >= 0 && s.y > lastY + 2;
      const up = s.y < lastY - 2;
      if (s.y < 120 || up || keepHeader()) header.removeAttribute("data-hidden");
      else if (down) header.setAttribute("data-hidden", "");
      lastY = s.y;
    });
    const show = () => header?.removeAttribute("data-hidden");
    header?.addEventListener("focusin", show);

    // the section in the middle band of the viewport is the active one
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      unsub();
      io.disconnect();
      header?.removeEventListener("focusin", show);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div ref={barRef} className="scroll-progress-bar" />
      </div>
      <nav className="section-dots" aria-label="Page sections">
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="section-dot" aria-current={active === s.id ? "true" : undefined}>
                <span className="section-dot-label">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
