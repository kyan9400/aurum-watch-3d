"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionToggle } from "@/components/MotionToggle";

type Link = { href: string; label: string };

/* Section links for small screens. The panel is solid (nothing blurred over the canvas) and only fades and
   slides; the global reduce-motion rule turns that into an instant change. */
export default function MobileMenu({ links, cta }: { links: Link[]; cta: Link }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    // unlock scrolling right away so a link's jump to its section is not blocked
    document.body.style.overflow = "";
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current || !buttonRef.current) return;
      // keep focus inside the button + panel while the menu is open
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button"));
      const first = buttonRef.current;
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // a click outside the menu (the page below it, or the header) closes it and leaves focus where it landed
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      close(false);
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      wide.removeEventListener("change", onWide);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="menu-button md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span aria-hidden="true" className="menu-icon" data-open={open || undefined} />
        {open ? "Close" : "Menu"}
      </button>
      <div
        ref={panelRef}
        id="mobile-menu"
        className="mobile-menu md:hidden"
        data-open={open || undefined}
        inert={!open}
      >
        <nav aria-label="Sections">
          <ul>
            {links.map((n) => (
              <li key={n.href}>
                <a className="mobile-menu-link" href={n.href} onClick={() => close()}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={cta.href} className="btn btn-gold w-full" onClick={() => close()}>
          {cta.label}
        </a>
        <MotionToggle className="mt-2" />
      </div>
    </>
  );
}
