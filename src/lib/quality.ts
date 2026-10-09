/* Quality tier, decided BEFORE the Canvas exists.
   One throwaway WebGL context tells us whether 3D works at all and which GPU this is.
   Software renderers -> low; integrated / mobile GPUs and touch devices -> at most medium.
   ?quality=low|medium|high overrides. */

export type Tier = "low" | "medium" | "high";

export type TierSettings = {
  dprCap: number;
  antialias: boolean;
  envResolution: number;
  physicalCrystal: boolean;
  curveSegments: number;
  textureSize: number;
  sway: boolean;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: { dprCap: 2, antialias: true, envResolution: 256, physicalCrystal: true, curveSegments: 10, textureSize: 1024, sway: true },
  medium: { dprCap: 1.5, antialias: true, envResolution: 128, physicalCrystal: false, curveSegments: 6, textureSize: 1024, sway: true },
  low: { dprCap: 1, antialias: false, envResolution: 64, physicalCrystal: false, curveSegments: 3, textureSize: 512, sway: false },
};

function isTier(v: string | null): v is Tier {
  return v === "low" || v === "medium" || v === "high";
}

function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const name = String(gl.getParameter(gl.RENDERER) || "");
  if (!/^webkit/i.test(name)) return name;
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || name) : name;
}

export type Probe = { webgl: boolean; tier: Tier; gpu: string };

export function probeGPU(): Probe {
  let forced: string | null = null;
  try {
    forced = new URLSearchParams(window.location.search).get("quality");
  } catch {
    forced = null;
  }
  let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    // three r163+ renders with WebGL 2 only, so a WebGL 1-only browser gets the poster instead of a crash
    gl = canvas.getContext("webgl2", { powerPreference: "high-performance" });
  } catch {
    gl = null;
  }
  if (!gl) return { webgl: false, tier: "low", gpu: "" };

  const gpu = gpuName(gl);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (isTier(forced)) return { webgl: true, tier: forced, gpu };

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const touch = window.matchMedia("(pointer: coarse)").matches;

  let tier: Tier = "high";
  if (nav.connection?.saveData || cores <= 2 || memory <= 2) tier = "low";
  else if (touch || cores <= 4 || memory <= 4) tier = "medium";

  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) tier = "low";
  else if (/intel|uhd|iris|mali|adreno|powervr|apple gpu|radeon\(tm\)|radeon graphics|vega \d/i.test(gpu) && tier === "high")
    tier = "medium";
  return { webgl: true, tier, gpu };
}
