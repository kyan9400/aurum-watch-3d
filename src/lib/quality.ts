/* Quality tier, decided BEFORE the Canvas exists.
   One throwaway WebGL context tells us whether 3D works at all and which GPU this is.
   Software renderers -> no 3D at all (the poster stays); integrated / mobile GPUs and touch devices -> at most medium.
   ?quality=low|medium|high overrides (and forces the 3D on, even on a software renderer). */

export type Tier = "low" | "medium" | "high";

export type TierSettings = {
  dprCap: number;
  antialias: boolean;
  envResolution: number;
  physicalCrystal: boolean;
  curveSegments: number;
  textureSize: number;
  sway: boolean;
  /** radial segments for the lathed case, bezel, crystal, caseback and dial */
  radial: number;
  /** cross-section segments and path samples for lofted lugs and straps */
  loftRing: number;
  loftSamples: number;
  /** physical case metals with anisotropic brushing + sunburst anisotropy map */
  anisotropy: boolean;
  iridescence: boolean;
  /** blued screws in the movement (chatons and half-hour dots follow the tier too) */
  screws: number;
  chatons: boolean;
  dots: boolean;
  /** perlage texture size on the main plate (0 = flat colour) */
  perlageSize: number;
  sweep: boolean;
  glow: boolean;
  linkSegments: number;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: {
    dprCap: 2, antialias: true, envResolution: 256, physicalCrystal: true, curveSegments: 10, textureSize: 1024, sway: true,
    radial: 192, loftRing: 24, loftSamples: 48, anisotropy: true, iridescence: true, screws: 10, chatons: true, dots: true,
    perlageSize: 1024, sweep: true, glow: true, linkSegments: 4,
  },
  medium: {
    dprCap: 1.5, antialias: true, envResolution: 128, physicalCrystal: false, curveSegments: 6, textureSize: 1024, sway: true,
    radial: 128, loftRing: 16, loftSamples: 32, anisotropy: false, iridescence: false, screws: 6, chatons: true, dots: false,
    perlageSize: 512, sweep: true, glow: false, linkSegments: 2,
  },
  low: {
    dprCap: 1, antialias: false, envResolution: 64, physicalCrystal: false, curveSegments: 3, textureSize: 512, sway: false,
    radial: 72, loftRing: 12, loftSamples: 20, anisotropy: false, iridescence: false, screws: 0, chatons: false, dots: false,
    perlageSize: 0, sweep: false, glow: false, linkSegments: 2,
  },
};

function isTier(v: string | null): v is Tier {
  return v === "low" || v === "medium" || v === "high";
}

function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return String(name || "");
}

/** CPU-only WebGL (SwiftShader, llvmpipe, softpipe, Microsoft Basic Render, Mesa offscreen). */
export const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

function makeContext(attrs: WebGLContextAttributes) {
  try {
    // three r163+ renders with WebGL 2 only, so a WebGL 1-only browser gets the poster instead of a crash
    return document.createElement("canvas").getContext("webgl2", attrs);
  } catch {
    return null;
  }
}

function release(gl: WebGL2RenderingContext) {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** webgl: a WebGL 2 context can be made at all. software: it runs on the CPU, so the 3D is skipped
    (the poster stays) unless ?quality= forces it on. Never imports three. */
export type Probe = { webgl: boolean; software: boolean; forced: boolean; tier: Tier; gpu: string };

export function probeGPU(): Probe {
  let forced: string | null = null;
  try {
    forced = new URLSearchParams(window.location.search).get("quality");
  } catch {
    forced = null;
  }
  const isForced = isTier(forced);

  // failIfMajorPerformanceCaveat refuses software rasterisers in most browsers
  let gl = makeContext({ failIfMajorPerformanceCaveat: true, powerPreference: "high-performance" });
  let caveat = false;
  if (!gl) {
    gl = makeContext({ powerPreference: "high-performance" });
    caveat = !!gl;
  }
  if (!gl) return { webgl: false, software: false, forced: isForced, tier: "low", gpu: "" };

  const gpu = gpuName(gl);
  release(gl);
  const software = caveat || SOFTWARE_GPU.test(gpu);
  if (isTier(forced)) return { webgl: true, software, forced: true, tier: forced, gpu };
  if (software) return { webgl: true, software, forced: false, tier: "low", gpu };

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const touch = window.matchMedia("(pointer: coarse)").matches;

  let tier: Tier = "high";
  if (nav.connection?.saveData || cores <= 2 || memory <= 2) tier = "low";
  else if (touch || cores <= 4 || memory <= 4) tier = "medium";

  if (/intel|uhd|iris|mali|adreno|powervr|apple gpu|radeon(tm)|radeon graphics|vega d/i.test(gpu) && tier === "high")
    tier = "medium";
  return { webgl: true, software, forced: false, tier, gpu };
}

/** Should the 3D chunk load at all? Software renderers get the poster unless ?quality= forces 3D. */
export function wants3D(p: Probe) {
  return p.webgl && (!p.software || p.forced);
}
