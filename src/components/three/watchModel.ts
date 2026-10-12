/* The Meridian watch as a plain three.js object graph.
   React owns the Canvas and the loop; this class owns the meshes, materials and per-frame maths,
   so nothing is allocated inside update(). */

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  TorusGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { TierSettings } from "@/lib/quality";
import { activeLayer, ASSEMBLE_START, LAYER_COUNT, LAYER_SPAN, LAYER_STEP, REVEAL_START, type StagePhases } from "@/lib/stage";
import { findCase, findDial, findStrap, type CaseOption, type DialOption, type StrapOption } from "@/lib/options";
import type { WatchConfig } from "@/lib/store";
import * as G from "./geometry";
import {
  anisotropyDialTexture,
  beamTexture,
  chapterRingTexture,
  crownEmblemTexture,
  drawChapterRing,
  drawDial,
  drawRotor,
  drawStrap,
  engravingTexture,
  makeTexture,
  perlageTexture,
  radialTexture,
  strapTexture,
  sweepTexture,
} from "./textures";

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
type Metal = MeshStandardMaterial | MeshPhysicalMaterial;
type MetalKind = "polished" | "brushed";

const TAU = Math.PI * 2;

/** Let the browser handle input and paint before the next slice of work. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const damp = (cur: number, to: number, lambda: number, dt: number) => cur + (to - cur) * (1 - Math.exp(-lambda * dt));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Ease-out with overshoot: s = 1.04 peaks about 4% past the target. */
const easeOutBack = (t: number, s: number) => {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

/** Exploded-view offsets along the watch axis, in "spread" units.
    Layer order: crystal, hands, dial, case, movement, caseback. */
const LAYER_OFFSETS = [3.0, 2.1, 1.2, 0, -1.25, -2.35];
/** Rough centre height of each layer (for the axis ticks). */
const LAYER_CENTRES = [0.35, 0.16, 0.1, 0, -0.2, -0.3];

/** Choreography of the movement section, written into a preallocated object (no allocations). */
export type Timeline = { layer: Float32Array; seat: Float32Array; open: number; turn: number; turnRaw: number };

export function explodeTimeline(e: number, reduced: boolean, out: Timeline) {
  let open = 0;
  for (let i = 0; i < LAYER_COUNT; i++) {
    // 0.00-0.62: staggered opening, crystal first
    const w = clamp01((e - i * LAYER_STEP) / LAYER_SPAN);
    const o = reduced ? smooth(w) : w <= 0 ? 0 : easeOutBack(w, 1.04);
    // 0.82-1.00: closing in reverse order, caseback first
    const k = LAYER_COUNT - 1 - i;
    const cw = clamp01((e - (ASSEMBLE_START + k * 0.024)) / 0.06);
    out.layer[i] = o * (1 - smooth(cw));
    // a 2% "seat" as each layer lands
    out.seat[i] = reduced ? 0 : Math.sin(Math.PI * cw) * 0.02;
    open = Math.max(open, Math.min(1, out.layer[i]));
  }
  out.open = open;
  // 0.62-0.82: turn to the caseback; ease back to a three-quarter view while it closes
  const turn = smooth(clamp01((e - REVEAL_START) / (ASSEMBLE_START - REVEAL_START)));
  out.turnRaw = turn;
  out.turn = turn * (1 - 0.25 * smooth(clamp01((e - ASSEMBLE_START) / (1 - ASSEMBLE_START))));
  return out;
}

export class WatchModel {
  /** unposed container: the backdrop shadow lives here, the posed watch in `rig` */
  readonly root = new Group();
  private rig = new Group();
  private inner = new Group();
  private layerList: Group[] = [];
  private strapTop = new Group();
  private strapBottom = new Group();
  private hour!: Mesh;
  private minute!: Mesh;
  private second!: Mesh;
  private gears: Mesh[] = [];
  private balance!: Mesh;
  private rotor!: Mesh;
  private rotorSpin = 0.6;

  private geos: BufferGeometry[] = [];
  private mats: Material[] = [];
  private textures: Texture[] = [];

  // metals: polished + brushed (one material on low), all following the case option
  private metals: { m: Metal; kind: MetalKind }[] = [];
  private polishedMat!: Metal;
  private brushedMat!: Metal;
  private trimMat!: MeshStandardMaterial;
  private dialMat!: MeshStandardMaterial | MeshPhysicalMaterial;
  private rehautMat!: MeshStandardMaterial;
  private strapMat!: MeshStandardMaterial;
  private leather: Mesh[] = [];
  private bracelet: InstancedMesh[] = [];

  private dialCanvas!: HTMLCanvasElement;
  private dialTex!: CanvasTexture;
  private strapCanvas!: HTMLCanvasElement;
  private strapTex!: CanvasTexture;
  private rotorTex!: CanvasTexture;

  // exploded view extras
  private axis!: Mesh;
  private ticks!: InstancedMesh;
  private axisMat!: MeshBasicMaterial;
  private tickM = new Matrix4();
  private lift = new Float32Array(LAYER_COUNT);
  private tl: Timeline = { layer: new Float32Array(LAYER_COUNT), seat: new Float32Array(LAYER_COUNT), open: 0, turn: 0, turnRaw: 0 };

  // backdrop shadow, light sweep, glow sprites
  private shadow!: Mesh;
  private shadowMat!: MeshBasicMaterial;
  private sweep: Mesh | null = null;
  private sweepMat: MeshBasicMaterial | null = null;
  private sweepTex: CanvasTexture | null = null;
  private sweepT = -1;
  private glows: Sprite[] = [];
  private wasConfig = false;

  // atmosphere: warm halo, giant engraved chapter ring, a light shaft with drifting dust
  private halo!: Mesh;
  private haloMat!: MeshBasicMaterial;
  private chapter!: Mesh;
  private chapterMat!: MeshBasicMaterial;
  private chapterTex!: CanvasTexture;
  private beam!: Group;
  private beamMat!: MeshBasicMaterial;
  private dust: Points | null = null;
  private dustMat: PointsMaterial | null = null;
  private dustPos: Float32Array | null = null;
  private dustSpeed: Float32Array | null = null;
  private chapterSpin = 0;
  private haloWarm = new Color("#c98a3a");
  private haloCool = new Color("#5d6f8f");
  private haloSoft = new Color("#a8814a");

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
  private mobile = false;

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

  private rays() {
    // with the anisotropic sheen on, the painted rays only need half the strength
    return this.settings.anisotropy ? 0.5 : 1;
  }

  private *build(config: WatchConfig, anisotropy: number): Generator<void, void, void> {
    const settings = this.settings;
    const radial = settings.radial;
    const cs = settings.curveSegments;
    const physical = settings.physicalCrystal;
    const c = findCase(config.case);
    this.dial = findDial(config.dial);
    this.strap = findStrap(config.strap);

    this.root.add(this.rig);
    this.rig.add(this.inner);
    for (let i = 0; i < LAYER_COUNT; i++) {
      const g = new Group();
      this.inner.add(g);
      this.layerList.push(g);
    }
    const [crystalL, handsL, dialL, caseL, mv, back] = this.layerList;
    this.inner.add(this.strapTop, this.strapBottom);

    const geo = <T extends BufferGeometry>(g: T) => {
      this.geos.push(g);
      return g;
    };
    const mat = <T extends Material>(m: T) => {
      this.mats.push(m);
      return m;
    };
    const tex = <T extends Texture>(t: T) => {
      this.textures.push(t);
      return t;
    };

    /* metals */
    this.caseColor.set(c.color);
    this.trimColor.set(c.trim);
    this.caseRough = c.roughness;
    this.caseMetal = c.metalness;
    this.caseCoat = c.clearcoat;
    const metal = (kind: MetalKind, extra: Partial<MeshPhysicalMaterial> = {}) => {
      const rough = this.roughFor(kind, c.roughness);
      const m = settings.anisotropy
        ? new MeshPhysicalMaterial({ color: c.color, metalness: c.metalness, roughness: rough, clearcoat: c.clearcoat, clearcoatRoughness: 0.08 })
        : new MeshStandardMaterial({ color: c.color, metalness: c.metalness, roughness: rough });
      Object.assign(m, extra);
      mat(m);
      this.metals.push({ m, kind });
      return m;
    };
    this.polishedMat = metal("polished");
    // brushed: a rougher twin (medium + high); on high it gets anisotropic brushing from the UVs
    this.brushedMat = settings.perlageSize > 0 ? metal("brushed", settings.anisotropy ? { anisotropy: 0.75, anisotropyRotation: 0 } : {}) : this.polishedMat;
    const metals = [this.polishedMat, this.brushedMat];
    this.trimMat = mat(new MeshStandardMaterial({ color: c.trim, metalness: 1, roughness: 0.12 }));
    const lumeMat = mat(new MeshStandardMaterial({ color: "#E9EFD9", emissive: "#9fd7b0", emissiveIntensity: 0.12, roughness: 0.55, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));

    /* dial */
    this.dialCanvas = drawDial(this.dial, settings.textureSize, undefined, this.rays());
    this.dialTex = tex(makeTexture(this.dialCanvas, anisotropy));
    let aniso: Texture | null = null;
    if (settings.anisotropy) {
      aniso = tex(anisotropyDialTexture(512));
      this.dialMat = mat(
        new MeshPhysicalMaterial({
          map: this.dialTex,
          roughness: this.dial.roughness,
          metalness: this.dial.metalness,
          anisotropyMap: aniso,
          alphaTest: 0.5,
          // never exactly 0: crossing zero would recompile the shader on every dial change
          anisotropy: this.dial.finish === "sunburst" ? 0.8 : 0.001,
        }),
      );
    } else {
      this.dialMat = mat(new MeshStandardMaterial({ map: this.dialTex, roughness: this.dial.roughness, metalness: this.dial.metalness, alphaTest: 0.5 }));
    }
    this.rehautColor.set(this.dial.base).multiplyScalar(0.8);
    this.rehautMat = mat(new MeshStandardMaterial({ color: this.rehautColor.clone(), roughness: 0.5, metalness: 0.2, side: DoubleSide }));

    const crystalMat = mat(
      physical
        ? new MeshPhysicalMaterial({
            color: "#ffffff",
            metalness: 0,
            roughness: 0.02,
            transparent: true,
            opacity: 0.14,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            envMapIntensity: 2.2,
            specularIntensity: 1,
            depthWrite: false,
            ...(settings.iridescence ? { iridescence: 0.35, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 360] as [number, number] } : {}),
          })
        : new MeshStandardMaterial({ color: "#ffffff", metalness: 0.4, roughness: 0.04, transparent: true, opacity: 0.12, envMapIntensity: 2, depthWrite: false }),
    );

    this.strapCanvas = drawStrap(this.strap, settings.textureSize >= 1024 ? 256 : 128);
    this.strapTex = tex(strapTexture(this.strapCanvas, anisotropy));
    this.strapMat = mat(new MeshStandardMaterial({ map: this.strapTex, bumpMap: this.strapTex, bumpScale: 0.6, roughness: 0.62, metalness: 0 }));
    const liningMat = mat(new MeshStandardMaterial({ color: "#C7A27A", roughness: 0.8, metalness: 0 }));

    /* movement materials */
    const perl = settings.perlageSize ? tex(perlageTexture(settings.perlageSize)) : null;
    if (perl) perl.repeat.set(2.5, 2.5);
    const plateMat = mat(
      perl
        ? new MeshStandardMaterial({ color: "#a9aeb5", metalness: 1, roughness: 0.55, map: perl, roughnessMap: perl })
        : new MeshStandardMaterial({ color: "#B7BBC2", metalness: 1, roughness: 0.38 }),
    );
    const gearMat = mat(new MeshStandardMaterial({ color: "#D8A64F", metalness: 1, roughness: 0.26 }));
    const bridgeCapMat = mat(new MeshStandardMaterial({ color: "#C9CDD3", metalness: 1, roughness: 0.32 }));
    const anglageMat = mat(new MeshStandardMaterial({ color: "#EEF0F3", metalness: 1, roughness: 0.08 }));
    const bluedMat = mat(new MeshStandardMaterial({ color: "#2B4C9B", metalness: 1, roughness: 0.25 }));
    const jewelMat = mat(
      physical
        ? new MeshPhysicalMaterial({ color: "#A3192E", metalness: 0, roughness: 0.08, clearcoat: 1, emissive: "#3a0610", emissiveIntensity: 0.6 })
        : new MeshStandardMaterial({ color: "#A3192E", metalness: 0.1, roughness: 0.15, emissive: "#3a0610", emissiveIntensity: 0.6 }),
    );
    this.rotorTex = tex(makeTexture(drawRotor(settings.textureSize / 2), anisotropy));
    this.rotorTex.repeat.set(1 / 1.48, 1 / 1.48);
    this.rotorTex.offset.set(0.5, 0.5);
    const rotorMat = mat(new MeshStandardMaterial({ map: this.rotorTex, metalness: 1, roughness: 0.3 }));

    yield;

    /* case: brushed flank, polished chamfers and bezel */
    caseL.add(new Mesh(geo(G.caseMiddle(radial)), metals));
    caseL.add(new Mesh(geo(G.bezel(radial)), this.polishedMat));
    caseL.add(new Mesh(geo(G.lugs(settings.loftRing, settings.loftSamples)), metals));
    caseL.add(new Mesh(geo(G.crown(radial)), this.polishedMat));
    const emblemTex = tex(crownEmblemTexture(128));
    const emblemMat = metal("polished", { bumpMap: emblemTex, bumpScale: 2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    caseL.add(new Mesh(geo(G.crownEmblem()), emblemMat));
    const spacerMat = mat(new MeshStandardMaterial({ color: "#2a2620", roughness: 0.6, metalness: 0.4 }));
    caseL.add(new Mesh(geo(G.caseSpacer(radial)), spacerMat));

    /* dial */
    const disc = new Mesh(geo(G.dialDisc(radial)), this.dialMat);
    disc.position.z = 0.1;
    dialL.add(disc);
    dialL.add(new Mesh(geo(G.rehaut(radial)), this.rehautMat));
    // open-heart aperture: a polished bezel ring and a short dark sleeve down towards the balance
    const ap = G.APERTURE;
    const apRing = new Mesh(geo(new TorusGeometry(ap.r + 0.004, 0.009, 8, Math.max(32, radial / 2))), this.trimMat);
    apRing.position.set(ap.x, ap.y, 0.104);
    const sleeveGeo = geo(new CylinderGeometry(ap.r, ap.r, 0.12, Math.max(32, radial / 2), 1, true));
    sleeveGeo.rotateX(Math.PI / 2);
    const sleeve = new Mesh(sleeveGeo, mat(new MeshStandardMaterial({ color: "#2b2620", metalness: 1, roughness: 0.3, side: DoubleSide })));
    sleeve.position.set(ap.x, ap.y, 0.04);
    dialL.add(apRing, sleeve);
    const idxM = G.indexMatrices();
    const indices = new InstancedMesh(geo(G.batonIndex()), this.trimMat, idxM.length);
    const lumes = new InstancedMesh(geo(G.indexLume()), lumeMat, idxM.length);
    idxM.forEach((m, i) => {
      indices.setMatrixAt(i, m);
      lumes.setMatrixAt(i, m);
    });
    indices.instanceMatrix.needsUpdate = true;
    lumes.instanceMatrix.needsUpdate = true;
    dialL.add(indices, lumes);
    if (settings.dots) {
      const dm = G.halfHourMatrices();
      const dots = new InstancedMesh(geo(new SphereGeometry(0.014, 16, 10)), this.trimMat, dm.length);
      dm.forEach((m, i) => dots.setMatrixAt(i, m));
      dots.instanceMatrix.needsUpdate = true;
      dialL.add(dots);
    }

    yield;

    /* hands: diamond-cut dauphines with a lume spine */
    this.hour = new Mesh(geo(G.dauphineHand(0.47, 0.045, 0.09, 0.02)), this.trimMat);
    this.hour.add(new Mesh(geo(G.handLume(0.47, 0.045)), lumeMat));
    this.hour.position.z = 0.13;
    this.minute = new Mesh(geo(G.dauphineHand(0.7, 0.036, 0.11, 0.016)), this.trimMat);
    this.minute.add(new Mesh(geo(G.handLume(0.7, 0.036)), lumeMat));
    this.minute.position.z = 0.15;
    this.second = new Mesh(geo(G.secondsHand(cs)), this.trimMat);
    this.second.position.z = 0.172;
    const cap = new Mesh(geo(G.handCap()), this.trimMat);
    cap.position.z = 0.185;
    handsL.add(this.hour, this.minute, this.second, cap);

    /* crystal (+ the light-sweep shell just above it) */
    const crystalGeo = geo(G.crystalDome(radial));
    crystalL.add(new Mesh(crystalGeo, crystalMat));
    crystalL.renderOrder = 2;
    if (settings.sweep) {
      this.sweepTex = tex(sweepTexture(256));
      this.sweepMat = mat(new MeshBasicMaterial({ map: this.sweepTex, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0 }));
      // a lighter copy of the dome is enough for a soft additive band
      const shellBase = G.crystalDome(Math.max(64, radial / 2));
      this.sweep = new Mesh(geo(G.sweepShell(shellBase)), this.sweepMat);
      shellBase.dispose();
      this.sweep.rotation.z = -0.6; // the band crosses the dial diagonally
      this.sweep.renderOrder = 3;
      this.sweep.visible = false;
      crystalL.add(this.sweep);
    }

    yield;

    /* movement */
    mv.position.z = -0.1;
    const movementInner = new Group();
    movementInner.position.z = -0.1;
    mv.add(movementInner);
    movementInner.add(new Mesh(geo(G.mainPlate(radial)), plateMat));
    for (const spec of G.GEARS) {
      const gear = new Mesh(geo(G.gearGeometry(spec, cs)), gearMat);
      gear.position.set(spec.x, spec.y, G.SURFACE.gearBase + spec.z);
      gear.userData.speed = spec.speed;
      this.gears.push(gear);
      movementInner.add(gear);
    }
    const bridges = new Mesh(geo(G.bridgeGeometry(cs)), [bridgeCapMat, anglageMat]);
    bridges.position.z = G.SURFACE.bridgeZ;
    movementInner.add(bridges);
    this.balance = new Mesh(geo(G.balanceWheel(cs)), gearMat);
    this.balance.add(new Mesh(geo(G.hairspring(cs)), bluedMat));
    this.balance.position.set(G.BALANCE.x, G.BALANCE.y, 0.035);
    movementInner.add(this.balance);

    // jewels sit 0.004 proud of whatever they are set into; gold chatons ring them
    const spots = G.jewelSpots();
    const jewels = new InstancedMesh(geo(new SphereGeometry(0.02, 12, 6)), jewelMat, spots.length);
    const chatons = settings.chatons ? new InstancedMesh(geo(new TorusGeometry(0.024, 0.005, 6, 20)), gearMat, spots.length) : null;
    const m4 = new Matrix4();
    spots.forEach((p, i) => {
      m4.makeScale(1, 1, 0.6).setPosition(p.x, p.y, p.z - 0.008);
      jewels.setMatrixAt(i, m4);
      if (chatons) {
        m4.makeTranslation(p.x, p.y, p.z + 0.001);
        chatons.setMatrixAt(i, m4);
      }
    });
    jewels.instanceMatrix.needsUpdate = true;
    movementInner.add(jewels);
    if (chatons) {
      chatons.instanceMatrix.needsUpdate = true;
      movementInner.add(chatons);
    }
    if (settings.screws > 0) {
      const spotsS = G.SCREWS.slice(0, settings.screws);
      const screws = new InstancedMesh(geo(G.screwHead()), bluedMat, spotsS.length);
      spotsS.forEach(([x, y, z], i) => {
        m4.makeRotationZ(i * 1.7).setPosition(x, y, z - 0.002);
        screws.setMatrixAt(i, m4);
      });
      screws.instanceMatrix.needsUpdate = true;
      movementInner.add(screws);
    }

    // ratchet wheel on the back of the plate, sunburst-brushed on high
    const ratchetMat = settings.anisotropy
      ? mat(new MeshPhysicalMaterial({ color: "#d6d9de", metalness: 1, roughness: 0.3, anisotropy: 0.8 }))
      : mat(new MeshStandardMaterial({ color: "#d6d9de", metalness: 1, roughness: 0.3 }));
    if (aniso) {
      // same image as the dial's (a clone shares the GPU upload), re-centred on the wheel's UVs
      const ra = tex(aniso.clone());
      ra.repeat.set(1 / 0.36, 1 / 0.36);
      ra.offset.set(0.5, 0.5);
      (ratchetMat as MeshPhysicalMaterial).anisotropyMap = ra;
    }
    const ratchet = new Mesh(geo(G.ratchetGeometry(cs)), ratchetMat);
    ratchet.position.set(G.RATCHET.x, G.RATCHET.y, G.RATCHET.z);
    movementInner.add(ratchet);

    const rotorGeo = geo(G.rotorGeometry(cs));
    rotorGeo.rotateY(Math.PI); // engraving reads correctly through the caseback
    this.rotor = new Mesh(rotorGeo, rotorMat);
    this.rotor.position.z = -0.1;
    this.rotor.rotation.z = this.rotorSpin;
    movementInner.add(this.rotor);

    yield;

    /* caseback: brushed ring, polished bevel, engraved band, sapphire */
    back.add(new Mesh(geo(G.casebackRing(radial)), metals));
    back.add(new Mesh(geo(G.casebackGlass(radial)), crystalMat));
    const engr = tex(engravingTexture(settings.textureSize, G.ENGRAVING.inner / G.ENGRAVING.outer));
    const engrMat = metal("brushed", {
      bumpMap: engr,
      bumpScale: 1.2,
      roughnessMap: engr,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    back.add(new Mesh(geo(G.casebackEngraving(radial)), engrMat));

    /* technical-drawing axis through the exploded layers */
    this.axisMat = mat(new MeshBasicMaterial({ color: "#D2AE6D", transparent: true, opacity: 0, depthWrite: false }));
    this.axis = new Mesh(geo(G.axisRod()), this.axisMat);
    this.ticks = new InstancedMesh(geo(G.axisTick()), this.axisMat, LAYER_COUNT);
    this.axis.visible = this.ticks.visible = false;
    // its bounding sphere is computed once from the start matrices; the ticks move every frame
    this.ticks.frustumCulled = false;
    this.inner.add(this.axis, this.ticks);

    yield;

    /* straps: padded leather loft (+ keepers) or bracelet links; one of the two is visible */
    const ring = settings.loftRing >= 24 ? 16 : settings.loftRing >= 16 ? 14 : 10;
    const samples = settings.loftSamples;
    const ls = settings.linkSegments;
    const linkGeoC = geo(new RoundedBoxGeometry(0.36, 0.15, 0.1, ls, 0.03));
    const linkGeoO = geo(new RoundedBoxGeometry(0.3, 0.15, 0.085, ls, 0.028));
    for (const sign of [1, -1] as const) {
      const curve = G.strapCurve(sign);
      const holder = sign === 1 ? this.strapTop : this.strapBottom;
      const strap = new Mesh(geo(G.strapLoft(curve, sign, ring, samples, 1.0, 0.82, 0.1, 0.075, (curve.getLength() / 1.0) * 0.25)), [this.strapMat, liningMat]);
      this.leather.push(strap);
      holder.add(strap);
      if (sign === -1) {
        const k = new Mesh(geo(G.keepers(curve, sign, [0.32, 0.42], 1.0, 0.82, 0.1, 0.075, ring)), this.strapMat);
        this.leather.push(k);
        holder.add(k);
      }
      const { centre, outer } = G.braceletMatrices(curve, sign, 0.165);
      const ci = new InstancedMesh(linkGeoC, this.polishedMat, centre.length);
      centre.forEach((m, i) => ci.setMatrixAt(i, m));
      const oi = new InstancedMesh(linkGeoO, this.brushedMat, outer.length);
      outer.forEach((m, i) => oi.setMatrixAt(i, m));
      ci.instanceMatrix.needsUpdate = true;
      oi.instanceMatrix.needsUpdate = true;
      this.bracelet.push(ci, oi);
      holder.add(ci, oi);
    }
    this.showStrapKind(this.strap);

    /* backdrop shadow (all tiers) + glow sprites (high) */
    const soft = tex(radialTexture(256));
    this.shadowMat = mat(new MeshBasicMaterial({ map: soft, color: "#000000", transparent: true, depthWrite: false, opacity: 0.5 }));
    this.shadow = new Mesh(geo(new PlaneGeometry(1, 1)), this.shadowMat);
    this.shadow.renderOrder = -1;
    this.root.add(this.shadow);
    if (settings.glow) {
      const spots2: [Group, number, number, number][] = [
        [caseL, 1.285, 0.03, 0.05],
        [dialL, 0, 0.645, 0.14],
      ];
      for (const [parent, x, y, z] of spots2) {
        const sm = mat(new SpriteMaterial({ map: soft, color: "#ffe9c4", blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.15 }));
        const sp = new Sprite(sm);
        sp.position.set(x, y, z);
        sp.scale.setScalar(0.2);
        parent.add(sp);
        this.glows.push(sp);
      }
    }
    this.buildAtmosphere(soft, geo, mat, tex);
    this.current = config;
  }

  private buildAtmosphere(
    soft: CanvasTexture,
    geo: <T extends BufferGeometry>(g: T) => T,
    mat: <T extends Material>(m: T) => T,
    tex: <T extends Texture>(t: T) => T,
  ) {
    const settings = this.settings;
    const plane = geo(new PlaneGeometry(1, 1));
    // warm studio halo behind the watch
    this.haloMat = mat(new MeshBasicMaterial({ map: soft, color: this.haloWarm.clone(), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.5 }));
    this.halo = new Mesh(plane, this.haloMat);
    this.halo.renderOrder = -3;
    // giant engraved chapter ring, like a tower-clock dial seen in the dark
    this.chapterTex = tex(chapterRingTexture(settings.textureSize >= 1024 ? 2048 : 1024));
    this.chapterMat = mat(new MeshBasicMaterial({ map: this.chapterTex, color: "#D2AE6D", transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.2 }));
    this.chapter = new Mesh(plane, this.chapterMat);
    this.chapter.renderOrder = -2;
    // a slanted light shaft from the upper right, with dust drifting in it (medium + high)
    this.beam = new Group();
    this.beamMat = mat(new MeshBasicMaterial({ map: tex(beamTexture(64, 256)), color: "#ffd9a0", transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.2 }));
    const shaft = new Mesh(plane, this.beamMat);
    shaft.scale.set(2.4, 9, 1);
    shaft.renderOrder = -1;
    this.beam.add(shaft);
    const count = settings.glow ? 160 : settings.sway ? 80 : 0;
    if (count) {
      const pos = new Float32Array(count * 3);
      const speed = new Float32Array(count);
      let seed = 11;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < count; i++) {
        const v = rand();
        pos[i * 3] = (rand() - 0.5) * (0.5 + 1.4 * v);
        pos[i * 3 + 1] = 4.5 - v * 9;
        pos[i * 3 + 2] = (rand() - 0.5) * 1.2;
        speed[i] = 0.05 + rand() * 0.12;
      }
      const g = geo(new BufferGeometry());
      g.setAttribute("position", new BufferAttribute(pos, 3));
      this.dustMat = mat(new PointsMaterial({ map: soft, color: "#ffe3b8", size: 0.045, sizeAttenuation: true, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.7 }));
      this.dust = new Points(g, this.dustMat);
      this.dust.frustumCulled = false;
      this.dustPos = pos;
      this.dustSpeed = speed;
      this.beam.add(this.dust);
    }
    this.root.add(this.halo, this.chapter, this.beam);
  }

  private roughFor(kind: MetalKind, r: number) {
    if (this.polishedMat && this.polishedMat === this.brushedMat) return r;
    return kind === "polished" ? Math.max(0.05, r - 0.06) : Math.min(1, r + 0.12);
  }

  private showStrapKind(strap: StrapOption) {
    const isBracelet = strap.kind === "bracelet";
    this.leather.forEach((m) => (m.visible = !isBracelet));
    this.bracelet.forEach((m) => (m.visible = isBracelet));
    if (!isBracelet) {
      drawStrap(strap, this.strapCanvas.width, this.strapCanvas);
      this.strapTex.needsUpdate = true;
      this.strapMat.roughness = strap.kind === "silk" ? 0.78 : strap.kind === "alligator" ? 0.42 : 0.5;
      // calf leather reads orange under the warm key; a deeper tone keeps it cognac
      this.strapMat.color.setScalar(strap.kind === "leather" ? 0.55 : 1);
      this.strapMat.bumpScale = strap.kind === "alligator" ? 1.4 : strap.kind === "silk" ? 0.4 : 0.6;
    }
  }

  /** Redraw canvas textures once the web fonts have loaded. */
  redrawText() {
    drawDial(this.dial, this.dialCanvas.width, this.dialCanvas, this.rays());
    this.dialTex.needsUpdate = true;
    const rotorCanvas = this.rotorTex.image as HTMLCanvasElement;
    const fresh = drawRotor(rotorCanvas.width);
    rotorCanvas.getContext("2d")!.drawImage(fresh, 0, 0);
    this.rotorTex.needsUpdate = true;
    const cc = this.chapterTex.image as HTMLCanvasElement;
    drawChapterRing(cc.getContext("2d")!, cc.width);
    this.chapterTex.needsUpdate = true;
  }

  /** One pass of light across the crystal (medium + high, full motion only). */
  startSweep(reduced: boolean) {
    if (!this.sweep || reduced) return;
    this.sweepT = 0;
    this.sweep.visible = true;
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
    else if (!prev || prev.case !== config.case || prev.dial !== config.dial) this.startSweep(false);

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
    drawDial(d, this.dialCanvas.width, this.dialCanvas, this.rays());
    this.dialTex.needsUpdate = true;
    this.dialMat.roughness = d.roughness;
    this.dialMat.metalness = d.metalness;
    if (this.dialMat instanceof MeshPhysicalMaterial) this.dialMat.anisotropy = d.finish === "sunburst" ? 0.8 : 0.001;
    this.rehautMat.color.copy(this.rehautColor);
  }

  private snapMaterials() {
    for (const { m, kind } of this.metals) {
      m.color.copy(this.caseColor);
      m.roughness = this.roughFor(kind, this.caseRough);
      m.metalness = this.caseMetal;
      if (m instanceof MeshPhysicalMaterial) m.clearcoat = this.caseCoat;
    }
    this.trimMat.color.copy(this.trimColor);
  }

  addYaw(delta: number) {
    this.yawTarget = Math.max(-Math.PI, Math.min(Math.PI, this.yawTarget + delta));
  }

  private posesFor(vw: number, vh: number, aspect: number) {
    const mobile = aspect < 0.9;
    this.mobile = mobile;
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

    // one light sweep when the configurator comes into view
    const inConfig = this.a > 0.5 && this.b < 0.5;
    if (inConfig && !this.wasConfig) this.startSweep(inp.reduced);
    this.wasConfig = inConfig;

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

    /* exploded view: staggered opening -> caseback reveal -> self-assembly */
    const tl = explodeTimeline(this.e, inp.reduced, this.tl);
    const revealRy = -Math.PI + (this.mobile ? 0.6 : 0.35);
    ry = lerp(ry, revealRy, tl.turn * kb);

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

    this.rig.position.set(x, y, 0);
    this.rig.scale.setScalar(s);
    this.rig.rotation.set(rx, ry, rz);

    // the part in focus lifts a little and grows 3% (opening phase, full motion only)
    const focus = !inp.reduced && kb > 0.5 && this.e > 0.02 && this.e < REVEAL_START ? activeLayer(this.e) : -1;
    const spreadK = C.spread * kb;
    let tickMin = 0;
    let tickMax = 0;
    for (let i = 0; i < LAYER_COUNT; i++) {
      const target = i === focus ? 1 : 0;
      if (inp.reduced) this.lift[i] = 0;
      else {
        const nl = damp(this.lift[i], target, 8, dt);
        if (Math.abs(nl - target) > 1e-3) more = true;
        this.lift[i] = Math.abs(nl - target) > 1e-3 ? nl : target;
      }
      const off = LAYER_OFFSETS[i];
      const z = off * spreadK * tl.layer[i] + Math.sign(off) * 0.06 * this.lift[i] * kb;
      const g = this.layerList[i];
      g.position.z = (i === 4 ? -0.1 : 0) + z;
      g.scale.setScalar(1 + 0.03 * this.lift[i] + tl.seat[i]);
      const tz = g.position.z + LAYER_CENTRES[i];
      this.tickM.makeTranslation(0, 0, tz);
      this.ticks.setMatrixAt(i, this.tickM);
      if (i === 0) tickMax = tz;
      if (i === LAYER_COUNT - 1) tickMin = tz;
    }
    const openAll = tl.open * kb;
    const axisOn = openAll > 0.05;
    this.axis.visible = this.ticks.visible = axisOn;
    if (axisOn) {
      this.axisMat.opacity = Math.min(0.85, (openAll - 0.05) * 2);
      this.axis.position.z = (tickMin + tickMax) / 2;
      this.axis.scale.set(1, 1, Math.max(0.01, tickMax - tickMin + 0.5));
      this.ticks.instanceMatrix.needsUpdate = true;
    }

    // backdrop shadow: follows the watch, fades as the layers spread
    const depth = (7.6 + 2.0) / 7.6;
    this.shadow.position.set(x, y - 0.14 * s, -2.0 * s);
    this.shadow.scale.set(2.7 * s * depth, 4.3 * s * depth, 1);
    this.shadowMat.opacity = 0.5 * (1 - openAll);
    this.shadow.visible = this.shadowMat.opacity > 0.01;

    /* atmosphere: each chapter gets its own light */
    const alive = !inp.reduced && inp.inView && this.settings.sway;
    const hero = (1 - ka) * (1 - kb);
    const cfg = ka * (1 - kb);
    const dBack = (7.6 + 2.6) / 7.6;
    this.halo.position.set(x * dBack, y * dBack + 0.1 * s, -2.6);
    const haloSize = (5.2 + 1.2 * kb) * s * dBack;
    this.halo.scale.set(haloSize, haloSize, 1);
    this.haloMat.color.copy(this.haloWarm).lerp(this.haloSoft, cfg).lerp(this.haloCool, kb);
    this.haloMat.opacity = 0.5 * hero + 0.32 * cfg + 0.42 * kb;

    const dRing = (7.6 + 2.4) / 7.6;
    this.chapter.position.set(x * dRing, y * dRing, -2.4);
    const ringSize = (4.3 * hero + 3.6 * cfg + 5.2 * kb) * s * dRing;
    this.chapter.scale.set(ringSize, ringSize, 1);
    if (alive) {
      this.chapterSpin += dt * 0.02;
      more = true;
    }
    this.chapter.rotation.set(-0.5 * hero - 0.15 * cfg + 0.25 * kb, 0.42 * hero - 0.2 * cfg - 0.3 * kb, this.chapterSpin + (inp.reduced ? 0 : this.e * 1.2));
    this.chapterMat.opacity = 0.2 * hero + 0.1 * cfg + 0.26 * kb;

    this.beamMat.opacity = 0.32 * hero + 0.1 * cfg;
    this.beam.visible = this.beamMat.opacity > 0.01;
    if (this.beam.visible) {
      const dB = (7.6 + 1.3) / 7.6;
      const bx = this.mobile ? 0.9 : 1.1;
      // the shaft's axis leans to the upper right and passes through the watch
      this.beam.position.set((x + bx * 0.74 * s) * dB, (y + 1.9 * s) * dB, -1.3);
      this.beam.rotation.set(0, 0, -0.38);
      this.beam.scale.setScalar(Math.max(0.8, s));
      if (this.dust && this.dustPos && this.dustSpeed && this.dustMat) {
        this.dustMat.opacity = Math.min(1, this.beamMat.opacity * 4);
        if (alive) {
          const p = this.dustPos;
          const sp = this.dustSpeed;
          const tt = inp.elapsed;
          for (let i = 0; i < sp.length; i++) {
            let yy = p[i * 3 + 1] - sp[i] * dt;
            if (yy < -4.5) yy += 9;
            p[i * 3 + 1] = yy;
            p[i * 3] += Math.sin(tt * 0.6 + i) * 0.012 * dt;
          }
          (this.dust.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
        }
      }
    }

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
    const strapOut = Math.sin(Math.PI * this.strapK) * 0.9 + openAll * 2.6;
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

    /* metal cross-fade (all metal materials follow the case option) */
    const k = 1 - Math.exp(-7 * dt);
    let moving = false;
    for (const { m, kind } of this.metals) {
      const before = m.color.r + m.color.g + m.color.b + m.roughness + m.metalness;
      m.color.lerp(this.caseColor, k);
      m.roughness = damp(m.roughness, this.roughFor(kind, this.caseRough), 7, dt);
      m.metalness = damp(m.metalness, this.caseMetal, 7, dt);
      if (m instanceof MeshPhysicalMaterial) m.clearcoat = damp(m.clearcoat, this.caseCoat, 7, dt);
      const after = m.color.r + m.color.g + m.color.b + m.roughness + m.metalness;
      if (Math.abs(after - before) > 1e-4) moving = true;
    }
    this.trimMat.color.lerp(this.trimColor, k);
    this.rehautMat.color.lerp(this.rehautColor, k);
    const tr = this.trimMat.color;
    if (moving || Math.abs(tr.r - this.trimColor.r) + Math.abs(tr.g - this.trimColor.g) > 1e-3) more = true;

    /* light sweep across the crystal, and the glow sprites pulse with it */
    let pulse = 0;
    if (this.sweepT >= 0 && this.sweep && this.sweepMat && this.sweepTex) {
      this.sweepT += dt / 0.9;
      if (this.sweepT >= 1 || inp.reduced) {
        this.sweepT = -1;
        this.sweep.visible = false;
        this.sweepMat.opacity = 0;
      } else {
        const p = smooth(this.sweepT);
        this.sweepTex.offset.x = lerp(0.62, -0.62, p);
        pulse = Math.sin(Math.PI * this.sweepT);
        this.sweepMat.opacity = 0.75 * pulse;
        more = true;
      }
    }
    for (const g of this.glows) (g.material as SpriteMaterial).opacity = 0.15 + 0.55 * pulse;

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

    /* the movement runs while it is on show; the rotor makes half a turn during the caseback reveal */
    if (!inp.reduced && inp.inView && (kb > 0.02 || swayW > 0.001)) {
      for (const g of this.gears) g.rotation.z += (g.userData.speed as number) * dt * 2.2;
      // 28,800 vph is 4 Hz; shown at 2.5 Hz so the eye can follow the swing through the open heart
      this.balance.rotation.z = Math.sin(inp.elapsed * TAU * 2.5) * 1.6;
      this.rotorSpin += dt * 0.25;
      more = true;
    }
    this.rotor.rotation.z = this.rotorSpin + (inp.reduced ? 0 : Math.PI * tl.turnRaw);
    return more;
  }

  dispose() {
    // instanced meshes own GPU buffers for their matrices
    this.root.traverse((o) => {
      if (o instanceof InstancedMesh) o.dispose();
    });
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}
