import Stage from "@/components/Stage";
import Configurator from "@/components/Configurator";
import ExplodedLegend from "@/components/ExplodedLegend";
import ReserveButton from "@/components/ReserveButton";
import MiniDial from "@/components/MiniDial";
import { MotionNotice, MotionToggle } from "@/components/MotionToggle";

const NAV = [
  { href: "#configure", label: "Configure" },
  { href: "#movement", label: "Movement" },
  { href: "#calibre", label: "Calibre" },
  { href: "#family", label: "Family" },
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

const STEPS = [
  ["Send us your configuration.", "Use the button below. We reply within two working days with a build slot."],
  ["Meet your watchmaker.", "In the atelier or by video. You can ask for an engraving inside the caseback."],
  ["Collect your Meridian.", "Fourteen weeks later, with a lifetime service record in your watchmaker's hand."],
];

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
          <nav aria-label="Main">
            <ul className="hidden items-center gap-1 md:flex">
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
            <a href="#reserve" className="btn btn-outline">
              Reserve
            </a>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Stage>
          {/* 1 — hero */}
          <section id="top" className="stage-section hero" aria-labelledby="hero-title">
            <div className="wrap">
              <div className="hero-copy interactive">
                <p className="eyebrow">Aurum Horlogerie · Est. 1911</p>
                <h1 id="hero-title" className="display">
                  Time, <em>turned</em> by&nbsp;hand.
                </h1>
                <p className="lede">
                  The Meridian is assembled by one watchmaker from first screw to final regulation. Choose its metal, dial and
                  strap, then take it apart to see why it keeps time for seventy-two hours on a single wind.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#configure" className="btn btn-gold">
                    Configure your Meridian
                  </a>
                  <a href="#movement" className="btn btn-ghost">
                    See the movement
                  </a>
                </div>
              </div>
            </div>
            <p className="hero-note">The hands show your local time.</p>
          </section>

          {/* 2 — configurator */}
          <section id="configure" className="stage-section configure" aria-labelledby="configure-title">
            <div className="wrap configure-grid">
              <div className="configure-copy interactive">
                <p className="eyebrow">01 — Configure</p>
                <h2 id="configure-title" className="h2">Make it yours.</h2>
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
                  <h2 id="movement-title" className="h2">Six layers, one heartbeat.</h2>
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
          <div className="wrap calibre-grid">
            <div>
              <p className="eyebrow">03 — Calibre AU-28</p>
              <h2 id="calibre-title" className="h2">Seventy-two hours on one wind.</h2>
              <p className="lede">
                Designed in-house over four years, the AU-28 uses twin barrels in series, so the force reaching the escapement
                stays even from full wind to the last hour. The gold rotor winds in both directions.
              </p>
            </div>
            <dl className="spec-sheet">
              {SPECS.map(([k, v]) => (
                <div key={k} className="spec-row">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 5 — family */}
        <section id="family" className="section section-alt" aria-labelledby="family-title">
          <div className="wrap">
            <p className="eyebrow">04 — The Meridian family</p>
            <h2 id="family-title" className="h2">One case, three temperaments.</h2>
            <ul className="family-grid">
              {FAMILY.map((f) => (
                <li key={f.id} className="family-card">
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
          <div className="wrap atelier-grid">
            <div>
              <p className="eyebrow">05 — The atelier</p>
              <h2 id="atelier-title" className="h2">Eleven watchmakers. One name on each watch.</h2>
            </div>
            <div>
              <p className="lede">
                Our workshop sits at 1,010 metres, above the lake, where the winters are long and the work is quiet. Each
                Meridian is signed inside the caseback by the watchmaker who built it, and returns to the same hands for
                service.
              </p>
              <dl className="numbers">
                {NUMBERS.map(([n, label]) => (
                  <div key={n} className="number">
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

        {/* 7 — reserve */}
        <section id="reserve" className="section section-alt" aria-labelledby="reserve-title">
          <div className="wrap reserve-grid">
            <div>
              <p className="eyebrow">06 — Reserve</p>
              <h2 id="reserve-title" className="h2">Begin a commission.</h2>
              <ol className="steps">
                {STEPS.map(([title, text], i) => (
                  <li key={title} className="step">
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
                <a href="https://alhassan-portfolio-sigma.vercel.app" rel="noopener">
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
            <MotionToggle />
            <p className="text-small text-stone">© 2026 Alhassan Alfarran</p>
          </div>
        </div>
      </footer>
      <MotionNotice />
    </>
  );
}
