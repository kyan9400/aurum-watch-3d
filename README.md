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
- **Geometry in code:** lathe profiles for the case, bezel, domed crystal and caseback; extruded lugs, hands, gears,
  bridges and rotor; a toothed gear `Shape` generator; a balance wheel with an Archimedean hairspring; straps swept as a
  custom ribbon `BufferGeometry` along a wrist-shaped Bézier curve; bracelet links as `InstancedMesh`.
- **Canvas textures:** sunburst / enamel / grained / opaline dials with minute track, brand text and today's date;
  leather, alligator and silk straps; Geneva stripes on the rotor.
- **Lighting:** a studio built from `<Lightformer>` panels rendered once into an environment map (no HDRI download).
- **Choreography:** scroll moves the watch between three poses; the exploded view separates crystal, hands, dial, case,
  movement and caseback along the watch axis while the gear train and balance wheel run.

### Performance
- Render on demand: frames only for the once-a-second tick (with a short spring), colour fades, scroll, drag and the hero
  sway. Idle otherwise; paused off-screen (IntersectionObserver) and in hidden tabs.
- The 3D chunk (three, R3F, drei) is requested only after window `load` plus an idle callback, never during
  hydration. Before that, a throwaway WebGL probe (no three import) reads the GPU name; software renderers
  (SwiftShader, llvmpipe, Microsoft Basic Render, or a `failIfMajorPerformanceCaveat` refusal) skip the 3D entirely and
  keep the poster.
- Quality tier from the same probe, before the Canvas is created (GPU name, cores, memory, touch;
  `?quality=low|medium|high` overrides and forces the 3D on). Tiers change DPR cap (2 / 1.5 / 1), MSAA, environment resolution, physical
  materials and curve detail.
- Adaptive resolution measured only on consecutive frames, so render-on-demand gaps are not mistaken for a slow GPU
  (drei `PerformanceMonitor` would read those gaps as low fps).
- The watch is built in slices that yield to the main thread, then shaders are compiled with `gl.compileAsync` behind
  a code-drawn SVG poster; the canvas fades in (opacity only) when ready.
- No allocations in the frame loop; the watch is a plain three.js object graph updated by one function.
- No `backdrop-filter` anywhere; panels over the canvas are solid or gradient.

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
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed URL so Open Graph, canonical, robots and sitemap links are absolute and correct.

## Project layout
```
src/app/            layout, page, 404, social preview image, icon, robots, sitemap
src/components/     page UI (configurator, legend, poster, motion toggle, stage)
src/components/three/
  WatchCanvas.tsx   Canvas, environment, loop driver, adaptive DPR, warm-up
  watchModel.ts     the watch object graph + per-frame maths
  geometry.ts       every procedural part
  textures.ts       canvas-drawn dial, strap and rotor textures
src/lib/            options/prices, config store, motion preference, quality tiers, scroll phases
```

## Credits & licenses
All 3D, textures and images are made in code for this project (the social preview is a screenshot of the site). Fonts are Google Fonts under the SIL Open Font License.
Libraries are MIT / Apache-2.0. Full list in [CREDITS.md](CREDITS.md).

## Copyright
© 2026 Alhassan Alfarran. All rights reserved. See [LICENSE](LICENSE).
