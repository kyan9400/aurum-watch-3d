/* Every part of the watch, generated in code.
   Units: 1 = 19.5 mm (the case is 39 mm across). The watch faces +Z, 12 o'clock is +Y. */

import {
  BufferGeometry,
  CircleGeometry,
  CubicBezierCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Path,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Curve,
  Vector2,
  Vector3,
  BoxGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Lathe around the watch axis (Z). Profile points are [radius, z]. */
function lathe(profile: [number, number][], segments: number) {
  const pts = profile.map(([r, z]) => new Vector2(r, z));
  const g = new LatheGeometry(pts, segments);
  g.rotateX(Math.PI / 2);
  return g;
}

export function caseMiddle(seg: number) {
  return lathe(
    [
      [0.9, -0.24],
      [0.96, -0.25],
      [1.0, -0.235],
      [1.03, -0.19],
      [1.05, -0.1],
      [1.058, 0],
      [1.052, 0.09],
      [1.03, 0.16],
      [0.995, 0.2],
      [0.95, 0.205],
      [0.9, 0.205],
      [0.9, -0.24],
    ],
    seg,
  );
}

export function bezel(seg: number) {
  return lathe(
    [
      [0.86, 0.2],
      [0.996, 0.2],
      [1.012, 0.225],
      [1.012, 0.25],
      [0.995, 0.285],
      [0.95, 0.312],
      [0.89, 0.322],
      [0.868, 0.318],
      [0.86, 0.3],
      [0.86, 0.2],
    ],
    seg,
  );
}

/** Sloped chapter ring between dial and bezel. */
export function rehaut(seg: number) {
  return lathe(
    [
      [0.8, 0.1],
      [0.868, 0.21],
    ],
    seg,
  );
}

export function dialDisc(seg: number) {
  return new CircleGeometry(0.805, seg);
}

export function crystalDome(seg: number) {
  const profile: [number, number][] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = 0.0001 + t * 0.875;
    const z = 0.372 - t * t * 0.05;
    profile.push([r, z]);
  }
  profile.push([0.875, 0.3]);
  return lathe(profile, seg);
}

export function casebackRing(seg: number) {
  return lathe(
    [
      [0.62, -0.25],
      [0.93, -0.25],
      [0.925, -0.285],
      [0.86, -0.325],
      [0.68, -0.342],
      [0.62, -0.336],
      [0.62, -0.25],
    ],
    seg,
  );
}

export function casebackGlass(seg: number) {
  const g = new CircleGeometry(0.625, seg);
  g.rotateY(Math.PI); // faces -Z
  g.translate(0, 0, -0.335);
  return g;
}

/* ---------- lugs & crown ---------- */

export function lugs(curveSegments: number) {
  const s = new Shape();
  // side profile: x = outward along Y, y = height along Z
  s.moveTo(0.72, -0.2);
  s.lineTo(0.72, 0.17);
  s.quadraticCurveTo(1.0, 0.19, 1.2, 0.02);
  s.quadraticCurveTo(1.25, -0.05, 1.21, -0.13);
  s.quadraticCurveTo(1.02, -0.17, 0.86, -0.22);
  s.closePath();
  const depth = 0.15;
  const base = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments,
  });
  // shape X -> world Y, shape Y -> world Z, extrude Z -> world X
  const basis = new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0));
  base.applyMatrix4(basis);
  base.translate(-depth / 2, 0, 0);

  const parts: BufferGeometry[] = [];
  for (const x of [-0.43, 0.43]) {
    for (const flip of [0, Math.PI]) {
      const g = base.clone();
      g.translate(x, 0, 0);
      if (flip) g.rotateZ(Math.PI);
      parts.push(g);
    }
  }
  base.dispose();
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

export function crown() {
  const tube = new CylinderGeometry(0.055, 0.055, 0.12, 20);
  tube.rotateZ(Math.PI / 2);
  tube.translate(1.08, 0, 0);
  // knurled grip: few segments + non-indexed normals = crisp flutes
  const grip = new CylinderGeometry(0.135, 0.135, 0.12, 28, 1).toNonIndexed();
  grip.computeVertexNormals();
  grip.rotateZ(Math.PI / 2);
  grip.translate(1.19, 0, 0);
  const cap = new CylinderGeometry(0.115, 0.13, 0.025, 28).toNonIndexed();
  cap.rotateZ(-Math.PI / 2);
  cap.translate(1.262, 0, 0);
  const tubeNI = tube.toNonIndexed();
  const merged = mergeGeometries([tubeNI, grip, cap]);
  [tube, tubeNI, grip, cap].forEach((g) => g.dispose());
  merged.computeVertexNormals();
  return merged;
}

/* ---------- applied hour indices ---------- */

export function indexBar() {
  return new BoxGeometry(0.036, 0.13, 0.022);
}

/** Matrices for the applied indices: 12 o'clock is doubled, 3 o'clock gives way to the date window. */
export function indexMatrices(): Matrix4[] {
  const out: Matrix4[] = [];
  const R = 0.645;
  for (let h = 0; h < 12; h++) {
    if (h === 3) continue;
    const a = (h / 12) * Math.PI * 2;
    const offsets = h === 0 ? [-0.028, 0.028] : [0];
    for (const off of offsets) {
      const m = new Matrix4().makeRotationZ(-a);
      const x = Math.sin(a) * R + Math.cos(a) * off;
      const y = Math.cos(a) * R - Math.sin(a) * off;
      m.setPosition(x, y, 0.112);
      out.push(m);
    }
  }
  return out;
}

/* ---------- hands ---------- */

function handExtrude(s: Shape, curveSegments: number) {
  return new ExtrudeGeometry(s, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.006,
    bevelSegments: 1,
    curveSegments,
  });
}

export function hourHand(curveSegments: number) {
  const s = new Shape();
  s.moveTo(-0.045, 0.02);
  s.lineTo(0, 0.47);
  s.lineTo(0.045, 0.02);
  s.lineTo(0.02, -0.09);
  s.lineTo(-0.02, -0.09);
  s.closePath();
  const hub = new Path();
  hub.absarc(0, 0, 0.012, 0, Math.PI * 2, true);
  s.holes.push(hub);
  return handExtrude(s, curveSegments);
}

export function minuteHand(curveSegments: number) {
  const s = new Shape();
  s.moveTo(-0.036, 0.03);
  s.lineTo(0, 0.7);
  s.lineTo(0.036, 0.03);
  s.lineTo(0.016, -0.11);
  s.lineTo(-0.016, -0.11);
  s.closePath();
  return handExtrude(s, curveSegments);
}

export function secondsHand(curveSegments: number) {
  const s = new Shape();
  s.moveTo(-0.006, -0.12);
  s.lineTo(-0.0035, 0.76);
  s.lineTo(0.0035, 0.76);
  s.lineTo(0.006, -0.12);
  s.closePath();
  const blade = new ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments });
  const tail = new Shape();
  tail.absarc(0, -0.17, 0.034, 0, Math.PI * 2, false);
  const tailG = new ExtrudeGeometry(tail, { depth: 0.006, bevelEnabled: false, curveSegments: curveSegments * 2 });
  const hub = new CylinderGeometry(0.028, 0.028, 0.03, 24);
  hub.rotateX(Math.PI / 2);
  const merged = mergeGeometries([blade, tailG, hub.toNonIndexed()].map((g) => (g.index ? g.toNonIndexed() : g)));
  [blade, tailG, hub].forEach((g) => g.dispose());
  merged.computeVertexNormals();
  return merged;
}

export function handCap() {
  const g = new CylinderGeometry(0.042, 0.046, 0.04, 28);
  g.rotateX(Math.PI / 2);
  return g;
}

/* ---------- movement ---------- */

export function gearShape(r: number, teeth: number, toothDepth: number, hole: number, spokes: number) {
  const s = new Shape();
  const step = (Math.PI * 2) / teeth;
  const rr = r - toothDepth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [rr, a],
      [r, a + step * 0.2],
      [r, a + step * 0.45],
      [rr, a + step * 0.65],
    ];
    pts.forEach(([rad, ang], k) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0 && k === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  const h = new Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(h);
  if (spokes > 0) {
    const inner = hole + r * 0.16;
    const outer = rr - r * 0.14;
    if (outer > inner + 0.01) {
      const span = (Math.PI * 2) / spokes;
      const gap = Math.min(span * 0.18, 0.12 / outer + 0.05);
      for (let k = 0; k < spokes; k++) {
        const a0 = k * span + gap;
        const a1 = (k + 1) * span - gap;
        const w = new Path();
        w.absarc(0, 0, outer, a0, a1, false);
        w.absarc(0, 0, inner, a1, a0, true);
        w.closePath();
        s.holes.push(w);
      }
    }
  }
  return s;
}

export type GearSpec = { x: number; y: number; r: number; teeth: number; spokes: number; speed: number; z: number };

/** The visible gear train on the dial side of the plate (artistic, not a real train). */
export const GEARS: GearSpec[] = [
  { x: 0, y: 0, r: 0.3, teeth: 60, spokes: 5, speed: 0.06, z: 0 },
  { x: 0.33, y: 0.3, r: 0.16, teeth: 36, spokes: 4, speed: -0.2, z: 0.012 },
  { x: -0.38, y: 0.2, r: 0.2, teeth: 44, spokes: 5, speed: -0.14, z: 0.006 },
  { x: -0.12, y: -0.46, r: 0.14, teeth: 30, spokes: 4, speed: 0.32, z: 0.012 },
  { x: 0.42, y: -0.1, r: 0.11, teeth: 24, spokes: 3, speed: 0.52, z: 0.018 },
];

export const BALANCE = { x: 0.3, y: -0.42, r: 0.17 };

export function gearGeometry(spec: GearSpec, curveSegments: number) {
  return new ExtrudeGeometry(gearShape(spec.r, spec.teeth, Math.min(0.03, spec.r * 0.12), 0.025, spec.spokes), {
    depth: 0.022,
    bevelEnabled: false,
    curveSegments: Math.max(2, Math.round(curveSegments / 2)),
  });
}

export function mainPlate(seg: number) {
  const s = new Shape();
  s.absarc(0, 0, 0.8, 0, Math.PI * 2, false);
  // jewel / screw holes
  for (const g of GEARS) {
    const h = new Path();
    h.absarc(g.x, g.y, 0.03, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: Math.round(seg / 4) });
  g.translate(0, 0, -0.07);
  return g;
}

export function bridgeGeometry(curveSegments: number) {
  // a sweeping train bridge across the upper half and a balance cock
  const train = new Shape();
  train.moveTo(-0.62, 0.18);
  train.quadraticCurveTo(-0.3, 0.55, 0.15, 0.48);
  train.quadraticCurveTo(0.5, 0.42, 0.6, 0.12);
  train.lineTo(0.5, 0.05);
  train.quadraticCurveTo(0.4, 0.3, 0.12, 0.34);
  train.quadraticCurveTo(-0.25, 0.4, -0.52, 0.08);
  train.closePath();
  const cock = new Shape();
  cock.moveTo(0.72, -0.2);
  cock.quadraticCurveTo(0.6, -0.36, 0.36, -0.36);
  cock.absarc(0.3, -0.42, 0.07, 0.5, Math.PI * 1.6, false);
  cock.quadraticCurveTo(0.55, -0.55, 0.74, -0.32);
  cock.closePath();
  const opts = { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments };
  const a = new ExtrudeGeometry(train, opts);
  const b = new ExtrudeGeometry(cock, opts);
  const merged = mergeGeometries([a, b]);
  a.dispose();
  b.dispose();
  return merged;
}

export function balanceWheel(curveSegments: number) {
  const rim = new TorusGeometry(BALANCE.r, 0.014, 8, 12 + curveSegments * 4);
  const parts: BufferGeometry[] = [rim];
  for (let i = 0; i < 3; i++) {
    const spoke = new BoxGeometry(0.012, BALANCE.r * 2, 0.012);
    spoke.rotateZ((i / 3) * Math.PI);
    parts.push(spoke);
  }
  // hairspring: an Archimedean spiral
  class Spiral extends Curve<Vector3> {
    constructor() {
      super();
    }
    getPoint(t: number, target = new Vector3()) {
      const turns = 7;
      const a = t * Math.PI * 2 * turns;
      const r = 0.025 + t * (BALANCE.r * 0.62);
      return target.set(Math.cos(a) * r, Math.sin(a) * r, 0.012);
    }
  }
  parts.push(new TubeGeometry(new Spiral(), 120 + curveSegments * 20, 0.0025, 3, false));
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

export function rotorGeometry(curveSegments: number) {
  const s = new Shape();
  s.absarc(0, 0, 0.74, 0, Math.PI, false);
  s.lineTo(-0.11, 0);
  s.absarc(0, 0, 0.11, Math.PI, 0, true);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 1, curveSegments: curveSegments * 3 });
  return g;
}

export function jewelPositions(): Vector3[] {
  const out = GEARS.map((g) => new Vector3(g.x, g.y, 0.04 + g.z));
  out.push(new Vector3(BALANCE.x, BALANCE.y, 0.07));
  out.push(new Vector3(-0.5, 0.5, 0.01), new Vector3(0.55, 0.5, 0.01), new Vector3(-0.6, -0.4, 0.01));
  return out;
}

/* ---------- straps ---------- */

/** The path a strap half takes: out of the lugs, then bending back around the wrist. sign = 1 top, -1 bottom. */
export function strapCurve(sign: 1 | -1) {
  return new CubicBezierCurve3(
    new Vector3(0, 1.08 * sign, -0.06),
    new Vector3(0, 1.75 * sign, -0.02),
    new Vector3(0, 2.2 * sign, -0.55),
    new Vector3(0, 2.25 * sign, -1.55),
  );
}

/** A flat ribbon with thickness swept along the curve (top, bottom, sides, end cap), flat-shaded per face. */
export function strapGeometry(curve: CubicBezierCurve3, sign: 1 | -1, samples: number, w0: number, w1: number, t0: number, t1: number, texLength: number) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const P = new Vector3();
  const T = new Vector3();
  const N = new Vector3();
  // mirrored for the lower half so the outer face always points away from the wrist
  const B = new Vector3(sign, 0, 0);
  const lengths = curve.getLengths(samples);
  const total = lengths[samples];

  type Ring = { p: Vector3; n: Vector3; w: number; t: number; s: number };
  const rings: Ring[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    N.crossVectors(B, T).normalize();
    // the end narrows to a rounded tongue over the last 10%
    const taper = u > 0.9 ? Math.cos(((u - 0.9) / 0.1) * Math.PI * 0.42) : 1;
    const w = (w0 + (w1 - w0) * u) * (0.55 + 0.45 * taper);
    const t = t0 + (t1 - t0) * u;
    rings.push({ p: P.clone(), n: N.clone(), w, t, s: (lengths[i] / total) * texLength });
  }

  // one strip per face: [sideA, sideB, normal sign]
  const faces: { a: (r: Ring) => Vector3; b: (r: Ring) => Vector3; normal: (r: Ring) => Vector3; u0: number; u1: number }[] = [
    // top (outer) face
    {
      a: (r) => r.p.clone().addScaledVector(B, -r.w / 2).addScaledVector(r.n, r.t / 2),
      b: (r) => r.p.clone().addScaledVector(B, r.w / 2).addScaledVector(r.n, r.t / 2),
      normal: (r) => r.n.clone(),
      u0: 0,
      u1: 1,
    },
    // bottom (inner) face
    {
      a: (r) => r.p.clone().addScaledVector(B, r.w / 2).addScaledVector(r.n, -r.t / 2),
      b: (r) => r.p.clone().addScaledVector(B, -r.w / 2).addScaledVector(r.n, -r.t / 2),
      normal: (r) => r.n.clone().negate(),
      u0: 1,
      u1: 0,
    },
    // right side
    {
      a: (r) => r.p.clone().addScaledVector(B, r.w / 2).addScaledVector(r.n, r.t / 2),
      b: (r) => r.p.clone().addScaledVector(B, r.w / 2).addScaledVector(r.n, -r.t / 2),
      normal: () => B.clone(),
      u0: 0.97,
      u1: 1,
    },
    // left side
    {
      a: (r) => r.p.clone().addScaledVector(B, -r.w / 2).addScaledVector(r.n, -r.t / 2),
      b: (r) => r.p.clone().addScaledVector(B, -r.w / 2).addScaledVector(r.n, r.t / 2),
      normal: () => B.clone().negate(),
      u0: 0,
      u1: 0.03,
    },
  ];

  for (const f of faces) {
    const start = pos.length / 3;
    for (const r of rings) {
      const a = f.a(r);
      const b = f.b(r);
      const n = f.normal(r);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
      uv.push(f.u0, r.s, f.u1, r.s);
    }
    for (let i = 0; i < samples; i++) {
      const k = start + i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  // end cap
  const last = rings[samples];
  const tan = curve.getTangentAt(1, new Vector3());
  const c0 = last.p.clone().addScaledVector(B, -last.w / 2).addScaledVector(last.n, last.t / 2);
  const c1 = last.p.clone().addScaledVector(B, last.w / 2).addScaledVector(last.n, last.t / 2);
  const c2 = last.p.clone().addScaledVector(B, last.w / 2).addScaledVector(last.n, -last.t / 2);
  const c3 = last.p.clone().addScaledVector(B, -last.w / 2).addScaledVector(last.n, -last.t / 2);
  const s0 = pos.length / 3;
  for (const c of [c0, c1, c2, c3]) {
    pos.push(c.x, c.y, c.z);
    nor.push(tan.x, tan.y, tan.z);
    uv.push(0.5, last.s);
  }
  idx.push(s0, s0 + 1, s0 + 2, s0, s0 + 2, s0 + 3);

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Bracelet link transforms along the same curve: one centre link + two outer links per row. */
export function braceletMatrices(curve: CubicBezierCurve3, sign: 1 | -1, pitch: number) {
  const total = curve.getLength();
  const rows = Math.floor(total / pitch);
  const centre: Matrix4[] = [];
  const outer: Matrix4[] = [];
  const P = new Vector3();
  const T = new Vector3();
  const N = new Vector3();
  const B = new Vector3(sign, 0, 0);
  for (let i = 0; i < rows; i++) {
    const u = (i * pitch + pitch * 0.5) / total;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    N.crossVectors(B, T).normalize();
    const taper = 1 - u * 0.16;
    const m = new Matrix4().makeBasis(B, T, N);
    const c = m.clone().scale(new Vector3(taper, 1, 1));
    c.setPosition(P.x, P.y, P.z);
    centre.push(c.clone().multiply(new Matrix4().makeTranslation(0, 0, 0.012)));
    for (const side of [-1, 1]) {
      const o = m.clone().scale(new Vector3(taper, 1, 1));
      const off = P.clone().addScaledVector(B, side * 0.34 * taper);
      o.setPosition(off.x, off.y, off.z);
      outer.push(o);
    }
  }
  return { centre, outer };
}
