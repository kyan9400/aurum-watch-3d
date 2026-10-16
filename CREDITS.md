# Credits & licenses

## 3D, images and textures
The configurator watch and everything else visual on this site was written in code for this project, except the two
CC0 assets listed under "Real assets" below:
- The watch (case, bezel, lugs, crown, crystal, dial, hands, movement, rotor, straps, keepers, bracelet) is procedural
  three.js geometry: lathe runs, superellipse lofts, faceted custom `BufferGeometry`, `ExtrudeGeometry`, `TubeGeometry`
  and `InstancedMesh`.
- Dial faces, the sunburst anisotropy map, perlage, the caseback engraving, the crown emblem, leather, alligator and silk
  straps, the rotor engraving, the light sweep and the soft shadow are drawn at runtime on a `<canvas>`.
- The configurator's reflections come from code-made light panels (drei `<Environment>` + `<Lightformer>`).
- The poster drawing, the family dials and the favicon are SVG / JSX written for this project. The Open Graph / Twitter
  image is a screenshot of this site.

## Real assets (CC0, served from this site's own domain)
| asset | file | source | licence |
|---|---|---|---|
| **Vintage Pocket Watch** by Tal Swicegood (Poly Haven) — shown in the atelier as "Meridian No. 1, 1911" | `public/models/pocket-watch-1911.glb` | https://polyhaven.com/a/vintage_pocket_watch | CC0 1.0 |
| **Studio Small 08** HDRI by Sergej Majboroda (Poly Haven), 1K | `public/hdri/studio_small_08_1k.hdr` | https://polyhaven.com/a/studio_small_08 | CC0 1.0 |

The pocket watch is the 1K glTF, with the maker's name removed from the dial and the signature removed from the case
back (diffuse, normal and ARM maps), then compressed with gltf-transform (meshopt geometry, WebP textures at 1024 px).
`public/models/pocket-watch-1911.webp` is a still rendered from it on this site (shown until the 3D is ready, and when
WebGL is not available). No other third-party models, textures, HDRIs, photos, icons or audio are used.

## Fonts (self-hosted at build time via `next/font/google`)
| font | author | license |
|---|---|---|
| Cormorant Garamond | Christian Thalmann (Catharsis Fonts) | SIL Open Font License 1.1 |
| Manrope | Mikhail Sharanda | SIL Open Font License 1.1 |

## npm libraries
| package | license |
|---|---|
| next | MIT |
| react, react-dom | MIT |
| three | MIT |
| @react-three/fiber | MIT |
| @react-three/drei | MIT |
| tailwindcss, @tailwindcss/postcss | MIT |
| typescript | Apache-2.0 |
| eslint, eslint-config-next | MIT |

Each package keeps its own license; see `package.json` and `node_modules/<package>/LICENSE`.

## Brand
"Aurum", "Meridian" and "Calibre AU-28" are fictional. Concept project — fictional brand.
