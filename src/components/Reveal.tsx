"use client";

import { useEffect } from "react";

/* One observer for every [data-reveal] element below the fold (section headings, ledes, rows, cards).
   CSS hides them only when <html> has .js and full motion; this adds .is-in as they enter.
   Never used on the hero heading: it is the LCP and must paint on the first frame. */
export default function Reveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const showAll = () => items.forEach((el) => el.classList.add("is-in"));
    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        fired = true;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    items.forEach((el) => io.observe(el));
    // safety net: if the observer never reports, show everything
    const timer = window.setTimeout(() => {
      if (!fired) showAll();
    }, 3000);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
  return null;
}
