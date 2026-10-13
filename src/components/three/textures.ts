/* Canvas-drawn textures: dial faces, strap leathers, the rotor's Geneva stripes. Nothing is downloaded. */

import { CanvasTexture, ClampToEdgeWrapping, NoColorSpace, RepeatWrapping, SRGBColorSpace } from "three";
import type { DialOption, StrapOption } from "@/lib/options";
import { APERTURE } from "./geometry";

/** Small deterministic random so textures look the same on every visit. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function fontFamilies() {
  return {
    display: cssVar("--ff-display", "Georgia, serif"),
    sans: cssVar("--ff-sans", "system-ui, sans-serif"),
  };
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
}

/** rays: strength of the painted sunburst rays (lower when the anisotropic sheen does the work). */
export function drawDial(dial: DialOption, size: number, canvas?: HTMLCanvasElement, rays = 1) {
  const c = canvas ?? document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const R = size / 2;
  const fonts = fontFamilies();
  const rand = rng(7);
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(R, R);

  // base finish
  ctx.fillStyle = dial.base;
  ctx.fillRect(-R, -R, size, size);
  if (dial.finish === "sunburst") {
    const n = 180;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      // brightness follows a slow wave so the rays catch "light" on two sides
      const wave = 0.5 + 0.5 * Math.cos(a0 * 2 - 0.6);
      ctx.globalAlpha = (0.18 + wave * 0.5 + rand() * 0.08) * rays;
      ctx.fillStyle = dial.accent;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R * 1.5, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, size, size);
  } else if (dial.finish === "enamel") {
    const g = ctx.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R);
    g.addColorStop(0, "#FFFBF2");
    g.addColorStop(0.7, dial.base);
    g.addColorStop(1, dial.accent);
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, size, size);
  } else {
    const g = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
    g.addColorStop(0, dial.accent);
    g.addColorStop(1, dial.base);
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, size, size);
    const grains = dial.finish === "grained" ? 26000 : 9000;
    const scale = size / 1024;
    for (let i = 0; i < grains; i++) {
      const x = (rand() * 2 - 1) * R;
      const y = (rand() * 2 - 1) * R;
      ctx.globalAlpha = 0.05 + rand() * 0.08;
      ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000";
      const s = (dial.finish === "grained" ? 1.6 : 1) * scale;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // edge shadow under the chapter ring
  const edge = ctx.createRadialGradient(0, 0, R * 0.86, 0, 0, R);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = edge;
  ctx.fillRect(-R, -R, size, size);

  // railway minute track
  ctx.strokeStyle = dial.ink;
  ctx.fillStyle = dial.ink;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(1, size / 900);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.955, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.905, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const five = i % 5 === 0;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-(five ? 2.4 : 1.1) * (size / 1024), -R * 0.955, (five ? 4.8 : 2.2) * (size / 1024), R * (five ? 0.07 : 0.05));
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // brand
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(size * 0.07)}px ${fonts.display}`;
  spacedText(ctx, "AURUM", 0, -R * 0.5, size * 0.012);
  ctx.font = `500 ${Math.round(size * 0.019)}px ${fonts.sans}`;
  ctx.globalAlpha = 0.8;
  spacedText(ctx, "HORLOGERIE  ·  1911", 0, -R * 0.385, size * 0.006);
  ctx.globalAlpha = 1;
  ctx.font = `italic 500 ${Math.round(size * 0.042)}px ${fonts.display}`;
  spacedText(ctx, "Meridian", 0, -R * 0.29, size * 0.002);

  // open-heart aperture at 6 o'clock: a bevelled shadow ring, then cut through (alphaTest drops it)
  const ax = (APERTURE.x / 0.805) * R;
  const ay = (-APERTURE.y / 0.805) * R;
  const ar = (APERTURE.r / 0.805) * R;
  const ring = ctx.createRadialGradient(ax, ay, ar, ax, ay, ar * 1.16);
  ring.addColorStop(0, "rgba(0,0,0,0.55)");
  ring.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(ax, ay, ar * 1.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // date window at 3 o'clock
  const day = new Date().getDate();
  const wx = R * 0.6;
  const ww = size * 0.075;
  const wh = size * 0.06;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(wx - ww / 2 - 3, -wh / 2 - 3, ww + 6, wh + 6);
  ctx.fillStyle = "#F7F2E8";
  ctx.fillRect(wx - ww / 2, -wh / 2, ww, wh);
  ctx.fillStyle = "#1C1A17";
  ctx.font = `600 ${Math.round(size * 0.042)}px ${fonts.sans}`;
  ctx.textAlign = "center";
  ctx.fillText(String(day), wx, size * 0.002);

  ctx.restore();
  return c;
}

export function makeTexture(canvas: HTMLCanvasElement, anisotropy: number) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

/** Strap surface: u across the width, v along the length (the canvas is 1 : 4, so it covers four widths). */
export function drawStrap(strap: StrapOption, width: number, canvas?: HTMLCanvasElement) {
  const c = canvas ?? document.createElement("canvas");
  const W = width;
  const H = width * 4;
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rand = rng(strap.kind.length * 31 + 3);
  ctx.fillStyle = strap.color;
  ctx.fillRect(0, 0, W, H);

  if (strap.kind === "leather") {
    for (let i = 0; i < 9000; i++) {
      ctx.globalAlpha = 0.05 + rand() * 0.07;
      ctx.fillStyle = rand() > 0.55 ? "#000" : "#fff";
      ctx.beginPath();
      ctx.arc(rand() * W, rand() * H, 0.6 + rand() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (strap.kind === "alligator") {
    // tile scales: bigger in the middle, smaller toward the edges
    let y = 0;
    while (y < H) {
      const rowH = W * (0.09 + rand() * 0.05);
      let x = 0;
      while (x < W) {
        const centre = 1 - Math.abs(x / W - 0.5) * 1.6;
        const cw = W * (0.08 + centre * 0.12) * (0.8 + rand() * 0.4);
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(${40 + rand() * 18},${35 + rand() * 14},${30 + rand() * 10},1)`;
        const r = Math.min(cw, rowH) * 0.3;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, cw - 3, rowH - 3, r);
        ctx.fill();
        x += cw;
      }
      y += rowH;
    }
    ctx.globalAlpha = 1;
  } else if (strap.kind === "silk") {
    ctx.lineWidth = 2;
    for (let i = -H; i < H * 2; i += 6) {
      ctx.strokeStyle = i % 12 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i + W * 0.6);
      ctx.stroke();
    }
    ctx.fillStyle = strap.stitch;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(W * 0.47, 0, W * 0.06, H);
    ctx.globalAlpha = 1;
  }

  // darker burnished edges
  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.45)");
  edge.addColorStop(0.07, "rgba(0,0,0,0)");
  edge.addColorStop(0.93, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);

  // saddle stitching
  if (strap.kind !== "silk") {
    ctx.fillStyle = strap.stitch;
    const step = W * 0.06;
    for (const u of [0.1, 0.9]) {
      for (let v = 0; v < H; v += step) {
        ctx.save();
        ctx.translate(W * u, v);
        ctx.rotate(0.35);
        ctx.fillRect(-W * 0.006, 0, W * 0.012, step * 0.6);
        ctx.restore();
      }
    }
  }
  return c;
}

export function strapTexture(canvas: HTMLCanvasElement, anisotropy: number) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.anisotropy = anisotropy;
  return t;
}

/** Geneva stripes + engraving for the rotor (UVs of an extruded shape are its x/y in units). */
export function drawRotor(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const fonts = fontFamilies();
  ctx.fillStyle = "#C99A4E";
  ctx.fillRect(0, 0, size, size);
  const stripe = size / 14;
  for (let i = -2; i < 18; i++) {
    const g = ctx.createLinearGradient(i * stripe, 0, (i + 1) * stripe, 0);
    g.addColorStop(0, "rgba(255,240,200,0.0)");
    g.addColorStop(0.5, "rgba(255,240,200,0.35)");
    g.addColorStop(1, "rgba(80,50,10,0.25)");
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.5);
    ctx.translate(-size / 2, -size / 2);
    ctx.fillRect(i * stripe, -size, stripe, size * 3);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(60,36,8,0.75)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(size * 0.07)}px ${fonts.display}`;
  // the canvas is mapped upside down relative to the rotor's half-disc, so draw in the upper half
  spacedText(ctx, "AURUM", size / 2, size * 0.3, size * 0.012);
  ctx.font = `500 ${Math.round(size * 0.028)}px ${fonts.sans}`;
  spacedText(ctx, "CALIBRE AU-28 · 31 JEWELS", size / 2, size * 0.38, size * 0.005);
  return c;
}

/* ---------- data textures (linear, not colour) ---------- */

function dataTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c);
  t.colorSpace = NoColorSpace;
  t.wrapS = t.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  return t;
}

/** Sunburst brushing direction for a planar-UV disc: RG = tangent direction (-sin, cos) in 0..1, B = strength. */
export function anisotropyDialTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let py = 0; py < size; py++) {
    // canvas rows run top-down, UV v runs bottom-up
    const y = 1 - (py + 0.5) / size - 0.5;
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) / size - 0.5;
      const a = Math.atan2(y, x);
      const k = (py * size + px) * 4;
      d[k] = Math.round((-Math.sin(a) * 0.5 + 0.5) * 255);
      d[k + 1] = Math.round((Math.cos(a) * 0.5 + 0.5) * 255);
      d[k + 2] = 255;
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return dataTexture(c);
}

/** Perlage: overlapping circular grains on a tileable grid (used as map + roughnessMap). */
export function perlageTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c4c8ce";
  ctx.fillRect(0, 0, size, size);
  const n = 14;
  const step = size / n;
  const r = step * 0.92;
  const conic = typeof ctx.createConicGradient === "function";
  for (let row = -1; row <= n + 1; row++) {
    for (let col = -1; col <= n + 1; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      const y = row * step;
      let g: CanvasGradient;
      if (conic) {
        g = ctx.createConicGradient(0.6 + ((row * 7 + col * 3) % 5) * 0.08, x, y);
        g.addColorStop(0, "#f1f3f6");
        g.addColorStop(0.25, "#9ba1a9");
        g.addColorStop(0.5, "#eceff2");
        g.addColorStop(0.75, "#8f959d");
        g.addColorStop(1, "#f1f3f6");
      } else {
        g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, "#f1f3f6");
        g.addColorStop(1, "#8f959d");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,64,70,0.35)";
      ctx.lineWidth = Math.max(1, size / 512);
      ctx.stroke();
    }
  }
  return dataTexture(c, true);
}

/** Caseback engraving for a ring with planar UVs. R = height (bump, text recessed), G = roughness (text frosted). */
export function engravingTexture(size: number, innerRatio: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const fonts = fontFamilies();
  const R = size / 2;
  ctx.fillStyle = "rgb(255,150,0)";
  ctx.fillRect(0, 0, size, size);
  ctx.translate(R, R);
  // two fine rules framing the text band
  ctx.strokeStyle = "rgb(90,255,0)";
  ctx.lineWidth = Math.max(1, size / 400);
  for (const k of [innerRatio + 0.02, 0.975]) {
    ctx.beginPath();
    ctx.arc(0, 0, R * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  const text = "AURUM HORLOGERIE · MERIDIAN 39 · SAPHIR · 50 M · Nº 0147 / 340 · SIGNÉ À LA MAIN · ";
  const radius = R * (innerRatio + 0.975) * 0.5;
  ctx.font = `600 ${Math.round(R * 0.075)}px ${fonts.sans}`;
  ctx.fillStyle = "rgb(60,255,0)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  // spread the line evenly around the full circle
  const scale = (Math.PI * 2 * radius) / total;
  let a = -Math.PI / 2;
  chars.forEach((ch, i) => {
    const w = widths[i] * scale;
    const mid = a + w / 2 / radius;
    ctx.save();
    ctx.rotate(mid + Math.PI / 2);
    ctx.fillText(ch, 0, -radius);
    ctx.restore();
    a += w / radius;
  });
  return dataTexture(c);
}

/** Crown emblem: a raised "A" (R channel = height). */
export function crownEmblemTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const fonts = fontFamilies();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(size * 0.62)}px ${fonts.display}`;
  ctx.fillText("A", size / 2, size * 0.54);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  return dataTexture(c);
}

/** Soft radial falloff: the backdrop shadow and the glow sprites share it. */
export function radialTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A narrow bright band for the light sweep; moved by texture offset. */
export function sweepTexture(width: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  g.addColorStop(0.49, "rgba(255,246,228,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(0.53, "rgba(255,246,228,0.55)");
  g.addColorStop(0.62, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, 4);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  return t;
}

/** Giant engraved chapter ring for the backdrop: rings, a rose-engine guilloché band, minute track and Roman hours.
    White on transparent; tinted and faded by the material. */
export function chapterRingTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  drawChapterRing(ctx, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function drawChapterRing(ctx: CanvasRenderingContext2D, size: number) {
  const R = size / 2;
  const px = size / 1024;
  const fonts = fontFamilies();
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(R, R);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  const circle = (r: number, w: number, a: number) => {
    ctx.globalAlpha = a;
    ctx.lineWidth = w * px;
    ctx.beginPath();
    ctx.arc(0, 0, r * R, 0, Math.PI * 2);
    ctx.stroke();
  };
  circle(0.985, 2.2, 0.9);
  circle(0.955, 1, 0.6);
  circle(0.79, 1, 0.5);
  circle(0.6, 1.6, 0.7);
  circle(0.36, 1, 0.45);
  // minute track
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const major = i % 20 === 0;
    const mid = i % 4 === 0;
    ctx.save();
    ctx.rotate(a);
    ctx.globalAlpha = major ? 0.95 : mid ? 0.6 : 0.3;
    const len = major ? 0.06 : mid ? 0.03 : 0.015;
    const w = (major ? 3 : 1.2) * px;
    ctx.fillRect(-w / 2, -0.955 * R, w, len * R);
    ctx.restore();
  }
  // Roman hours
  const romans = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  ctx.font = `500 ${Math.round(size * 0.05)}px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.75;
  romans.forEach((r, i) => {
    ctx.save();
    ctx.rotate((i / 12) * Math.PI * 2);
    ctx.fillText(r, 0, -0.85 * R);
    ctx.restore();
  });
  // rose-engine guilloché band between 0.38 and 0.58
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1 * px;
  const n = 96;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 0.48 * R, Math.sin(a) * 0.48 * R, 0.1 * R, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** A soft studio light shaft: bright at the top, fading down, gaussian across. */
export function beamTexture(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const along = Math.pow(1 - v, 1.6) * (0.25 + 0.75 * Math.min(1, v * 6));
    // the shaft widens as it falls
    const spread = 0.16 + 0.26 * v;
    for (let x = 0; x < w; x++) {
      const u = (x / (w - 1)) * 2 - 1;
      const across = Math.exp(-(u * u) / (2 * spread * spread));
      const a = Math.round(255 * along * across);
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  return t;
}
