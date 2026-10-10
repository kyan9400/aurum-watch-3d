# Credits & licenses

## 3D, images and textures
Everything visual on this site was written in code for this project:
- The watch (case, bezel, lugs, crown, crystal, dial, hands, movement, rotor, straps, bracelet) is procedural three.js geometry
  (`LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, custom `BufferGeometry`, `InstancedMesh`).
- Dial faces, leather, alligator and silk straps and the rotor engraving are drawn at runtime on a `<canvas>`.
- Reflections come from code-made light panels (drei `<Environment>` + `<Lightformer>`); no HDRI is downloaded.
- The poster drawing, the family dials and the favicon are SVG / JSX written for this project. The Open Graph / Twitter
  image is a screenshot of this site.

No third-party models, textures, HDRIs, photos, icons or audio are used. No CC0 assets were needed.

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
