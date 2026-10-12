# Aurum — Meridian 39 watch configurator

A product configurator for a fictional watchmaker, built around one real-time 3D watch made entirely in code.
The hero watch shows your local time and ticks. The configurator changes its case metal, dial and strap live. Scroll on
and the watch comes apart into six layers so you can see the movement.

**Live:** https://aurum-watch-3d.vercel.app

> Concept project — fictional brand.

## Tech stack
- Next.js 16 (App Router, TypeScript strict, `src/` dir), React 19
- three.js + @react-three/fiber + @react-three/drei (lazy chunk only, `next/dynamic` with `ssr: false`)
- Tailwind CSS 4 (`@import "tailwindcss"` + `@theme` tokens)
- Fonts: Cormorant Garamond + Manrope via `next/font/google`
- Exact versions are pinned in `package.json` (see the shared STACK rules)

GSAP and Lenis are not used: the scroll scenes read the section boxes directly, and the only smoothing is a short damp
inside the 3D scene (one smoothing layer). That keeps the route's JavaScript small.

## The signature 3D moment
A procedural wristwatch on one sticky `<Canvas frameloop="demand">` spanning the hero, configurator and exploded view.
- **Geometry in code:**
  - Case, bezel, box-dome crystal, caseback and crown are built from *lathe runs*: each run is a centripetal Catmull-Rom
    profile lathed on its own, then merged. Normals are smooth inside a run and hard where runs meet, so flanks stay
    smooth and edges stay crisp. Each run picks a material slot (polished or brushed).
  - Lugs and straps are *superellipse lofts* along a path: soft-square lugs (brushed flats, polished top bevels) whose
    roots sink into the case, a padded domed strap with an outer face and a separate lining, and two keepers.
  - Diamond-cut dauphine hands and two-facet baton indices are faceted on purpose, with lume strips that follow the roof.
  - The crown has a fluted grip with analytic smooth normals and an embossed emblem.
  - Movement: perlage plate, gear train from a toothed `Shape` generator, bridges with anglage on the bevels, balance
    wheel with a blued hairspring, blued screws, gold chatons, a ratchet wheel and the Geneva-striped rotor.
  - The caseback carries an engraved band (one canvas: height in red, roughness in green).
  - Every decal has real clearance plus `polygonOffset`; no coplanar surfaces.
- **Materials:** on the high tier the case metals are `MeshPhysicalMaterial` with anisotropic brushing; the sunburst
  dial has an anisotropy map, so its light streak turns with the watch; the crystal has a faint iridescent
  anti-reflective bloom.
- **Lighting:** a studio built from `<Lightformer>` panels and two thin strip lights, rendered once into an environment
  map (no HDRI download). ACES tone mapping, exposure 1.05. A camera-facing gradient quad gives a soft backdrop shadow.
- **Choreography:** scroll moves the watch between three poses. In the movement section the layers open one after another
  (with a small overshoot) along a gold technical-drawing axis. Then the stack turns to show the caseback and rotor,
  and finally it puts itself back together, caseback first. The legend uses the same timing windows.
- **Intro and accents:** the environment "switches on" as the poster fades out. A light sweep crosses the crystal on
  intro, on every dial or case change and on entering the configurator. Additive glow sprites pulse on the high tier.
  There is no post-processing.

### Performance
- Render on demand: frames only for the once-a-second tick (with a short spring), colour fades, scroll, drag and the hero
  sway. Idle otherwise; paused off-screen (IntersectionObserver) and in hidden tabs.
- The 3D chunk (three, R3F, drei) is requested only after window `load` plus an idle callback, never during
  hydration. Before that, a throwaway WebGL probe (no three import) reads the GPU name; software renderers
  (SwiftShader, llvmpipe, Microsoft Basic Render, or a `failIfMajorPerformanceCaveat` refusal) skip the 3D entirely and
  keep the poster.
- Quality tier from the same probe, before the Canvas is created (GPU name, cores, memory, touch;
  `?quality=low|medium|high` overrides and forces the 3D on). Tiers change DPR cap (2 / 1.5 / 1), MSAA, environment
  resolution, radial / loft detail, physical + anisotropic materials, iridescence, screws, perlage, light sweep and glow.
  Triangle budget: about 82k high, 49k medium, 24k low.
- Adaptive resolution measured only on consecutive frames, so render-on-demand gaps are not mistaken for a slow GPU
  (drei `PerformanceMonitor` would read those gaps as low fps).
- The watch is built in slices that yield to the main thread, then shaders are compiled with `gl.compileAsync` behind
  a code-drawn SVG poster; the canvas fades in (opacity only) when ready.
- No allocations in the frame loop; the watch is a plain three.js object graph updated by one function.
- No `backdrop-filter` anywhere; panels over the canvas are solid or gradient.
- One shared scroll reader (`lib/stage.ts`): a single passive listener, at most one layout read per frame, used by the
  stage, the legend, the 3D scene, the progress bar and the header.
- Only the two hero fonts (Cormorant normal + italic) are preloaded; Manrope loads with a size-matched fallback.

### Page design
- A three-line hero heading with a spec rail and a scroll cue. It is static and server-rendered, because it is the LCP.
- Section headings reveal line by line, and ledes, spec rows and cards fade up, all through one IntersectionObserver.
  The hidden start state only applies when JS runs and motion is full.
- An asymmetric 12-column grid for Calibre and Atelier, a ledger of owners' notes, and an outlined wordmark sign-off.
- Scroll chrome: a gold progress bar, section dots on desktop (with `aria-current`), and a header that hides on
  scroll down.
- Desktop pointer extras (fine pointer and full motion only): magnetic buttons and a companion cursor ring that shows
  "Drag" over the configurator. The native cursor stays visible.

### Motion & fallbacks
- `prefers-reduced-motion` is respected by default, with a "Turn on full motion" toggle (header, footer and a first-visit
  notice), remembered in localStorage; `?motion=full|reduced` overrides. Reduced motion cuts between poses, stops the
  sway and the movement animation, and lets the seconds hand jump. The exploded view still follows the scroll.
- Without WebGL, on a software renderer, or if the context is lost, the SVG poster stays and follows the configurator, so the page works fully.

## Run it
```bash
npm install
npm run dev      # local development
npm run build    # production build
npm run build:pages  # static GitHub Pages mirror in out/ (served under /aurum-watch-3d)
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed URL so Open Graph, canonical, robots and sitemap links are absolute and correct.

## Project layout
```
src/app/            layout, page, 404, social preview image, icon, robots, sitemap
src/components/     page UI (configurator, legend, poster, motion toggle, stage, reveal, scroll chrome, pointer)
src/components/three/
  WatchCanvas.tsx   Canvas, environment, loop driver, adaptive DPR, warm-up
  watchModel.ts     the watch object graph + per-frame maths
  geometry.ts       every procedural part
  textures.ts       canvas-drawn dial, strap and rotor textures
src/lib/            options/prices, config store, motion preference, quality tiers, shared scroll store + timeline windows
```

## Credits & licenses
All 3D, textures and images are made in code for this project (the social preview is a screenshot of the site). Fonts are Google Fonts under the SIL Open Font License.
Libraries are MIT / Apache-2.0. Full list in [CREDITS.md](CREDITS.md).

## Copyright
© 2026 Alhassan Alfarran. All rights reserved. See [LICENSE](LICENSE).
