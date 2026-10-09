"use client";

import { BASE_PRICE, findCase, findDial, findStrap, formatPrice } from "@/lib/options";
import { useConfig } from "@/lib/store";

export default function ReserveButton() {
  const config = useConfig();
  const c = findCase(config.case);
  const d = findDial(config.dial);
  const s = findStrap(config.strap);
  const total = BASE_PRICE + c.price + d.price + s.price;
  const summary = `Meridian 39 · ${c.label} · ${d.label} · ${s.label}`;
  const href = `mailto:kyan775909@gmail.com?subject=${encodeURIComponent(`Aurum commission: ${summary}`)}&body=${encodeURIComponent(
    `Configuration: ${summary}\nPrice shown: ${formatPrice(total)}\n\n`,
  )}`;

  return (
    <div className="reserve-card panel">
      <p className="eyebrow">Your configuration</p>
      <p className="reserve-summary">{summary}</p>
      <p className="config-total">{formatPrice(total)}</p>
      <a className="btn btn-gold w-full sm:w-auto" href={href}>
        Request this configuration
      </a>
      <p className="text-small text-stone">Concept project — requests go to the designer of this site.</p>
    </div>
  );
}
