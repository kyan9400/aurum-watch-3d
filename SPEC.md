# Aurum — watch configurator · SPEC

## 1. Concept
**Aurum** is a fictional independent watchmaker working from a mountain valley workshop, making one model family, the
**Meridian**, in small numbers. The site is its product configurator: a procedural watch built entirely in code sits at the
centre of the page. In the hero its hands show the visitor's real local time and the seconds hand ticks. Further down
the visitor picks the case metal, dial and strap and the watch changes live. Then, as they scroll, the watch comes apart
layer by layer (crystal, hands, dial, case, movement, caseback) in an exploded view.

Tone: quiet, precise, warm. Think a horology catalogue printed on heavy paper, not a tech launch. Lots of space, small
type set with care, champagne gold used rarely.

## 2. Audience
- Watch buyers in their 30s–50s who read about movements before they buy and want to see the object from every side.
- Studio clients looking at the portfolio: they should remember "the watch that came apart as I scrolled".

## 3. Sections (in order)
1. **Hero**: name, promise, live ticking watch, two calls to action (configure / see the movement).
2. **Configurator** (`#configure`): case / dial / strap pickers (radio groups), live price and summary, drag to turn the watch.
3. **Exploded view** (`#movement`): scroll-linked separation of six layers with a numbered parts legend that follows the scroll.
4. **Calibre AU-28** (`#calibre`): movement specs as a spec sheet.
5. **The Meridian family** (`#family`): three references with SVG dials drawn in code.
6. **Atelier** (`#atelier`): the workshop story and four numbers.
7. **Ledger** (`#ledger`): three owners' notes (fictional, like the brand) and three atelier facts.
8. **Reserve** (`#reserve`): the commissioning process in three steps and a request button (mailto with the chosen configuration).
9. **Footer**: outlined "Aurum" wordmark, back to top, motion toggle, contact, "Concept project — fictional brand.", "© 2026 Alhassan Alfarran".

Page chrome: a 2 px gold scroll-progress bar under the header, section dots on desktop ≥ 1100 px (Hero, Configure,
Movement, Calibre, Family, Ledger, Reserve), and a header that hides on scroll down past 120 px and returns on scroll up.
It always stays visible with reduced motion, while focus is inside it, or while the menu is open.

## 4. Signature 3D moment
A procedural wristwatch, 100% code-made, on one sticky `<Canvas frameloop="demand">` that spans sections 1–3.

**Geometry (all procedural)**
- Case middle, bezel, caseback, box-dome crystal and crown body: *lathe runs* (`latheRuns`). Each run is a centripetal
  Catmull-Rom profile lathed on its own and merged with a material group. The result has smooth normals within a run,
  hard edges between runs, and u around the circumference (for anisotropic brushing). A 0.004 seam separates the bezel
  from the case, and another separates the caseback from the case. A dark machined spacer ring sits inside the case.
- Lugs: `loftSuperellipse` (n = 4) along a Catmull-Rom path. The root sinks 0.04 into the flank and the tip has a fan
  cap. Groups give brushed flats and polished top bevels.
- Crown: lathed stem, shoulder and domed cap, with a fluted band `r = r0 + 0.006·smoothstep(cos 36θ)` that has analytic
  smooth normals, plus an embossed "A" disc (bump map).
- Dial: disc with a `CanvasTexture` drawn at runtime (sunburst/enamel/grained finish, minute track, brand name in the
  site's display font, date window with today's date). Applied hour indices: `InstancedMesh` (12, double at noon).
- Hands: diamond-cut dauphine hour and minute hands (two sloped facets per side meeting at a spine 0.009 high, with
  0.008 walls) and lume strips that follow the spine. The seconds hand has a slim blade with a smooth round counterweight.
- Indices: faceted baton indices with a two-facet roof and a lume inset, plus four applied half-hour dots on high.
- Movement: a perlage main plate, a gear train (toothed `Shape`s), and bridges with brushed caps and polished anglage
  sides. Also: a balance wheel with a blued hairspring, blued slotted screws, gold chatons, jewels 0.004 proud, a
  ratchet wheel and the rotor.
- Caseback: an engraved band 0.002 proud. One canvas holds height in red and roughness in green.
- Strap: a padded superellipse loft (n = 6, domed top). Group 0 is the grain face and group 1 is a tan lining. Two
  keepers sit on the lower strap. Steel bracelet: `InstancedMesh` links placed along the same curve (polished centre
  links, brushed outer links).
- Lighting: drei `<Environment>` with `<Lightformer>` children only (no HDRI download), rendered once, including two
  long strip lights. ACES tone mapping at exposure 1.05, ambient 0.12. A camera-facing gradient quad acts as the
  backdrop shadow.
- Materials: polished and brushed case metals. On high both are `MeshPhysicalMaterial`, the brushed one with
  anisotropy 0.75. The sunburst dial uses an anisotropy map with tangential direction. The crystal has iridescence 0.35.

**Look (visual redesign)**
- Open heart: the dial has a 0.225 aperture at 6 o'clock (canvas cut-out + `alphaTest`, polished bezel ring, dark
  sleeve). The 6 o'clock index is dropped and the dial text moved to the upper half. The balance (moved to 0, -0.37,
  r 0.2, cock bridge redrawn) swings in it in the hero too (full motion, medium/high), so the movement is alive from the
  first frame.
- Atmosphere, all in the scene behind the watch: a warm additive halo, a giant engraved chapter ring (Roman hours,
  240-step minute track, rose-engine guilloché band; one canvas texture) tilted like an orbit, and a slanted light shaft
  from the upper right with drifting dust (160 points on high, 80 on medium, none on low). Each chapter has its own
  light: hero warm amber with the shaft, configurator softer champagne with a flat, quieter ring, movement a cool steel
  halo with a larger ring that turns with the scroll. With reduced motion everything is static and cuts between states.
- Lighting: darker ambient, a warm rim light from behind-left, plus a tall amber softbox and a cool steel kicker in the
  Lightformer studio, so polished gold reads warm on one flank and cool on the other. Calf leather is toned down (×0.55)
  so it reads cognac rather than orange under the warm key.

**Choreography**
- Hero: watch three-quarter front, hands = real local time, seconds hand ticks once a second with a small spring settle.
- Configurator: watch turns to face the picker, larger; horizontal drag turns it (`touch-action: pan-y`).
  Metal/dial colours cross-fade over ~0.5 s on change.
- Exploded (`explodeTimeline`), across the pinned movement section:
  - 0–0.62: the layers open one after another (crystal first, each in its own window, 4% overshoot), along a gold axis
    with ticks. The part in focus lifts a little and grows 3%.
  - 0.62–0.82: the stack turns to show the sapphire caseback, the engraving and the rotor, which makes half a turn.
  - 0.82–1: the layers seat back in reverse order, ending at a three-quarter back view.
  - The straps slide away and return. The legend uses the same windows (`activeLayer`).
- Intro: the environment ramps from 0.15 to 1 over 1.4 s as the poster fades. A light sweep crosses the crystal on intro,
  on dial or case changes and on entering the configurator. On high, glow sprites pulse with the sweep.

**Performance**
- Render on demand: frames only for ticks (≈12 frames per second-tick), colour fades, scroll changes, drag, and the
  slow idle sway (full motion only, stage in view, tab visible). Idle otherwise.
- The lazy 3D chunk is imported only after window `load` + `requestIdleCallback` (2.5 s timeout), never during
  hydration, and not at all on a software renderer (SwiftShader / llvmpipe / Basic Render, or a
  `failIfMajorPerformanceCaveat` refusal): those keep the poster. `?quality=` forces the 3D on.
- Quality tier picked before the Canvas from a probe context (GPU name, cores, memory, touch). `?quality=` overrides.
  - **High**: DPR cap 2, MSAA, env 256, radial 192, loft 24/48, physical + anisotropic metals, iridescent crystal,
    10 screws, chatons, half-hour dots, perlage 1024, light sweep, glow sprites (≈82k triangles).
  - **Medium**: DPR cap 1.5, MSAA, env 128, radial 128, loft 16/32, standard metals with a roughness split, 6 screws,
    chatons, perlage 512, light sweep (≈49k triangles).
  - **Low**: DPR cap 1, no MSAA, env 64, radial 72, loft 12/20, one metal, flat plate, no sweep, no sway (≈24k triangles).
  - All tiers: backdrop shadow quad.
- drei `<PerformanceMonitor>` drops DPR on decline. No allocations in `useFrame`. The watch is built in slices that
  yield to the main thread; shaders warmed with `gl.compileAsync` behind the poster, canvas fades in (opacity) after.
- IntersectionObserver pauses everything when the stage is off-screen; `visibilitychange` pauses the tick timer.

**Reduced motion** (default when the OS asks; "Turn on full motion" toggle in the header strip and footer, stored in
localStorage, `?motion=full|reduced`): no idle sway, no camera sweeps between sections (poses cut), seconds hand jumps
without the spring. The exploded view still follows the scroll directly, with no overshoot, lift, rotor spin, light
ramp or sweep. There are no heading reveals, no cursor ring and no magnetic buttons.

**No WebGL / context lost**: a code-made SVG poster of the watch (same palette) is in the server HTML, shown until the
3D is ready and kept if WebGL is missing, the renderer is software-only, or the context is lost. The configurator still works (the poster recolours).

## 5. Design system
**Palette**
| token | hex | use |
|---|---|---|
| `--color-ink` | `#0F0E0C` | page background (warm black) |
| `--color-umber` | `#1A1814` | panels |
| `--color-umber-2` | `#24211B` | raised panels, borders |
| `--color-line` | `#3A352C` | hairlines |
| `--color-ivory` | `#F3EEE4` | main text (16.9:1 on ink) |
| `--color-stone` | `#B5AC9C` | secondary text (8.9:1 on ink) |
| `--color-gold` | `#D2AE6D` | accent, focus ring (9.6:1 on ink) |
| `--color-gold-deep` | `#8F6D33` | gold borders |
| `--color-oxblood` | `#6E2A2A` | rare accent (date, jewels) |

**Fonts** (Google Fonts, OFL, via `next/font`): **Cormorant Garamond** 500/600 italic for display, **Manrope** 400/500/600
for body and UI. Figures in specs use Manrope tabular numbers.

**Type scale** (fluid): display `clamp(3rem, 8.6vw, 8.75rem)` / 0.9, three static lines (middle line indented 0.6em on
≥ 900 px); h2 `clamp(2.25rem, 5.2vw, 4.75rem)` / 0.98; h3 1.375rem; body 1rem/1.65; small 0.8125rem; eyebrows are
uppercase with 0.16em tracking and a 24 px gold-deep hairline before the text.

**Layout**: Calibre and Atelier use a 12-column grid at ≥ 1100 px, with the heading in columns 1–6 and the body in
columns 8–12 (asymmetric on purpose). Section padding is `clamp(64px, 12vw, 176px)`.

**Motion (2D)**: transform and opacity only. Section headings reveal per line (masked, 70 ms stagger), and ledes, rows and
cards fade up 16 px. The H1 never animates. Spec rows draw a gold hairline on hover. Family cards lift 6 px, the mini
dial turns 6°, and a top hairline grows.

**Spacing scale** (4 px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Section padding 96–160 px desktop, 64–96 mobile.
Gutter 16 px mobile, 32 px tablet, 64 px desktop. Max text measure 34rem.

**Shapes**: hairline 1 px borders, 2 px radius, circular swatches. No glass blur.

## 6. Final copy
**Nav**: Aurum · Configure · Movement · Calibre · Family · Reserve

**Hero**
- Eyebrow: Aurum Horlogerie · Est. 1911
- H1: Time, turned by hand.
- Lede: The Meridian is assembled by one watchmaker from first screw to final regulation. Choose its metal, dial and
  strap, then take it apart to see why it keeps time for seventy-two hours on a single wind.
- CTAs: Configure your Meridian · See the movement
- Note under watch: The hands show your local time.

**Configurator**
- Eyebrow: 01 — Configure
- H2: Make it yours.
- Lede: Three choices, made slowly. Every combination is built to order in our valley workshop and delivered in fourteen weeks.
- Case: 18k Yellow Gold (+€6,200) · 18k Rose Gold (+€6,600) · 904L Steel (base) · Black Ceramic (+€2,400)
- Dial: Ivory Grand Feu enamel (+€1,900) · Midnight sunburst · Forest grained (+€400) · Salmon opaline (+€600)
- Strap: Cognac calf leather · Black alligator (+€900) · Meridian bracelet (+€2,100) · Navy woven silk (+€150)
- Base price: €8,400. Summary line "Meridian 39 · {case} · {dial} · {strap}". Hint: Drag the watch to turn it.

**Exploded view**
- Eyebrow: 02 — The movement
- H2: Six layers, one heartbeat.
- Lede: Scroll to open the case. Every part you see is finished by hand, including the ones no one will ever see.
- Legend: 1 Sapphire crystal — domed, anti-reflective on both faces. 2 Hands — dauphine, diamond-cut and polished.
  3 Dial — fired, printed and applied by hand. 4 Case — 39 mm, 10.4 mm thick, water-resistant to 50 m.
  5 Calibre AU-28 — 31 jewels, 28,800 vibrations an hour. 6 Caseback — sapphire, so the rotor stays in view.

**Calibre**
- Eyebrow: 03 — Calibre AU-28
- H2: Seventy-two hours on one wind.
- Body: Designed in-house over four years, the AU-28 uses twin barrels in series so the force reaching the escapement
  stays even from full wind to the last hour. The gold rotor winds in both directions.
- Specs: Power reserve 72 h · Frequency 4 Hz (28,800 vph) · Jewels 31 · Components 214 · Diameter 30.4 mm ·
  Height 4.9 mm · Accuracy −2/+4 s per day · Finishing Côtes de Genève, perlage, anglage.

**Family**
- Eyebrow: 04 — The Meridian family
- H2: One case, three temperaments.
- Meridian 39 Classique — Ivory enamel, yellow gold, cognac leather. The original 1911 proportions. From €16,500.
- Meridian 39 Nocturne — Midnight sunburst, black ceramic, alligator. Made for the hour after dinner. From €11,700.
- Meridian 36 Solstice — Salmon opaline, rose gold, bracelet. Smaller, brighter, warmer. From €17,700.

**Atelier**
- Eyebrow: 05 — The atelier
- H2: Eleven watchmakers. One name on each watch.
- Body: Our workshop sits at 1,010 metres, above the lake, where the winters are long and the work is quiet. Each
  Meridian is signed inside the caseback by the watchmaker who built it, and returns to the same hands for service.
- Numbers: 1911 founded · 340 watches a year · 214 parts per movement · 14 weeks from order to wrist.

**Ledger**
- Eyebrow: 06 — The ledger
- H2: Kept, not collected.
- Notes: "I wound it on the train home and forgot about it for three days. It was still right." — Owner of a Classique,
  Lyon · "My watchmaker's name is on the caseback. Twelve years later, the same hands opened it for service." — Owner of
  a Nocturne, Edinburgh · "It's the only object I own that gets quieter the longer you look at it." — Owner of a
  Solstice, Kyoto.
- Facts: Lifetime service record · Same watchmaker for every service · 340 a year, and never more.

**Reserve**
- Eyebrow: 07 — Reserve
- H2: Begin a commission.
- Steps: 1 Send us your configuration. 2 Meet your watchmaker, in the atelier or by video. 3 Collect your Meridian in
  fourteen weeks, with a lifetime service record.
- Button: Request this configuration (mailto with the configuration in the subject). Small note: "Concept project —
  requests go to the designer of this site."

**Footer**: Aurum Horlogerie · Concept project — fictional brand. · Design & code: Alhassan Alfarran (portfolio,
GitHub, Telegram, email) · © 2026 Alhassan Alfarran · motion toggle.

**404**: "This hour does not exist." / "The page you wanted has stopped. The rest of the watch is still running." / Back to Aurum.

## 7. Assets & licenses
| asset | source | license |
|---|---|---|
| All 3D geometry, textures (canvas), poster SVG, icon, OG image | written for this project | owner, all rights reserved |
| Cormorant Garamond | Google Fonts via next/font | SIL OFL 1.1 |
| Manrope | Google Fonts via next/font | SIL OFL 1.1 |
No external images, models, HDRIs or audio. No runtime CDN requests.

## 8. Performance budget
- Route first-load JS < 250 KB gzip (target < 160 KB) excluding the lazy 3D chunk; three + R3F + drei only in the lazy chunk.
- No GSAP/Lenis: native scroll, the only smoothing is a short damp inside the 3D scene (one layer).
- LCP = hero H1 text (server rendered, fonts `display: swap`); 3D never blocks it.
- 3D chunk ≤ 300 KB gzip; geometry ≤ 90k triangles on high, ≤ 50k on medium, ≤ 25k on low. Canvas textures ≤ 1024²,
  small ones (64–256 px) for the shadow, sweep and emblem.
- Exactly two font preloads (Cormorant normal + italic). One scroll listener for the whole page.
- Structured data: `WebSite` + `CreativeWork` JSON-LD (no Product/Offer). Headers: nosniff, strict-origin referrer,
  a restrictive Permissions-Policy.
- Idle GPU: 0 frames when nothing moves (reduced motion) / sway only while stage visible (full motion).
- Lighthouse mobile ≥ 85 perf, ≥ 95 a11y / best practices / SEO. No CLS from the canvas (fixed-size sticky stage).
