/* Canvas-drawn textures: dial faces, strap leathers, the rotor's Geneva stripes. Nothing is downloaded. */

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { DialOption, StrapOption } from "@/lib/options";

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

export function drawDial(dial: DialOption, size: number, canvas?: HTMLCanvasElement) {
  const c = canvas ?? document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const R = size / 2;
  const fonts = fontFamilies();
  const rand = rng(7);
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
      ctx.globalAlpha = 0.18 + wave * 0.5 + rand() * 0.08;
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
  spacedText(ctx, "AURUM", 0, -R * 0.4, size * 0.012);
  ctx.font = `500 ${Math.round(size * 0.019)}px ${fonts.sans}`;
  ctx.globalAlpha = 0.8;
  spacedText(ctx, "HORLOGERIE  ·  1911", 0, -R * 0.28, size * 0.006);
  ctx.globalAlpha = 1;
  ctx.font = `italic 500 ${Math.round(size * 0.05)}px ${fonts.display}`;
  spacedText(ctx, "Meridian", 0, R * 0.36, size * 0.002);
  ctx.font = `500 ${Math.round(size * 0.018)}px ${fonts.sans}`;
  ctx.globalAlpha = 0.75;
  spacedText(ctx, "AUTOMATIQUE  ·  72 H", 0, R * 0.47, size * 0.006);
  ctx.globalAlpha = 1;

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
