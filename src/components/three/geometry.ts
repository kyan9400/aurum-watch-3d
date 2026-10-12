/* Every part of the watch, generated in code.
   Units: 1 = 19.5 mm (the case is 39 mm across). The watch faces +Z, 12 o'clock is +Y.
   Lathe profiles run counter-clockwise in (radius, z), so normals and front faces point outward. */

import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CubicBezierCurve3,
  Curve,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Path,
  RingGeometry,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ---------- lathe runs: smooth inside a run, a hard edge where runs meet ---------- */

/** One run of a lathe profile: control points [radius, z]; `mat` picks the material group; `raw` skips resampling. */
export type Run = { pts: [number, number][]; mat?: number; raw?: boolean };

function sampleRun(run: Run, samples: number): Vector2[] {
  if (run.raw || run.pts.length === 2) return run.pts.map(([r, z]) => new Vector2(r, z));
  const curve = new CatmullRomCurve3(
    run.pts.map(([r, z]) => new Vector3(r, z, 0)),
    false,
    "centripetal",
  );
  return curve.getPoints(Math.max(2, samples - 1)).map((p) => new Vector2(Math.max(0, p.x), p.y));
}

/** Lathe each run on its own around Z (u runs around the circumference), then merge with one group per run. */
export function latheRuns(runs: Run[], radialSegs: number, samplesPerRun: number) {
  const parts = runs.map((run) => {
    const g = new LatheGeometry(sampleRun(run, samplesPerRun), radialSegs);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const merged = mergeGeometries(parts, true)!;
  merged.groups.forEach((g, i) => (g.materialIndex = runs[i].mat ?? 0));
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Samples per curved lathe run for a tier (by its radial segment count). */
const runSamples = (radial: number) => (radial >= 192 ? 9 : radial >= 128 ? 7 : 5);

/** Material slots for metal parts. */
export const POLISHED = 0;
export const BRUSHED = 1;

/** Case middle: polished chamfers, a brushed convex flank, and the inner wall. */
export function caseMiddle(radial: number) {
  return latheRuns(
    [
      { pts: [[0.9, -0.24], [0.96, -0.25], [1.0, -0.236], [1.03, -0.19]], mat: POLISHED },
      { pts: [[1.03, -0.19], [1.05, -0.1], [1.058, 0], [1.052, 0.09], [1.03, 0.16]], mat: BRUSHED },
      { pts: [[1.03, 0.16], [1.0, 0.196], [0.95, 0.205]], mat: POLISHED },
      { pts: [[0.95, 0.205], [0.9, 0.205]], mat: POLISHED },
      { pts: [[0.9, 0.205], [0.9, -0.24]], mat: POLISHED },
    ],
    radial,
    runSamples(radial),
  );
}

/** Bezel: outer step, domed polished top, inner bevel. Sits 0.004 above the case so a dark seam reads. */
export function bezel(radial: number) {
  return latheRuns(
    [
      { pts: [[0.86, 0.209], [0.996, 0.209]] },
      { pts: [[0.996, 0.209], [1.008, 0.214], [1.012, 0.226], [1.012, 0.25]] },
      { pts: [[1.012, 0.25], [0.998, 0.284], [0.95, 0.311], [0.89, 0.322]] },
      { pts: [[0.89, 0.322], [0.872, 0.318], [0.862, 0.302]] },
      { pts: [[0.862, 0.302], [0.86, 0.209]] },
    ],
    radial,
    runSamples(radial),
  );
}

/** Dark machined spacer inside the case: reads when the case is opened in the exploded view. */
export function caseSpacer(radial: number) {
  // flat walls only: half the radial count is plenty
  return latheRuns(
    [
      { pts: [[0.815, -0.18], [0.895, -0.18]] },
      { pts: [[0.895, -0.18], [0.895, 0.092]] },
      { pts: [[0.895, 0.092], [0.815, 0.092]] },
      { pts: [[0.815, 0.092], [0.815, -0.18]] },
    ],
    Math.max(48, radial / 2),
    2,
  );
}

/** Sloped chapter ring between dial and bezel (starts just outside the dial edge: no shared band). */
export function rehaut(radial: number) {
  const g = new LatheGeometry([new Vector2(0.806, 0.1), new Vector2(0.868, 0.21)], radial);
  g.rotateX(Math.PI / 2);
  return g;
}

export function dialDisc(radial: number) {
  return new CircleGeometry(0.805, radial);
}

/** Box-dome sapphire: a short vertical edge, then a dome that is flat in the centre and steep at the rim. */
export function crystalDome(radial: number) {
  const dome: [number, number][] = [];
  const steps = radial >= 192 ? 24 : 16;
  for (let i = 0; i <= steps; i++) {
    const r = 0.87 * (1 - i / steps);
    dome.push([Math.max(0.0001, r), 0.372 - 0.05 * Math.pow(r / 0.87, 2.6)]);
  }
  return latheRuns(
    [
      { pts: [[0.87, 0.3], [0.87, 0.322]] },
      { pts: dome, raw: true },
    ],
    radial,
    2,
  );
}

/** Light-sweep shell: the crystal, a hair larger, with planar UVs so a band can slide across it. */
export function sweepShell(crystal: BufferGeometry) {
  const g = crystal.clone();
  g.scale(1.004, 1.004, 1.004);
  const pos = g.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / 1.8 + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / 1.8 + 0.5;
  }
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return g;
}

/** Stepped caseback ring with a flat engraved band (brushed) and a polished bevel. 0.004 below the case. */
export function casebackRing(radial: number) {
  return latheRuns(
    [
      { pts: [[0.93, -0.254], [0.62, -0.254]], mat: BRUSHED },
      { pts: [[0.62, -0.254], [0.62, -0.338]], mat: POLISHED },
      { pts: [[0.62, -0.338], [0.64, -0.344]], mat: POLISHED },
      { pts: [[0.64, -0.344], [0.84, -0.344]], mat: BRUSHED },
      { pts: [[0.84, -0.344], [0.885, -0.333], [0.918, -0.305], [0.93, -0.278]], mat: POLISHED },
      { pts: [[0.93, -0.278], [0.93, -0.254]], mat: BRUSHED },
    ],
    radial,
    runSamples(radial),
  );
}

export const ENGRAVING = { inner: 0.645, outer: 0.835 };

/** The engraved band: 0.002 proud of the caseback ring, facing -Z. */
export function casebackEngraving(radial: number) {
  const g = new RingGeometry(ENGRAVING.inner, ENGRAVING.outer, radial, 1);
  g.rotateY(Math.PI);
  g.translate(0, 0, -0.346);
  return g;
}

export function casebackGlass(radial: number) {
  const g = new CircleGeometry(0.625, radial);
  g.rotateY(Math.PI); // faces -Z
  g.translate(0, 0, -0.335);
  return g;
}

/* ---------- lofts: superellipse cross-sections swept along a path ---------- */

export type LoftOptions = {
  path: Curve<Vector3>;
  /** constant "across" direction; the cross-section's up axis is side x tangent */
  side: Vector3;
  closed?: boolean;
  width: (t: number) => number;
  height: (t: number) => number;
  /** superellipse exponent: 2 = ellipse, 4 = soft square, higher = boxier */
  n: number;
  ringSegs: number;
  samples: number;
  /** extra crown on the upper face, as a fraction of the height */
  dome?: number;
  /** material group for ring segment j */
  groupOf?: (j: number) => number;
  /** UV layout: "across" = u across / v along (textures), "along" = u along (brushing direction) */
  uv?: "across" | "along";
  vScale?: number;
  capStart?: boolean;
  capEnd?: boolean;
};

const P = new Vector3();
const T = new Vector3();
const N = new Vector3();
const B = new Vector3();

/** Loft a superellipse along a path. Indexed, so normals come out smooth; caps get their own vertices (hard edge). */
export function loftSuperellipse(o: LoftOptions) {
  const rings = o.closed ? o.samples : o.samples + 1;
  const segs = o.ringSegs;
  const pos: number[] = [];
  const uv: number[] = [];
  const e = 2 / o.n;
  const sp = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const centres: Vector3[] = [];
  const tangents: Vector3[] = [];

  for (let i = 0; i < rings; i++) {
    const t = i / o.samples;
    o.path.getPointAt(Math.min(1, t), P);
    o.path.getTangentAt(Math.min(1, t), T);
    N.crossVectors(o.side, T).normalize();
    B.crossVectors(T, N).normalize();
    centres.push(P.clone());
    tangents.push(T.clone());
    const w = o.width(t);
    const h = o.height(t);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = (w / 2) * sp(Math.cos(a));
      let y = (h / 2) * sp(Math.sin(a));
      if (o.dome && y > 0) {
        const xn = (2 * x) / w;
        y += o.dome * h * (1 - xn * xn) * (y / (h / 2));
      }
      pos.push(P.x + B.x * x + N.x * y, P.y + B.y * x + N.y * y, P.z + B.z * x + N.z * y);
      const across = x / w + 0.5;
      const along = t * (o.vScale ?? 1);
      if (o.uv === "along") uv.push(along, across);
      else uv.push(across, along);
    }
  }

  const groups = new Map<number, number[]>();
  const push = (g: number, ...ids: number[]) => {
    let list = groups.get(g);
    if (!list) groups.set(g, (list = []));
    list.push(...ids);
  };
  const v = (i: number, j: number) => (i % rings) * segs + (j % segs);
  const last = o.closed ? rings : rings - 1;
  for (let i = 0; i < last; i++) {
    for (let j = 0; j < segs; j++) {
      const g = o.groupOf ? o.groupOf(j) : 0;
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i, j + 1);
      const d = v(i + 1, j + 1);
      push(g, a, b, c, b, d, c);
    }
  }

  // fan caps: duplicated rim vertices so the cap keeps its own flat normal
  const cap = (ringIndex: number, facingForward: boolean) => {
    const base = pos.length / 3;
    const ctr = centres[ringIndex];
    pos.push(ctr.x, ctr.y, ctr.z);
    uv.push(0.5, 0.5);
    for (let j = 0; j < segs; j++) {
      const k = (ringIndex * segs + j) * 3;
      pos.push(pos[k], pos[k + 1], pos[k + 2]);
      uv.push(0.5, 0.5);
    }
    for (let j = 0; j < segs; j++) {
      const a = base + 1 + j;
      const b = base + 1 + ((j + 1) % segs);
      if (facingForward) push(0, base, b, a);
      else push(0, base, a, b);
    }
  };
  if (!o.closed && o.capEnd) cap(rings - 1, true);
  if (!o.closed && o.capStart) cap(0, false);

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  const index: number[] = [];
  [...groups.keys()]
    .sort((x, y) => x - y)
    .forEach((key) => {
      const list = groups.get(key)!;
      g.addGroup(index.length, list.length, key);
      index.push(...list);
    });
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/* ---------- lugs & crown ---------- */

/** Lug centreline (x = 0): from inside the case flank out to the tip. */
function lugPath() {
  return new CatmullRomCurve3(
    [new Vector3(0, 0.78, -0.01), new Vector3(0, 1.0, -0.015), new Vector3(0, 1.15, -0.04), new Vector3(0, 1.24, -0.088)],
    false,
    "centripetal",
  );
}

export const LUG_X = 0.58;

/** Four lugs: soft-square lofts, brushed on the flats, polished on the top bevels. Roots sink into the case. */
export function lugs(ringSegs: number, samples: number) {
  const segs = Math.max(8, Math.round(ringSegs / 4) * 4);
  const base = loftSuperellipse({
    path: lugPath(),
    side: new Vector3(1, 0, 0),
    width: (t) => 0.15 - 0.02 * t,
    height: (t) => 0.3 - 0.18 * Math.pow(t, 1.5),
    n: 4,
    ringSegs: segs,
    samples,
    uv: "along",
    capEnd: true,
    groupOf: (j) => {
      // the two top corners (around 45° and 135°) are the polished bevels
      const a = ((j + 0.5) / segs) * 360;
      return (a > 22 && a < 68) || (a > 112 && a < 158) ? POLISHED : BRUSHED;
    },
  });
  const parts: BufferGeometry[] = [];
  for (const x of [-LUG_X, LUG_X]) {
    for (const flip of [false, true]) {
      const g = base.clone();
      g.translate(x, 0, 0);
      if (flip) g.rotateZ(Math.PI);
      parts.push(g);
    }
  }
  base.dispose();
  const merged = mergeGeometries(parts, false)!;
  // keep the polished / brushed groups: rebuild them from the per-lug layout
  merged.clearGroups();
  const per = parts[0].index!.count;
  parts[0].groups.forEach((gr) => {
    for (let k = 0; k < parts.length; k++) merged.addGroup(gr.start + k * per, gr.count, gr.materialIndex);
  });
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Knurled crown band: radius r0 + amp * smoothstep(cos(flutes * θ)), indexed with analytic smooth normals. */
function knurl(r0: number, amp: number, flutes: number, x0: number, x1: number, segs: number) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rad = (a: number) => {
    const c = (Math.cos(flutes * a) + 1) / 2;
    return r0 + amp * c * c * (3 - 2 * c);
  };
  const h = 1e-4;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const r = rad(a);
    const dr = (rad(a + h) - rad(a - h)) / (2 * h);
    // outward normal of the cross-section curve p(a) = r(a)(cos a, sin a)
    let ny = dr * Math.sin(a) + r * Math.cos(a);
    let nz = -dr * Math.cos(a) + r * Math.sin(a);
    const l = Math.hypot(ny, nz) || 1;
    ny /= l;
    nz /= l;
    for (const x of [x0, x1]) {
      pos.push(x, r * Math.cos(a), r * Math.sin(a));
      nor.push(0, ny, nz);
      uv.push(i / segs, x === x0 ? 0 : 1);
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = (i + 1) * 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // flat end rings, so no lip shows between the flutes and the shoulder / cap
  for (const [x, dir] of [
    [x0, -1],
    [x1, 1],
  ] as const) {
    const base = pos.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = rad(a);
      pos.push(x, (r0 - 0.012) * Math.cos(a), (r0 - 0.012) * Math.sin(a), x, r * Math.cos(a), r * Math.sin(a));
      nor.push(dir, 0, 0, dir, 0, 0);
      uv.push(0, 0, 1, 1);
    }
    for (let i = 0; i < segs; i++) {
      const a = base + i * 2;
      const b = base + (i + 1) * 2;
      // (inner_i, inner_i+1, outer_i) faces -X
      if (dir < 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
      else idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Crown: lathed stem, shoulder and domed cap (smooth normals) + a fluted grip. Points along +X. */
export function crown(radial: number) {
  const hi = radial >= 192;
  const lo = radial < 128;
  const body = latheRuns(
    [
      { pts: [[0.05, 1.0], [0.05, 1.122]] },
      { pts: [[0.05, 1.122], [0.1, 1.124], [0.122, 1.13], [0.128, 1.138]] },
      { pts: [[0.128, 1.238], [0.131, 1.248], [0.122, 1.263], [0.085, 1.274], [0.0001, 1.277]] },
    ],
    hi ? 64 : lo ? 32 : 48,
    hi ? 10 : lo ? 6 : 8,
  );
  // lathed around Z: turn the axis onto +X
  body.rotateX(-Math.PI / 2);
  body.rotateZ(-Math.PI / 2);
  const grip = knurl(0.128, 0.006, 36, 1.138, 1.238, hi ? 216 : lo ? 72 : 144);
  const merged = mergeGeometries([body, grip], false)!;
  body.dispose();
  grip.dispose();
  return merged;
}

/** The embossed disc on the crown cap (faces +X, 0.002 proud of the dome). */
export function crownEmblem() {
  const g = new CircleGeometry(0.07, 48);
  g.rotateY(Math.PI / 2);
  g.translate(1.279, 0, 0);
  return g;
}

/* ---------- faceted parts: flat facets on purpose ---------- */

/** Collects triangles with one flat normal each; flips any triangle that faces away from its hint. */
class Facets {
  pos: number[] = [];
  nor: number[] = [];
  private a = new Vector3();
  private b = new Vector3();
  private c = new Vector3();
  private n = new Vector3();
  private e = new Vector3();

  tri(a: number[], b: number[], c: number[], hint: number[]) {
    this.a.fromArray(a);
    this.b.fromArray(b);
    this.c.fromArray(c);
    this.n.subVectors(this.b, this.a).cross(this.e.subVectors(this.c, this.a));
    if (this.n.lengthSq() < 1e-14) return;
    this.n.normalize();
    let p = [a, b, c];
    if (this.n.x * hint[0] + this.n.y * hint[1] + this.n.z * hint[2] < 0) {
      p = [a, c, b];
      this.n.negate();
    }
    for (const v of p) {
      this.pos.push(v[0], v[1], v[2]);
      this.nor.push(this.n.x, this.n.y, this.n.z);
    }
  }

  quad(a: number[], b: number[], c: number[], d: number[], hint: number[]) {
    this.tri(a, b, c, hint);
    this.tri(a, c, d, hint);
  }

  /** Vertical walls under a closed CCW outline, from z0 to z1. */
  walls(outline: number[][], z0: number, z1: number) {
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % outline.length];
      const hint = [q[1] - p[1], -(q[0] - p[0]), 0];
      this.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], hint);
    }
  }

  build() {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(this.nor, 3));
    const uv = new Float32Array((this.pos.length / 3) * 2);
    g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    return g;
  }
}

const HAND_WALL = 0.008;
const HAND_RIDGE = 0.009;

/** Dauphine hand: 0.008 side walls and a diamond-cut top (two sloped planes meeting at a raised spine). */
export function dauphineHand(len: number, halfWidth: number, tail: number, tailHalf: number) {
  const f = new Facets();
  const y0 = 0.02;
  const ze = HAND_WALL;
  const zr = HAND_WALL + HAND_RIDGE;
  const tip = [0, len, ze];
  const L = [-halfWidth, y0, ze];
  const R = [halfWidth, y0, ze];
  const TL = [-tailHalf, -tail, ze];
  const TR = [tailHalf, -tail, ze];
  const mid = [0, y0, zr];
  const back = [0, -tail, zr * 0.92];
  const up = [0, 0, 1];
  // blade facets
  f.tri(tip, L, mid, up);
  f.tri(tip, mid, R, up);
  // counterweight facets (same spine)
  f.quad(L, TL, back, mid, up);
  f.quad(R, mid, back, TR, up);
  // tail end gable
  f.tri(TL, TR, back, [0, -1, 0]);
  // walls + flat underside
  const outline = [
    [0, len],
    [-halfWidth, y0],
    [-tailHalf, -tail],
    [tailHalf, -tail],
    [halfWidth, y0],
  ];
  f.walls(outline, 0, ze);
  const down = [0, 0, -1];
  f.tri([0, len, 0], [-halfWidth, y0, 0], [-tailHalf, -tail, 0], down);
  f.tri([0, len, 0], [-tailHalf, -tail, 0], [tailHalf, -tail, 0], down);
  f.tri([0, len, 0], [tailHalf, -tail, 0], [halfWidth, y0, 0], down);
  return f.build();
}

/** Lume strip down a dauphine hand's spine, following the two roof slopes 0.0015 above them. */
export function handLume(len: number, halfWidth: number) {
  const f = new Facets();
  const y0 = 0.02;
  const ze = HAND_WALL;
  const zr = HAND_WALL + HAND_RIDGE;
  const half = Math.min(0.006, halfWidth * 0.18);
  const ya = y0 + 0.06;
  const yb = y0 + (len - y0) * 0.62;
  const steps = 6;
  const at = (y: number, x: number) => {
    const k = (y - y0) / (len - y0);
    const ridge = zr + (ze - zr) * k;
    const hw = halfWidth * (1 - k);
    return [x, y, ridge - ((ridge - ze) * Math.abs(x)) / hw + 0.0015];
  };
  const up = [0, 0, 1];
  for (let i = 0; i < steps; i++) {
    const y1 = ya + ((yb - ya) * i) / steps;
    const y2 = ya + ((yb - ya) * (i + 1)) / steps;
    f.quad(at(y1, -half), at(y1, 0), at(y2, 0), at(y2, -half), up);
    f.quad(at(y1, 0), at(y1, half), at(y2, half), at(y2, 0), up);
  }
  return f.build();
}

/** Slim seconds hand with a smooth round counterweight and hub (normals kept, not re-flattened). */
export function secondsHand(curveSegments: number) {
  const s = new Shape();
  s.moveTo(-0.006, -0.12);
  s.lineTo(-0.0035, 0.76);
  s.lineTo(0.0035, 0.76);
  s.lineTo(0.006, -0.12);
  s.closePath();
  const blade = new ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments });
  const weight = new CylinderGeometry(0.034, 0.034, 0.008, 40);
  weight.rotateX(Math.PI / 2);
  weight.translate(0, -0.17, 0.003);
  const hub = new CylinderGeometry(0.028, 0.028, 0.03, 32);
  hub.rotateX(Math.PI / 2);
  const parts = [blade, weight.toNonIndexed(), hub.toNonIndexed()];
  const merged = mergeGeometries(parts, false)!;
  [blade, weight, hub, ...parts].forEach((g) => g.dispose());
  return merged;
}

export function handCap() {
  const g = new CylinderGeometry(0.042, 0.046, 0.04, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

/* ---------- applied hour indices ---------- */

const IDX = { w: 0.036, l: 0.13, wall: 0.014, ridge: 0.022 };

/** Baton index with a two-facet roof (ridge along its length). Base at z = 0. */
export function batonIndex() {
  const f = new Facets();
  const hw = IDX.w / 2;
  const hl = IDX.l / 2;
  const zw = IDX.wall;
  const zr = IDX.ridge;
  f.walls(
    [
      [-hw, -hl],
      [hw, -hl],
      [hw, hl],
      [-hw, hl],
    ],
    0,
    zw,
  );
  f.quad([-hw, -hl, zw], [0, -hl, zr], [0, hl, zr], [-hw, hl, zw], [-1, 0, 2]);
  f.quad([0, -hl, zr], [hw, -hl, zw], [hw, hl, zw], [0, hl, zr], [1, 0, 2]);
  f.tri([-hw, hl, zw], [0, hl, zr], [hw, hl, zw], [0, 1, 0]);
  f.tri([-hw, -hl, zw], [hw, -hl, zw], [0, -hl, zr], [0, -1, 0]);
  return f.build();
}

/** Lume strip on an index: follows the roof, 0.0015 above it. */
export function indexLume() {
  const f = new Facets();
  const hw = IDX.w / 2;
  const half = 0.0055;
  const hl = IDX.l * 0.36;
  const drop = ((IDX.ridge - IDX.wall) * half) / hw;
  const z = IDX.ridge + 0.0015;
  f.quad([-half, -hl, z - drop], [0, -hl, z], [0, hl, z], [-half, hl, z - drop], [0, 0, 1]);
  f.quad([0, -hl, z], [half, -hl, z - drop], [half, hl, z - drop], [0, hl, z], [0, 0, 1]);
  return f.build();
}

export const INDEX_BASE_Z = 0.103;

/** Matrices for the applied indices: 12 o'clock is doubled, 3 o'clock gives way to the date window. */
export function indexMatrices(): Matrix4[] {
  const out: Matrix4[] = [];
  const R = 0.645;
  for (let h = 0; h < 12; h++) {
    // 3 o'clock gives way to the date, 6 o'clock to the open heart
    if (h === 3 || h === 6) continue;
    const a = (h / 12) * Math.PI * 2;
    const offsets = h === 0 ? [-0.028, 0.028] : [0];
    for (const off of offsets) {
      const m = new Matrix4().makeRotationZ(-a);
      const x = Math.sin(a) * R + Math.cos(a) * off;
      const y = Math.cos(a) * R - Math.sin(a) * off;
      m.setPosition(x, y, INDEX_BASE_Z);
      out.push(m);
    }
  }
  return out;
}

/** Four small applied dots at 1:30, 4:30, 7:30 and 10:30 (smooth spheres, flattened). */
export function halfHourMatrices(): Matrix4[] {
  const out: Matrix4[] = [];
  for (const h of [1.5, 4.5, 7.5, 10.5]) {
    const a = (h / 12) * Math.PI * 2;
    const m = new Matrix4().makeScale(1, 1, 0.35);
    m.setPosition(Math.sin(a) * 0.66, Math.cos(a) * 0.66, 0.1035);
    out.push(m);
  }
  return out;
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
  { x: -0.44, y: -0.3, r: 0.14, teeth: 30, spokes: 4, speed: 0.32, z: 0.012 },
  { x: 0.42, y: -0.1, r: 0.11, teeth: 24, spokes: 3, speed: 0.52, z: 0.018 },
];

/** The balance sits under the open-heart aperture at 6 o'clock, so it beats in view from the front. */
export const BALANCE = { x: 0, y: -0.37, r: 0.2 };
/** Open-heart window in the dial (world units, dial space). */
export const APERTURE = { x: 0, y: -0.37, r: 0.225 };

/** Heights (movement-inner space) of the surfaces things sit on. */
export const SURFACE = { plateTop: 0.01, plateBottom: -0.08, gearBase: 0.008, gearDepth: 0.022, bridgeZ: 0.05, bridgeTop: 0.083 };

export function gearGeometry(spec: GearSpec, curveSegments: number) {
  return new ExtrudeGeometry(gearShape(spec.r, spec.teeth, Math.min(0.03, spec.r * 0.12), 0.025, spec.spokes), {
    depth: SURFACE.gearDepth,
    bevelEnabled: false,
    curveSegments: Math.max(2, Math.round(curveSegments / 2)),
  });
}

/** Ratchet wheel on the back of the plate (48 teeth, no spokes). */
export function ratchetGeometry(curveSegments: number) {
  return new ExtrudeGeometry(gearShape(0.17, 48, 0.016, 0.03, 0), {
    depth: 0.01,
    bevelEnabled: false,
    curveSegments: Math.max(4, curveSegments),
  });
}
export const RATCHET = { x: -0.32, y: 0.26, z: -0.092 };

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

/** Train bridge + balance cock in one extrusion: group 0 = flat caps (brushed), group 1 = sides and bevels (anglage). */
export function bridgeGeometry(curveSegments: number) {
  const train = new Shape();
  train.moveTo(-0.62, 0.18);
  train.quadraticCurveTo(-0.3, 0.55, 0.15, 0.48);
  train.quadraticCurveTo(0.5, 0.42, 0.6, 0.12);
  train.lineTo(0.5, 0.05);
  train.quadraticCurveTo(0.4, 0.3, 0.12, 0.34);
  train.quadraticCurveTo(-0.25, 0.4, -0.52, 0.08);
  train.closePath();
  const cock = new Shape();
  cock.moveTo(0.72, -0.24);
  cock.quadraticCurveTo(0.4, -0.27, 0.06, -0.335);
  cock.absarc(BALANCE.x, BALANCE.y, 0.07, 0.52, Math.PI * 1.6, false);
  cock.quadraticCurveTo(0.4, -0.46, 0.74, -0.34);
  cock.closePath();
  return new ExtrudeGeometry([train, cock], {
    depth: 0.025,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
    curveSegments,
  });
}

/** Balance rim + spokes (the hairspring is separate, in blued steel). */
export function balanceWheel(curveSegments: number) {
  const rim = new TorusGeometry(BALANCE.r, 0.014, 10, 24 + curveSegments * 6);
  const parts: BufferGeometry[] = [rim];
  for (let i = 0; i < 3; i++) {
    const spoke = new BoxGeometry(0.012, BALANCE.r * 2, 0.012);
    spoke.rotateZ((i / 3) * Math.PI);
    parts.push(spoke);
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Hairspring: an Archimedean spiral tube. */
export function hairspring(curveSegments: number) {
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
  return new TubeGeometry(new Spiral(), 80 + curveSegments * 16, 0.0025, curveSegments >= 10 ? 4 : 3, false);
}

export function rotorGeometry(curveSegments: number) {
  const s = new Shape();
  s.absarc(0, 0, 0.74, 0, Math.PI, false);
  s.lineTo(-0.11, 0);
  s.absarc(0, 0, 0.11, Math.PI, 0, true);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2, curveSegments: curveSegments * 3 });
  return g;
}

/** Jewel spots and the height of the surface each one sits on (movement-inner space). */
export function jewelSpots(): Vector3[] {
  const top = SURFACE.gearBase + SURFACE.gearDepth;
  const out = GEARS.map((g) => new Vector3(g.x, g.y, top + g.z));
  out.push(new Vector3(BALANCE.x, BALANCE.y, SURFACE.bridgeTop));
  out.push(new Vector3(-0.5, 0.5, SURFACE.plateTop), new Vector3(0.55, 0.5, SURFACE.plateTop), new Vector3(-0.6, -0.4, SURFACE.plateTop));
  return out;
}

/** Blued screw head: two half-discs with a 0.004 slot between them. Base at z = 0. */
export function screwHead() {
  const r = 0.022;
  const gap = 0.002;
  const s = new Shape();
  s.moveTo(r, gap);
  s.absarc(0, gap, r, 0, Math.PI, false);
  s.closePath();
  const opts = { depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1, curveSegments: 8 };
  const a = new ExtrudeGeometry(s, opts);
  const b = new ExtrudeGeometry(s, opts);
  b.rotateZ(Math.PI);
  a.translate(0, 0, 0.003);
  b.translate(0, 0, 0.003);
  const merged = mergeGeometries([a, b], false)!;
  a.dispose();
  b.dispose();
  return merged;
}

/** Screw spots: bridge ends first (they show on every tier that has screws), then the plate. [x, y, surface z] */
export const SCREWS: [number, number, number][] = [
  [-0.56, 0.15, SURFACE.bridgeTop],
  [0.54, 0.12, SURFACE.bridgeTop],
  [0.13, 0.41, SURFACE.bridgeTop],
  [-0.25, 0.4, SURFACE.bridgeTop],
  [0.66, -0.29, SURFACE.bridgeTop],
  [-0.68, -0.2, SURFACE.plateTop],
  [0.0, -0.7, SURFACE.plateTop],
  [-0.45, -0.58, SURFACE.plateTop],
  [0.7, 0.3, SURFACE.plateTop],
  [-0.62, 0.44, SURFACE.plateTop],
];

/* ---------- exploded-view axis ---------- */

/** A unit-length thin cylinder along Z (scaled per frame). */
export function axisRod() {
  const g = new CylinderGeometry(0.003, 0.003, 1, 8, 1, true);
  g.rotateX(Math.PI / 2);
  return g;
}

export function axisTick() {
  return new TorusGeometry(0.05, 0.0025, 6, 40);
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

/** Strap width at u (it narrows into a rounded tongue over the last 10%). */
export function strapWidth(u: number, w0: number, w1: number) {
  const taper = u > 0.9 ? Math.cos(((u - 0.9) / 0.1) * Math.PI * 0.42) : 1;
  return (w0 + (w1 - w0) * u) * (0.55 + 0.45 * taper);
}

/** Padded strap: a domed superellipse (n = 6) lofted along the curve.
    Group 0 = outer face (grain texture), group 1 = inner lining. u across, v along. */
export function strapLoft(curve: CubicBezierCurve3, sign: 1 | -1, ringSegs: number, samples: number, w0: number, w1: number, t0: number, t1: number, texLength: number) {
  const segs = Math.max(8, Math.round(ringSegs / 2) * 2);
  return loftSuperellipse({
    path: curve,
    side: new Vector3(sign, 0, 0),
    width: (u) => strapWidth(u, w0, w1),
    height: (u) => t0 + (t1 - t0) * u,
    n: 6,
    dome: 0.25,
    ringSegs: segs,
    samples,
    vScale: texLength,
    capStart: true,
    capEnd: true,
    groupOf: (j) => (Math.sin(((j + 0.5) / segs) * Math.PI * 2) >= 0 ? 0 : 1),
  });
}

/** Two keepers (rounded loops) around the strap at the given positions along it. */
export function keepers(curve: CubicBezierCurve3, sign: 1 | -1, at: number[], w0: number, w1: number, t0: number, t1: number, ringSegs: number) {
  const parts: BufferGeometry[] = [];
  const Pk = new Vector3();
  const Tk = new Vector3();
  const Nk = new Vector3();
  const side = new Vector3(sign, 0, 0);
  for (const u of at) {
    curve.getPointAt(u, Pk);
    curve.getTangentAt(u, Tk);
    Nk.crossVectors(side, Tk).normalize();
    // the strap's top is domed (0.25 of its thickness, see strapLoft): centre the loop on the real
    // cross-section, so the inner face clears it by 0.004 all round instead of cutting through the dome
    const th = t0 + (t1 - t0) * u;
    const a = strapWidth(u, w0, w1) / 2 + 0.014;
    const b = 0.625 * th + 0.012;
    const lift = 0.125 * th;
    const pts: Vector3[] = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 1 / 3);
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 1 / 3);
      pts.push(Pk.clone().addScaledVector(side, x).addScaledVector(Nk, y + lift));
    }
    parts.push(
      loftSuperellipse({
        path: new CatmullRomCurve3(pts, true, "centripetal"),
        side: Tk.clone(),
        closed: true,
        width: () => 0.07,
        height: () => 0.016,
        n: 4,
        ringSegs: Math.max(8, Math.round(ringSegs / 2)),
        samples: ringSegs >= 14 ? 48 : 24,
      }),
    );
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  merged.clearGroups();
  return merged;
}

/** Bracelet link transforms along the same curve: one centre link + two outer links per row. */
export function braceletMatrices(curve: CubicBezierCurve3, sign: 1 | -1, pitch: number) {
  const total = curve.getLength();
  const rows = Math.floor(total / pitch);
  const centre: Matrix4[] = [];
  const outer: Matrix4[] = [];
  const Pb = new Vector3();
  const Tb = new Vector3();
  const Nb = new Vector3();
  const Bb = new Vector3(sign, 0, 0);
  for (let i = 0; i < rows; i++) {
    const u = (i * pitch + pitch * 0.5) / total;
    curve.getPointAt(u, Pb);
    curve.getTangentAt(u, Tb);
    Nb.crossVectors(Bb, Tb).normalize();
    const taper = 1 - u * 0.16;
    const m = new Matrix4().makeBasis(Bb, Tb, Nb);
    const c = m.clone().scale(new Vector3(taper, 1, 1));
    c.setPosition(Pb.x, Pb.y, Pb.z);
    centre.push(c.clone().multiply(new Matrix4().makeTranslation(0, 0, 0.012)));
    for (const s of [-1, 1]) {
      const o = m.clone().scale(new Vector3(taper, 1, 1));
      const off = Pb.clone().addScaledVector(Bb, s * 0.34 * taper);
      o.setPosition(off.x, off.y, off.z);
      outer.push(o);
    }
  }
  return { centre, outer };
}
