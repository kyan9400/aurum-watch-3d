import type { CSSProperties } from "react";
import Stage from "@/components/Stage";
import Configurator from "@/components/Configurator";
import ExplodedLegend from "@/components/ExplodedLegend";
import ReserveButton from "@/components/ReserveButton";
import MiniDial from "@/components/MiniDial";
import MobileMenu from "@/components/MobileMenu";
import { MotionNotice, MotionToggle } from "@/components/MotionToggle";
import HeritagePiece from "@/components/HeritagePiece";
import Reveal from "@/components/Reveal";
import ScrollChrome from "@/components/ScrollChrome";
import Pointer from "@/components/Pointer";
import { SITE_URL } from "@/lib/site";

const NAV = [
  { href: "#configure", label: "Configure" },
  { href: "#movement", label: "Movement" },
  { href: "#calibre", label: "Calibre" },
  { href: "#family", label: "Family" },
];

const RAIL = [
  ["39 mm", "Case"],
  ["72 h", "Reserve"],
  ["31", "Jewels"],
];

const SPECS = [
  ["Power reserve", "72 hours"],
  ["Frequency", "4 Hz · 28,800 vph"],
  ["Jewels", "31"],
  ["Components", "214"],
  ["Diameter", "30.4 mm"],
  ["Height", "4.9 mm"],
  ["Accuracy", "−2 / +4 s per day"],
  ["Finishing", "Côtes de Genève, perlage, anglage"],
];

const FAMILY = [
  {
    id: "classique",
    name: "Meridian 39 Classique",
    text: "Ivory enamel, yellow gold, cognac leather. The original 1911 proportions.",
    price: "From €16,500",
    dial: "#FFF9EE",
    dialEdge: "#E4DAC4",
    ink: "#1C1A17",
    metal: "#E3B866",
    strap: "#8A4B26",
  },
  {
    id: "nocturne",
    name: "Meridian 39 Nocturne",
    text: "Midnight sunburst, black ceramic, alligator. Made for the hour after dinner.",
    price: "From €11,700",
    dial: "#2C4479",
    dialEdge: "#101a33",
    ink: "#E9E3D6",
    metal: "#D2AE6D",
    strap: "#1f1b17",
  },
  {
    id: "solstice",
    name: "Meridian 36 Solstice",
    text: "Salmon opaline, rose gold, bracelet. Smaller, brighter, warmer.",
    price: "From €17,700",
    dial: "#F3C3AC",
    dialEdge: "#D9947A",
    ink: "#2A1A14",
    metal: "#E7A58A",
    strap: "#c79a86",
  },
];

const NUMBERS = [
  ["1911", "the year the first Meridian left the bench"],
  ["340", "watches a year, never more"],
  ["214", "parts in every movement"],
  ["14", "weeks from order to wrist"],
];

const NOTES = [
  {
    quote: "I wound it on the train home and forgot about it for three days. It was still right.",
    who: "Owner of a Classique, Lyon",
  },
  {
    quote: "My watchmaker's name is on the caseback. Twelve years later, the same hands opened it for service.",
    who: "Owner of a Nocturne, Edinburgh",
  },
  {
    quote: "It's the only object I own that gets quieter the longer you look at it.",
    who: "Owner of a Solstice, Kyoto",
  },
];

const FACTS = [
  ["Lifetime", "service record"],
  ["Same watchmaker", "for every service"],
  ["340 a year", "and never more"],
];

const STEPS = [
  ["Send us your configuration.", "Use the button below. We reply within two working days with a build slot."],
  ["Meet your watchmaker.", "In the atelier or by video. You can ask for an engraving inside the caseback."],
  ["Collect your Meridian.", "Fourteen weeks later, with a lifetime service record in your watchmaker's hand."],
];

/* Structured data: the site and the concept work behind it (no Product/Offer: the watch is fictional). */
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Aurum", url: `${SITE_URL}/` },
    {
      "@type": "CreativeWork",
      name: "Aurum — Meridian 39 watch configurator",
      url: `${SITE_URL}/`,
      description: "Concept project — fictional brand. A watch configurator in real-time 3D, built entirely in code.",
      author: { "@type": "Person", name: "Alhassan Alfarran", url: "https://github.com/kyan9400" },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
  ],
}).replace(/</g, "\\u003c");

/** A section heading split into masked lines for the scroll reveal (never used on the H1). */
function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={l} className="line">
          <span style={stagger(i)}>{i < lines.length - 1 ? `${l} ` : l}</span>
        </span>
      ))}
    </>
  );
}

function stagger(i: number) {
  return { "--i": i } as CSSProperties;
}

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap flex h-full items-center justify-between gap-4">
          <a href="#top" className="brand" aria-label="Aurum, back to top">
            <span aria-hidden="true" className="brand-mark" />
            Aurum
          </a>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a className="nav-link" href={n.href}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <MotionToggle className="hidden sm:inline-flex md:hidden lg:inline-flex" />
            <a href="#reserve" className="btn btn-outline header-cta">
              Reserve
            </a>
            <MobileMenu links={NAV} cta={{ href: "#reserve", label: "Reserve your Meridian" }} />
          </div>
        </div>
      </header>
      <ScrollChrome />

      <main id="main" tabIndex={-1}>
        <Stage>
          {/* 1 — hero: static and server-rendered, the H1 is the LCP and never animates */}
          <section id="top" className="stage-section hero" aria-labelledby="hero-title">
            <div className="wrap">
              <div className="hero-copy interactive">
                <p className="eyebrow">Aurum Horlogerie · Est. 1911</p>
                <h1 id="hero-title" className="display">
                  <span className="hl">Time,</span>{" "}
                  <span className="hl hl-indent">
                    <em>turned</em>
                  </span>{" "}
                  <span className="hl">by&nbsp;hand.</span>
                </h1>
                <p className="lede">
                  The Meridian is assembled by one watchmaker from first screw to final regulation. Choose its metal, dial and
                  strap, then take it apart to see why it keeps time for seventy-two hours on a single wind.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#configure" className="btn btn-gold">
                    <span className="btn-label">Configure your Meridian</span>
                  </a>
                  <a href="#movement" className="btn btn-ghost">
                    <span className="btn-label">See the movement</span>
                  </a>
                </div>
                <dl className="hero-rail">
                  {RAIL.map(([v, k]) => (
                    <div key={k}>
                      <dt className="eyebrow">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="hero-bar wrap">
              <p className="hero-note">The hands show your local time.</p>
              <span className="scroll-cue" aria-hidden="true">
                <span className="scroll-cue-line">
                  <span />
                </span>
                Scroll
              </span>
            </div>
          </section>

          {/* 2 — configurator */}
          <section id="configure" className="stage-section configure" aria-labelledby="configure-title">
            <div className="wrap configure-grid">
              <div className="configure-copy interactive">
                <p className="eyebrow">01 — Configure</p>
                <h2 id="configure-title" className="h2" data-reveal>
                  <Lines lines={["Make it", "yours."]} />
                </h2>
                <p className="lede">
                  Three choices, made slowly. Every combination is built to order in our valley workshop and delivered in
                  fourteen weeks.
                </p>
                <Configurator />
              </div>
            </div>
          </section>

          {/* 3 — exploded view */}
          <section id="movement" className="stage-section movement" aria-labelledby="movement-title">
            <div className="movement-pin">
              <div className="wrap">
                <div className="movement-copy interactive">
                  <p className="eyebrow">02 — The movement</p>
                  <h2 id="movement-title" className="h2" data-reveal>
                    <Lines lines={["Six layers,", "one heartbeat."]} />
                  </h2>
                  <p className="lede movement-lede">
                    Scroll to open the case. Every part you see is finished by hand, including the ones no one will ever see.
                  </p>
                  <ExplodedLegend />
                </div>
              </div>
            </div>
          </section>
        </Stage>

        {/* 4 — calibre */}
        <section id="calibre" className="section" aria-labelledby="calibre-title">
          <div className="wrap split-grid">
            <div className="split-head">
              <p className="eyebrow">03 — Calibre AU-28</p>
              <h2 id="calibre-title" className="h2" data-reveal>
                <Lines lines={["Seventy-two hours", "on one wind."]} />
              </h2>
            </div>
            <div className="split-body">
              <p className="lede" data-reveal="fade">
                Designed in-house over four years, the AU-28 uses twin barrels in series, so the force reaching the escapement
                stays even from full wind to the last hour. The gold rotor winds in both directions.
              </p>
              <dl className="spec-sheet">
                {SPECS.map(([k, v], i) => (
                  <div key={k} className="spec-row" data-reveal="fade" style={stagger(i)}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 5 — family */}
        <section id="family" className="section section-alt" aria-labelledby="family-title">
          <div className="wrap">
            <p className="eyebrow">04 — The Meridian family</p>
            <h2 id="family-title" className="h2" data-reveal>
              <Lines lines={["One case,", "three temperaments."]} />
            </h2>
            <ul className="family-grid">
              {FAMILY.map((f, i) => (
                <li key={f.id} className="family-card" data-reveal="fade" style={stagger(i)}>
                  <MiniDial id={f.id} dial={f.dial} dialEdge={f.dialEdge} ink={f.ink} metal={f.metal} strap={f.strap} label={`Drawing of the ${f.name}`} />
                  <h3 className="h3">{f.name}</h3>
                  <p className="text-stone">{f.text}</p>
                  <p className="family-price">{f.price}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6 — atelier */}
        <section id="atelier" className="section" aria-labelledby="atelier-title">
          <div className="wrap split-grid">
            <div className="split-head">
              <p className="eyebrow">05 — The atelier</p>
              <h2 id="atelier-title" className="h2" data-reveal>
                <Lines lines={["Eleven watchmakers.", "One name on each watch."]} />
              </h2>
              <HeritagePiece />
            </div>
            <div className="split-body">
              <p className="lede" data-reveal="fade">
                Our workshop sits at 1,010 metres, above the lake, where the winters are long and the work is quiet. Each
                Meridian is signed inside the caseback by the watchmaker who built it, and returns to the same hands for
                service.
              </p>
              <dl className="numbers">
                {NUMBERS.map(([n, label], i) => (
                  <div key={n} className="number" data-reveal="fade" style={stagger(i)}>
                    <dt className="sr-only">{label}</dt>
                    <dd>
                      <span className="number-value">{n}</span>
                      <span className="number-label" aria-hidden="true">
                        {label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 7 — ledger: owners' notes (fictional, like the brand) */}
        <section id="ledger" className="section section-alt" aria-labelledby="ledger-title">
          <div className="wrap">
            <p className="eyebrow">06 — The ledger</p>
            <h2 id="ledger-title" className="h2" data-reveal>
              <Lines lines={["Kept,", "not collected."]} />
            </h2>
            <div className="ledger-grid">
              {NOTES.map((n, i) => (
                <figure key={n.who} className={i === 0 ? "quote quote-lg" : "quote"} data-reveal="fade" style={stagger(i)}>
                  <blockquote>
                    <p>{n.quote}</p>
                  </blockquote>
                  <figcaption>{n.who}</figcaption>
                </figure>
              ))}
            </div>
            <ul className="ledger-facts">
              {FACTS.map(([a, b], i) => (
                <li key={a} data-reveal="fade" style={stagger(i)}>
                  <span className="ledger-fact">{a}</span>
                  <span className="text-stone">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8 — reserve */}
        <section id="reserve" className="section" aria-labelledby="reserve-title">
          <div className="wrap reserve-grid">
            <div>
              <p className="eyebrow">07 — Reserve</p>
              <h2 id="reserve-title" className="h2" data-reveal>
                <Lines lines={["Begin a", "commission."]} />
              </h2>
              <ol className="steps">
                {STEPS.map(([title, text], i) => (
                  <li key={title} className="step" data-reveal="fade" style={stagger(i)}>
                    <span className="step-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="h3">{title}</h3>
                      <p className="text-stone">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <ReserveButton />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          {/* decorative sign-off wordmark (SVG, hidden from assistive tech) */}
          <svg className="footer-mark" viewBox="0 0 1000 236" aria-hidden="true" focusable="false">
            <text x="500" y="200" textAnchor="middle" textLength="988" lengthAdjust="spacingAndGlyphs">
              Aurum
            </text>
          </svg>
        </div>
        <div className="wrap footer-grid">
          <div>
            <p className="brand">
              <span aria-hidden="true" className="brand-mark" />
              Aurum Horlogerie
            </p>
            <p className="text-small text-stone mt-3">Concept project — fictional brand.</p>
          </div>
          <div>
            <p className="text-small text-stone">Design &amp; code: Alhassan Alfarran</p>
            <ul className="footer-links">
              <li>
                <a href={process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://alhassan-portfolio-sigma.vercel.app"} rel="noopener">
                  Portfolio
                </a>
              </li>
              <li>
                <a href="https://github.com/kyan9400" rel="noopener">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://t.me/hassan_9400" rel="noopener">
                  Telegram
                </a>
              </li>
              <li>
                <a href="mailto:kyan775909@gmail.com">Email</a>
              </li>
            </ul>
          </div>
          <div className="footer-end">
            <a href="#top" className="btn-text">
              Back to top
            </a>
            <MotionToggle />
            <p className="text-small text-stone">© 2026 Alhassan Alfarran</p>
          </div>
        </div>
      </footer>
      <MotionNotice />
      <Reveal />
      <Pointer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
    </>
  );
}
