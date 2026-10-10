/* The Meridian watch as a plain three.js object graph.
   React owns the Canvas and the loop; this class owns the meshes, materials and per-frame maths,
   so nothing is allocated inside update(). */

import {
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  BufferGeometry,
  SphereGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { TierSettings } from "@/lib/quality";
import type { StagePhases } from "@/lib/stage";
import { findCase, findDial, findStrap, type CaseOption, type DialOption, type StrapOption } from "@/lib/options";
import type { WatchConfig } from "@/lib/store";
import * as G from "./geometry";
import { drawDial, drawRotor, drawStrap, makeTexture, strapTexture } from "./textures";

export type FrameInput = {
  delta: number;
  elapsed: number;
  target: StagePhases;
  reduced: boolean;
  inView: boolean;
  vw: number;
  vh: number;
  aspect: number;
};

type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number; spread: number };

const TAU = Math.PI * 2;

/** Let the browser handle input and paint before the next slice of work. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const damp = (cur: number, to: number, lambda: number, dt: number) => cur + (to - cur) * (1 - Math.exp(-lambda * dt));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Exploded-view offsets along the watch axis, in "spread" units. */
const LAYER_OFFSETS = { crystal: 3.0, hands: 2.1, dial: 1.2, case: 0, movement: -1.25, caseback: -2.35 };

export class WatchModel {
  readonly root = new Group();
  private inner = new Group();
  private layers!: Record<keyof typeof LAYER_OFFSETS, Group>;
  private strapTop = new Group();
  private strapBottom = new Group();
  private hour!: Mesh;
  private minute!: Mesh;
  private second!: Mesh;
  private gears: Mesh[] = [];
  private balance!: Mesh;
  private rotor!: Mesh;

  private geos: BufferGeometry[] = [];
  private mats: Material[] = [];
  private textures: CanvasTexture[] = [];

  private caseMat!: MeshStandardMaterial | MeshPhysicalMaterial;
  private braceletOuterMat!: MeshStandardMaterial;
  private trimMat!: MeshStandardMaterial;
  private dialMat!: MeshStandardMaterial;
  private rehautMat!: MeshStandardMaterial;
  private strapMat!: MeshStandardMaterial;
  private leather: Mesh[] = [];
  private bracelet: InstancedMesh[] = [];

  private dialCanvas!: HTMLCanvasElement;
  private dialTex!: CanvasTexture;
  private strapCanvas!: HTMLCanvasElement;
  private strapTex!: CanvasTexture;
  private rotorTex!: CanvasTexture;

  // targets for the material cross-fade
  private caseColor = new Color();
  private trimColor = new Color();
  private rehautColor = new Color();
  private caseRough = 0.2;
  private caseMetal = 1;
  private caseCoat = 0;

  private current: WatchConfig | null = null;
  private dial!: DialOption;
  private strap!: StrapOption;
  private pendingDial: DialOption | null = null;
  private pendingStrap: StrapOption | null = null;
  private dialK = 1;
  private strapK = 1;

  // smoothed scroll phases
  private a = 0;
  private b = 0;
  private e = 0;
  private yaw = 0;
  private yawTarget = 0;
  private started = false;
  private tzOffset = -new Date().getTimezoneOffset() * 60000;
  private settings: TierSettings;

  private poseA: Pose = { x: 0, y: 0, s: 1, rx: 0, ry: 0, rz: 0, spread: 0 };
  private poseB: Pose = { x: 0, y: 0, s: 1, rx: 0, ry: 0, rz: 0, spread: 0 };
  private poseC: Pose = { x: 0, y: 0, s: 1, rx: 0, ry: 0, rz: 0, spread: 0 };

  /** Build the watch in a few slices, yielding to the main thread between them,
      so a slow phone never sees one long blocking task. */
  static async create(settings: TierSettings, config: WatchConfig, anisotropy: number, isCancelled: () => boolean) {
    const model = new WatchModel(settings);
    const steps = model.build(config, anisotropy);
    while (!steps.next().done) {
      await yieldToMain();
      if (isCancelled()) {
        model.dispose();
        return null;
      }
    }
    return model;
  }

  private constructor(settings: TierSettings) {
    this.settings = settings;
  }

  private *build(config: WatchConfig, anisotropy: number): Generator<void, void, void> {
    const settings = this.settings;
    const seg = settings.curveSegments >= 10 ? 128 : settings.curveSegments >= 6 ? 96 : 64;
    const cs = settings.curveSegments;
    const physical = settings.physicalCrystal;
    const c = findCase(config.case);
    this.dial = findDial(config.dial);
    this.strap = findStrap(config.strap);

    this.root.add(this.inner);
    const mk = () => {
      const g = new Group();
      this.inner.add(g);
      return g;
    };
    this.layers = { crystal: mk(), hands: mk(), dial: mk(), case: mk(), movement: mk(), caseback: mk() };
    this.inner.add(this.strapTop, this.strapBottom);

    const geo = <T extends BufferGeometry>(g: T) => {
      this.geos.push(g);
      return g;
    };
    const mat = <T extends Material>(m: T) => {
      this.mats.push(m);
      return m;
    };

    /* materials */
    this.caseMat = mat(
      physical
        ? new MeshPhysicalMaterial({ color: c.color, metalness: c.metalness, roughness: c.roughness, clearcoat: c.clearcoat, clearcoatRoughness: 0.08 })
        : new MeshStandardMaterial({ color: c.color, metalness: c.metalness, roughness: c.roughness }),
    );
    this.braceletOuterMat = mat(new MeshStandardMaterial({ color: c.color, metalness: c.metalness, roughness: Math.min(1, c.roughness + 0.18) }));
    this.trimMat = mat(new MeshStandardMaterial({ color: c.trim, metalness: 1, roughness: 0.12 }));
    this.caseColor.set(c.color);
    this.trimColor.set(c.trim);
    this.caseRough = c.roughness;
    this.caseMetal = c.metalness;
    this.caseCoat = c.clearcoat;

    this.dialCanvas = drawDial(this.dial, settings.textureSize);
    this.dialTex = makeTexture(this.dialCanvas, anisotropy);
    this.textures.push(this.dialTex);
    this.dialMat = mat(new MeshStandardMaterial({ map: this.dialTex, roughness: this.dial.roughness, metalness: this.dial.metalness }));
    this.rehautColor.set(this.dial.base).multiplyScalar(0.8);
    this.rehautMat = mat(new MeshStandardMaterial({ color: this.rehautColor.clone(), roughness: 0.5, metalness: 0.2, side: DoubleSide }));

    const crystalMat = mat(
      physical
        ? new MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, depthWrite: false })
        : new MeshStandardMaterial({ color: "#ffffff", metalness: 0.4, roughness: 0.04, transparent: true, opacity: 0.12, envMapIntensity: 2, depthWrite: false }),
    );

    this.strapCanvas = drawStrap(this.strap, settings.textureSize >= 1024 ? 256 : 128);
    this.strapTex = strapTexture(this.strapCanvas, anisotropy);
    this.textures.push(this.strapTex);
    this.strapMat = mat(new MeshStandardMaterial({ map: this.strapTex, bumpMap: this.strapTex, bumpScale: 0.6, roughness: 0.62, metalness: 0 }));

    const plateMat = mat(new MeshStandardMaterial({ color: "#B7BBC2", metalness: 1, roughness: 0.38 }));
    const gearMat = mat(new MeshStandardMaterial({ color: "#D8A64F", metalness: 1, roughness: 0.26 }));
    const bridgeMat = mat(new MeshStandardMaterial({ color: "#D3D6DB", metalness: 1, roughness: 0.2 }));
    const jewelMat = mat(
      physical
        ? new MeshPhysicalMaterial({ color: "#A3192E", metalness: 0, roughness: 0.08, clearcoat: 1, emissive: "#3a0610", emissiveIntensity: 0.6 })
        : new MeshStandardMaterial({ color: "#A3192E", metalness: 0.1, roughness: 0.15, emissive: "#3a0610", emissiveIntensity: 0.6 }),
    );
    this.rotorTex = makeTexture(drawRotor(settings.textureSize / 2), anisotropy);
    this.rotorTex.repeat.set(1 / 1.48, 1 / 1.48);
    this.rotorTex.offset.set(0.5, 0.5);
    this.textures.push(this.rotorTex);
    const rotorMat = mat(new MeshStandardMaterial({ map: this.rotorTex, metalness: 1, roughness: 0.3 }));

    yield;

    /* case */
    const caseL = this.layers.case;
    caseL.add(new Mesh(geo(G.caseMiddle(seg)), this.caseMat));
    caseL.add(new Mesh(geo(G.bezel(seg)), this.caseMat));
    caseL.add(new Mesh(geo(G.lugs(cs)), this.caseMat));
    caseL.add(new Mesh(geo(G.crown()), this.caseMat));

    /* dial */
    const dialL = this.layers.dial;
    const disc = new Mesh(geo(G.dialDisc(seg)), this.dialMat);
    disc.position.z = 0.1;
    dialL.add(disc);
    dialL.add(new Mesh(geo(G.rehaut(seg)), this.rehautMat));
    const idxM = G.indexMatrices();
    const indices = new InstancedMesh(geo(G.indexBar()), this.trimMat, idxM.length);
    idxM.forEach((m, i) => indices.setMatrixAt(i, m));
    indices.instanceMatrix.needsUpdate = true;
    dialL.add(indices);

    yield;

    /* hands */
    const handsL = this.layers.hands;
    this.hour = new Mesh(geo(G.hourHand(cs)), this.trimMat);
    this.hour.position.z = 0.13;
    this.minute = new Mesh(geo(G.minuteHand(cs)), this.trimMat);
    this.minute.position.z = 0.15;
    this.second = new Mesh(geo(G.secondsHand(cs)), this.trimMat);
    this.second.position.z = 0.172;
    const cap = new Mesh(geo(G.handCap()), this.trimMat);
    cap.position.z = 0.185;
    handsL.add(this.hour, this.minute, this.second, cap);

    /* crystal */
    this.layers.crystal.add(new Mesh(geo(G.crystalDome(seg)), crystalMat));
    this.layers.crystal.renderOrder = 2;

    yield;

    /* movement */
    const mv = this.layers.movement;
    mv.position.z = -0.1;
    const movementInner = new Group();
    movementInner.position.z = -0.1;
    mv.add(movementInner);
    movementInner.add(new Mesh(geo(G.mainPlate(seg)), plateMat));
    for (const spec of G.GEARS) {
      const gear = new Mesh(geo(G.gearGeometry(spec, cs)), gearMat);
      gear.position.set(spec.x, spec.y, 0.008 + spec.z);
      gear.userData.speed = spec.speed;
      this.gears.push(gear);
      movementInner.add(gear);
    }
    const bridges = new Mesh(geo(G.bridgeGeometry(cs)), bridgeMat);
    bridges.position.z = 0.05;
    movementInner.add(bridges);
    this.balance = new Mesh(geo(G.balanceWheel(cs)), gearMat);
    this.balance.position.set(G.BALANCE.x, G.BALANCE.y, 0.035);
    movementInner.add(this.balance);
    const jp = G.jewelPositions();
    const jewels = new InstancedMesh(geo(new SphereGeometry(0.02, 12, 8)), jewelMat, jp.length);
    const tmp = new Group();
    jp.forEach((p, i) => {
      tmp.position.copy(p);
      tmp.position.z += 0.045;
      tmp.updateMatrix();
      jewels.setMatrixAt(i, tmp.matrix);
    });
    jewels.instanceMatrix.needsUpdate = true;
    movementInner.add(jewels);
    const rotorGeo = geo(G.rotorGeometry(cs));
    rotorGeo.rotateY(Math.PI); // engraving reads correctly through the caseback
    this.rotor = new Mesh(rotorGeo, rotorMat);
    this.rotor.position.z = -0.1;
    this.rotor.rotation.z = 0.6;
    movementInner.add(this.rotor);

    yield;

    /* caseback */
    const back = this.layers.caseback;
    back.add(new Mesh(geo(G.casebackRing(seg)), this.caseMat));
    back.add(new Mesh(geo(G.casebackGlass(seg)), crystalMat));

    yield;

    /* straps: leather ribbon + bracelet links, one of the two is visible */
    const samples = settings.curveSegments >= 6 ? 48 : 28;
    const linkGeoC = geo(new RoundedBoxGeometry(0.36, 0.15, 0.1, 2, 0.03));
    const linkGeoO = geo(new RoundedBoxGeometry(0.3, 0.15, 0.085, 2, 0.028));
    for (const sign of [1, -1] as const) {
      const curve = G.strapCurve(sign);
      const holder = sign === 1 ? this.strapTop : this.strapBottom;
      const ribbon = new Mesh(geo(G.strapGeometry(curve, sign, samples, 1.0, 0.82, 0.1, 0.075, (curve.getLength() / 1.0) * 0.25)), this.strapMat);
      this.leather.push(ribbon);
      holder.add(ribbon);
      const { centre, outer } = G.braceletMatrices(curve, sign, 0.165);
      const ci = new InstancedMesh(linkGeoC, this.caseMat, centre.length);
      centre.forEach((m, i) => ci.setMatrixAt(i, m));
      const oi = new InstancedMesh(linkGeoO, this.braceletOuterMat, outer.length);
      outer.forEach((m, i) => oi.setMatrixAt(i, m));
      ci.instanceMatrix.needsUpdate = true;
      oi.instanceMatrix.needsUpdate = true;
      this.bracelet.push(ci, oi);
      holder.add(ci, oi);
    }
    this.showStrapKind(this.strap);
    this.current = config;
  }

  private showStrapKind(strap: StrapOption) {
    const isBracelet = strap.kind === "bracelet";
    this.leather.forEach((m) => (m.visible = !isBracelet));
    this.bracelet.forEach((m) => (m.visible = isBracelet));
    if (!isBracelet) {
      drawStrap(strap, this.strapCanvas.width, this.strapCanvas);
      this.strapTex.needsUpdate = true;
      this.strapMat.roughness = strap.kind === "silk" ? 0.78 : strap.kind === "alligator" ? 0.42 : 0.6;
      this.strapMat.bumpScale = strap.kind === "alligator" ? 1.4 : strap.kind === "silk" ? 0.4 : 0.6;
    }
  }

  /** Redraw canvas textures once the web fonts have loaded. */
  redrawText() {
    drawDial(this.dial, this.dialCanvas.width, this.dialCanvas);
    this.dialTex.needsUpdate = true;
    const rotorCanvas = this.rotorTex.image as HTMLCanvasElement;
    const fresh = drawRotor(rotorCanvas.width);
    rotorCanvas.getContext("2d")!.drawImage(fresh, 0, 0);
    this.rotorTex.needsUpdate = true;
  }

  applyConfig(config: WatchConfig, instant: boolean) {
    const prev = this.current;
    this.current = config;
    const c: CaseOption = findCase(config.case);
    this.caseColor.set(c.color);
    this.trimColor.set(c.trim);
    this.caseRough = c.roughness;
    this.caseMetal = c.metalness;
    this.caseCoat = c.clearcoat;
    if (instant) this.snapMaterials();

    if (!prev || prev.dial !== config.dial) {
      const d = findDial(config.dial);
      this.rehautColor.set(d.base).multiplyScalar(0.8);
      if (instant) {
        this.swapDial(d);
      } else {
        this.pendingDial = d;
        this.dialK = 0;
      }
    }
    if (!prev || prev.strap !== config.strap) {
      const s = findStrap(config.strap);
      if (instant) {
        this.strap = s;
        this.showStrapKind(s);
      } else {
        this.pendingStrap = s;
        this.strapK = 0;
      }
    }
  }

  private swapDial(d: DialOption) {
    this.dial = d;
    drawDial(d, this.dialCanvas.width, this.dialCanvas);
    this.dialTex.needsUpdate = true;
    this.dialMat.roughness = d.roughness;
    this.dialMat.metalness = d.metalness;
    this.rehautMat.color.copy(this.rehautColor);
  }

  private snapMaterials() {
    this.caseMat.color.copy(this.caseColor);
    this.braceletOuterMat.color.copy(this.caseColor);
    this.trimMat.color.copy(this.trimColor);
    this.caseMat.roughness = this.caseRough;
    this.caseMat.metalness = this.caseMetal;
    this.braceletOuterMat.metalness = this.caseMetal;
    this.braceletOuterMat.roughness = Math.min(1, this.caseRough + 0.18);
    if ("clearcoat" in this.caseMat) this.caseMat.clearcoat = this.caseCoat;
  }

  addYaw(delta: number) {
    this.yawTarget = Math.max(-Math.PI, Math.min(Math.PI, this.yawTarget + delta));
  }

  private posesFor(vw: number, vh: number, aspect: number) {
    const mobile = aspect < 0.9;
    const A = this.poseA;
    const B = this.poseB;
    const C = this.poseC;
    if (mobile) {
      const s = Math.min(0.82, vw / 2.7);
      A.x = 0; A.y = vh * 0.21; A.s = s; A.rx = -0.16; A.ry = -0.32; A.rz = 0.05; A.spread = 0;
      B.x = 0; B.y = vh * 0.24; B.s = s * 0.92; B.rx = -0.08; B.ry = 0.42; B.rz = 0; B.spread = 0;
      C.x = vw * 0.04; C.y = vh * 0.2; C.s = Math.min(0.62, vw / 3.6); C.rx = 0.5; C.ry = -0.95; C.rz = 0.1; C.spread = 0.4;
    } else {
      const s = Math.min(1.05, vh / 3.9);
      A.x = vw * 0.22; A.y = -0.04; A.s = s; A.rx = -0.18; A.ry = -0.42; A.rz = 0.08; A.spread = 0;
      B.x = -vw * 0.2; B.y = 0; B.s = s * 1.08; B.rx = -0.06; B.ry = 0.5; B.rz = 0; B.spread = 0;
      C.x = vw * 0.17; C.y = 0.05; C.s = s * 0.8; C.rx = 0.32; C.ry = -1.0; C.rz = 0.12; C.spread = 0.52;
    }
  }

  /** Advance one frame. Returns true while something still needs more frames. */
  update(inp: FrameInput): boolean {
    const dt = Math.min(inp.delta, 0.05);
    const t = inp.target;
    let more = false;

    if (inp.reduced || !this.started) {
      // reduced motion: cut between poses instead of sweeping; the exploded view still follows the scroll 1:1
      this.a = inp.reduced ? (t.toConfig > 0.5 ? 1 : 0) : t.toConfig;
      this.b = inp.reduced ? (t.toExplode > 0.5 ? 1 : 0) : t.toExplode;
      this.e = t.explode;
      this.yaw = this.yawTarget;
      this.started = true;
    } else {
      this.a = damp(this.a, t.toConfig, 7, dt);
      this.b = damp(this.b, t.toExplode, 7, dt);
      this.e = damp(this.e, t.explode, 9, dt);
      this.yaw = damp(this.yaw, this.yawTarget, 8, dt);
      if (Math.abs(this.a - t.toConfig) > 1e-4 || Math.abs(this.b - t.toExplode) > 1e-4 || Math.abs(this.e - t.explode) > 1e-4 || Math.abs(this.yaw - this.yawTarget) > 1e-4) more = true;
      else {
        this.a = t.toConfig;
        this.b = t.toExplode;
        this.e = t.explode;
        this.yaw = this.yawTarget;
      }
    }

    /* pose */
    this.posesFor(inp.vw, inp.vh, inp.aspect);
    const ka = smooth(this.a);
    const kb = smooth(this.b);
    const A = this.poseA;
    const B = this.poseB;
    const C = this.poseC;
    const x = lerp(lerp(A.x, B.x, ka), C.x, kb);
    const y = lerp(lerp(A.y, B.y, ka), C.y, kb);
    const s = lerp(lerp(A.s, B.s, ka), C.s, kb);
    let rx = lerp(lerp(A.rx, B.rx, ka), C.rx, kb);
    let ry = lerp(lerp(A.ry, B.ry, ka), C.ry, kb);
    const rz = lerp(lerp(A.rz, B.rz, ka), C.rz, kb);
    const spread = C.spread * this.e * kb;

    // the configurator yaw (drag / buttons) only applies in the configurator
    const yawWeight = ka * (1 - kb);
    ry += this.yaw * yawWeight;

    // idle sway in the hero (full motion only)
    const swayW = (1 - ka) * (inp.reduced || !this.settings.sway ? 0 : 1);
    if (swayW > 0.001 && inp.inView) {
      ry += Math.sin(inp.elapsed * 0.45) * 0.09 * swayW;
      rx += Math.cos(inp.elapsed * 0.33) * 0.045 * swayW;
      more = true;
    }

    this.root.position.set(x, y, 0);
    this.root.scale.setScalar(s);
    this.root.rotation.set(rx, ry, rz);

    const L = this.layers;
    L.crystal.position.z = LAYER_OFFSETS.crystal * spread;
    L.hands.position.z = LAYER_OFFSETS.hands * spread;
    L.dial.position.z = LAYER_OFFSETS.dial * spread;
    L.movement.position.z = -0.1 + LAYER_OFFSETS.movement * spread;
    L.caseback.position.z = LAYER_OFFSETS.caseback * spread;

    /* strap swap: the halves slide out, change, and slide back */
    if (this.strapK < 1) {
      this.strapK = Math.min(1, this.strapK + dt / 0.7);
      if (this.strapK >= 0.5 && this.pendingStrap) {
        this.strap = this.pendingStrap;
        this.pendingStrap = null;
        this.showStrapKind(this.strap);
      }
      more = true;
    }
    const strapOut = Math.sin(Math.PI * this.strapK) * 0.9 + this.e * kb * 2.6;
    this.strapTop.position.y = strapOut;
    this.strapBottom.position.y = -strapOut;

    /* dial swap: dim, redraw, brighten */
    if (this.dialK < 1) {
      this.dialK = Math.min(1, this.dialK + dt / 0.55);
      if (this.dialK >= 0.5 && this.pendingDial) {
        const d = this.pendingDial;
        this.pendingDial = null;
        this.swapDial(d);
      }
      const dim = 1 - 0.75 * Math.sin(Math.PI * this.dialK);
      this.dialMat.color.setScalar(dim);
      more = true;
    }

    /* metal cross-fade */
    const k = 1 - Math.exp(-7 * dt);
    const cm = this.caseMat;
    const before = cm.color.r + cm.color.g + cm.color.b + cm.roughness + cm.metalness;
    cm.color.lerp(this.caseColor, k);
    this.braceletOuterMat.color.copy(cm.color);
    this.trimMat.color.lerp(this.trimColor, k);
    this.rehautMat.color.lerp(this.rehautColor, k);
    cm.roughness = damp(cm.roughness, this.caseRough, 7, dt);
    cm.metalness = damp(cm.metalness, this.caseMetal, 7, dt);
    this.braceletOuterMat.metalness = cm.metalness;
    this.braceletOuterMat.roughness = Math.min(1, cm.roughness + 0.18);
    if ("clearcoat" in cm) cm.clearcoat = damp(cm.clearcoat, this.caseCoat, 7, dt);
    const after = cm.color.r + cm.color.g + cm.color.b + cm.roughness + cm.metalness;
    const tr = this.trimMat.color;
    if (Math.abs(after - before) > 1e-4 || Math.abs(tr.r - this.trimColor.r) + Math.abs(tr.g - this.trimColor.g) > 1e-3) more = true;

    /* hands: the visitor's local time */
    const local = Date.now() + this.tzOffset;
    const secs = (local / 1000) % 60;
    const whole = Math.floor(secs);
    const frac = secs - whole;
    let sec = whole;
    if (!inp.reduced) {
      // a mechanical tick: jump, overshoot a hair, settle
      const ms = frac * 1000;
      sec += ms > 320 ? 1 : 1 - Math.exp(-ms / 38) * Math.cos(ms / 26);
      sec -= 1;
      if (ms < 320 && inp.inView) more = true;
    }
    this.second.rotation.z = -(sec / 60) * TAU;
    this.minute.rotation.z = -(((local / 60000) % 60) / 60) * TAU;
    this.hour.rotation.z = -(((local / 3600000) % 12) / 12) * TAU;

    /* the movement runs while it is on show */
    if (!inp.reduced && kb > 0.02 && inp.inView) {
      for (const g of this.gears) g.rotation.z += (g.userData.speed as number) * dt * 2.2;
      this.balance.rotation.z = Math.sin(inp.elapsed * TAU * 1.25) * 1.1;
      this.rotor.rotation.z += dt * 0.25;
      more = true;
    }
    return more;
  }

  dispose() {
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}
