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
7. **Reserve** (`#reserve`): the commissioning process in three steps and a request button (mailto with the chosen configuration).
8. **Footer**: motion toggle, contact, "Concept project — fictional brand.", "© 2026 Alhassan Alfarran".

## 4. Signature 3D moment
A procedural wristwatch, 100% code-made, on one sticky `<Canvas frameloop="demand">` that spans sections 1–3.

**Geometry (all procedural)**
- Case middle, bezel, caseback and domed crystal: `LatheGeometry` from hand-drawn 2D profiles.
- Lugs: `ExtrudeGeometry` from a curved lug shape with bevels. Crown: knurled `CylinderGeometry` + tube.
- Dial: disc with a `CanvasTexture` drawn at runtime (sunburst/enamel/grained finish, minute track, brand name in the
  site's display font, date window with today's date). Applied hour indices: `InstancedMesh` (12, double at noon).
- Hands: dauphine hour/minute hands and a lollipop seconds hand from `Shape` → `ExtrudeGeometry` with bevel.
- Movement: main plate, gear train (gear `Shape`s with teeth generated in code), balance wheel (torus + spokes), rotor
  (half-disc extrude), jewels (`InstancedMesh` of small spheres).
- Strap: custom `BufferGeometry` ribbon swept along a curve that wraps backward like a wrist (top/bottom/sides),
  leather/fabric look from a canvas texture (grain + stitching / stripes). Steel bracelet: `InstancedMesh` links placed
  along the same curve.
- Lighting: drei `<Environment>` with `<Lightformer>` children only (no HDRI download), rendered once.

**Choreography**
- Hero: watch three-quarter front, hands = real local time, seconds hand ticks once a second with a small spring settle.
- Configurator: watch turns to face the picker, larger; horizontal drag turns it (`touch-action: pan-y`).
  Metal/dial colours cross-fade over ~0.5 s on change.
- Exploded: scroll progress drives six layers apart along the watch axis while the watch turns to a side angle; straps
  slide away. The legend item for the layer in focus is highlighted.

**Performance**
- Render on demand: frames only for ticks (≈12 frames per second-tick), colour fades, scroll changes, drag, and the
  slow idle sway (full motion only, stage in view, tab visible). Idle otherwise.
- Quality tier picked before the Canvas from a probe context (GPU name, cores, memory, touch). `?quality=` overrides.
  - **High**: DPR cap 2, MSAA, physical crystal with clearcoat, env map 256, 32-segment gears, 40 bracelet links.
  - **Medium**: DPR cap 1.5, MSAA, standard crystal, env 128, 20-segment gears.
  - **Low**: DPR cap 1, no MSAA, env 64, simplified gears, no sway.
- drei `<PerformanceMonitor>` drops DPR on decline. No allocations in `useFrame`. Shaders warmed with
  `gl.compileAsync` behind the poster, canvas fades in after.
- IntersectionObserver pauses everything when the stage is off-screen; `visibilitychange` pauses the tick timer.

**Reduced motion** (default when the OS asks; "Turn on full motion" toggle in the header strip and footer, stored in
localStorage, `?motion=full|reduced`): no idle sway, no camera sweeps between sections (poses cut), seconds hand jumps
without the spring. The exploded view still follows the scroll directly.

**No WebGL / context lost**: a code-made SVG poster of the watch (same palette) is in the server HTML, shown until the
3D is ready and kept if WebGL is missing or the context is lost. The configurator still works (the poster recolours).

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

**Type scale** (fluid): display `clamp(2.75rem, 7vw, 6.5rem)`, h2 `clamp(2rem, 4.2vw, 3.75rem)`, h3 1.375rem,
body 1rem/1.65, small 0.8125rem with 0.14em tracking uppercase for eyebrows.

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

**Reserve**
- Eyebrow: 06 — Reserve
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
- 3D chunk ≤ 300 KB gzip; geometry < 60k triangles on high, < 30k on low. Two canvas textures ≤ 1024².
- Idle GPU: 0 frames when nothing moves (reduced motion) / sway only while stage visible (full motion).
- Lighthouse mobile ≥ 85 perf, ≥ 95 a11y / best practices / SEO. No CLS from the canvas (fixed-size sticky stage).
