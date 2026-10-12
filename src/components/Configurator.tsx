"use client";

import { BASE_PRICE, CASES, DIALS, STRAPS, findCase, findDial, findStrap, formatPrice } from "@/lib/options";
import { nudgeYaw, setConfig, useConfig, type WatchConfig } from "@/lib/store";

type Group<K extends keyof WatchConfig> = {
  key: K;
  title: string;
  options: { id: WatchConfig[K]; label: string; price: number; swatch: string }[];
};

function Picker<K extends keyof WatchConfig>({ group, value }: { group: Group<K>; value: WatchConfig[K] }) {
  const selected = group.options.find((o) => o.id === value);
  return (
    <fieldset className="picker">
      <legend className="picker-legend">
        <span className="eyebrow">{group.title}</span>
        <span className="picker-current">{selected?.label}</span>
      </legend>
      <div className="picker-row">
        {group.options.map((o) => (
          <label key={o.id} className="swatch" title={o.label}>
            <input
              type="radio"
              className="sr-only"
              name={group.key}
              value={o.id}
              checked={o.id === value}
              onChange={() => setConfig({ [group.key]: o.id } as Partial<WatchConfig>)}
            />
            <span className="swatch-chip" style={{ background: o.swatch }} aria-hidden="true" />
            <span className="sr-only">
              {o.label}, {o.price ? `adds ${formatPrice(o.price)}` : "included"}
            </span>
          </label>
        ))}
      </div>
      <p className="picker-price" aria-hidden="true">
        {selected && selected.price ? `+ ${formatPrice(selected.price)}` : "Included"}
      </p>
    </fieldset>
  );
}

export default function Configurator() {
  const config = useConfig();
  const c = findCase(config.case);
  const d = findDial(config.dial);
  const s = findStrap(config.strap);
  const total = BASE_PRICE + c.price + d.price + s.price;

  return (
    <div className="panel config-panel">
      <Picker group={{ key: "case", title: "Case", options: CASES }} value={config.case} />
      <Picker group={{ key: "dial", title: "Dial", options: DIALS }} value={config.dial} />
      <Picker group={{ key: "strap", title: "Strap", options: STRAPS }} value={config.strap} />

      <div className="config-summary">
        <p className="text-small text-stone">Meridian 39 · {c.short} · {d.short} · {s.short}</p>
        <p className="config-total" aria-live="polite">
          <span className="sr-only">Total price </span>
          {formatPrice(total)}
        </p>
        <p className="text-small text-stone">Base price {formatPrice(BASE_PRICE)} · built to order in fourteen weeks</p>
      </div>

      <div className="config-actions">
        <div className="flex items-center gap-2" role="group" aria-label="Turn the watch">
          <button type="button" className="btn-icon" onClick={() => nudgeYaw(-0.5)} aria-label="Turn the watch left">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button type="button" className="btn-icon" onClick={() => nudgeYaw(0.5)} aria-label="Turn the watch right">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <span className="text-small text-stone hidden sm:inline">or drag the watch to turn it</span>
        </div>
        <a href="#reserve" className="btn btn-gold">
          <span className="btn-label">Reserve this one</span>
        </a>
      </div>
    </div>
  );
}
