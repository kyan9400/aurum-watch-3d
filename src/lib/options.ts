export type CaseId = "yellow" | "rose" | "steel" | "ceramic";
export type DialId = "enamel" | "midnight" | "forest" | "salmon";
export type StrapId = "cognac" | "alligator" | "bracelet" | "silk";

export type CaseOption = {
  id: CaseId;
  label: string;
  short: string;
  price: number;
  /** body colour of the case */
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  /** hands + indices */
  trim: string;
  swatch: string;
};

export type DialOption = {
  id: DialId;
  label: string;
  short: string;
  price: number;
  base: string;
  accent: string;
  ink: string;
  finish: "enamel" | "sunburst" | "grained" | "opaline";
  roughness: number;
  metalness: number;
  swatch: string;
};

export type StrapOption = {
  id: StrapId;
  label: string;
  short: string;
  price: number;
  color: string;
  stitch: string;
  kind: "leather" | "alligator" | "bracelet" | "silk";
  swatch: string;
};

export const BASE_PRICE = 8400;

export const CASES: CaseOption[] = [
  { id: "yellow", label: "18k Yellow Gold", short: "Yellow gold", price: 6200, color: "#E3B866", metalness: 1, roughness: 0.2, clearcoat: 0, trim: "#F0CD84", swatch: "linear-gradient(135deg,#f6dc9c,#c8973f 60%,#8e6522)" },
  { id: "rose", label: "18k Rose Gold", short: "Rose gold", price: 6600, color: "#E7A58A", metalness: 1, roughness: 0.2, clearcoat: 0, trim: "#F2BBA1", swatch: "linear-gradient(135deg,#f7ccb8,#d48f72 60%,#9a5b44)" },
  { id: "steel", label: "904L Steel", short: "Steel", price: 0, color: "#D9DCE0", metalness: 1, roughness: 0.17, clearcoat: 0, trim: "#EEF0F2", swatch: "linear-gradient(135deg,#f4f6f8,#a9adb3 60%,#6c7077)" },
  { id: "ceramic", label: "Black Ceramic", short: "Black ceramic", price: 2400, color: "#161616", metalness: 0.15, roughness: 0.28, clearcoat: 1, trim: "#D2AE6D", swatch: "linear-gradient(135deg,#4a4a4a,#151515 55%,#000)" },
];

export const DIALS: DialOption[] = [
  { id: "enamel", label: "Ivory Grand Feu enamel", short: "Ivory enamel", price: 1900, base: "#F1EADB", accent: "#E4DAC4", ink: "#1C1A17", finish: "enamel", roughness: 0.12, metalness: 0, swatch: "radial-gradient(circle at 35% 30%,#fffaf0,#e9dfca)" },
  { id: "midnight", label: "Midnight sunburst", short: "Midnight sunburst", price: 0, base: "#14213F", accent: "#2C4479", ink: "#E9E3D6", finish: "sunburst", roughness: 0.32, metalness: 0.35, swatch: "conic-gradient(from 20deg,#0e1830,#2c4479,#0e1830,#24396a,#0e1830)" },
  { id: "forest", label: "Forest grained", short: "Forest grained", price: 400, base: "#1F3A2C", accent: "#2E5541", ink: "#ECE5D4", finish: "grained", roughness: 0.62, metalness: 0.1, swatch: "radial-gradient(circle at 35% 30%,#3b6a51,#16291f)" },
  { id: "salmon", label: "Salmon opaline", short: "Salmon opaline", price: 600, base: "#E6A98E", accent: "#F0BFA7", ink: "#2A1A14", finish: "opaline", roughness: 0.5, metalness: 0.05, swatch: "radial-gradient(circle at 35% 30%,#f6c8b2,#d9947a)" },
];

export const STRAPS: StrapOption[] = [
  { id: "cognac", label: "Cognac calf leather", short: "Cognac leather", price: 0, color: "#8A4B26", stitch: "#E8D6B5", kind: "leather", swatch: "linear-gradient(135deg,#a8622f,#6e3818)" },
  { id: "alligator", label: "Black alligator", short: "Black alligator", price: 900, color: "#1A1714", stitch: "#3A332B", kind: "alligator", swatch: "repeating-linear-gradient(90deg,#1b1815 0 6px,#2b2620 6px 7px)" },
  { id: "bracelet", label: "Meridian bracelet", short: "Bracelet", price: 2100, color: "#D9DCE0", stitch: "#000000", kind: "bracelet", swatch: "repeating-linear-gradient(90deg,#c9ccd1 0 5px,#8b9097 5px 6px,#eef0f2 6px 12px,#8b9097 12px 13px)" },
  { id: "silk", label: "Navy woven silk", short: "Navy silk", price: 150, color: "#1E2A4A", stitch: "#C9A46A", kind: "silk", swatch: "repeating-linear-gradient(45deg,#1e2a4a 0 3px,#2c3b63 3px 6px)" },
];

export const findCase = (id: CaseId) => CASES.find((c) => c.id === id) ?? CASES[0];
export const findDial = (id: DialId) => DIALS.find((d) => d.id === id) ?? DIALS[0];
export const findStrap = (id: StrapId) => STRAPS.find((s) => s.id === id) ?? STRAPS[0];

export const formatPrice = (n: number) => "€" + n.toLocaleString("en-US");
