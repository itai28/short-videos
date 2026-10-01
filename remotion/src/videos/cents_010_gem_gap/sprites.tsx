import React from "react";

/** Original pixel art for the gem shop. Every sprite is a string map drawn as crisp SVG rects. */

export const C = {
  bg: "#0B0B12",
  night: "#1A0B2E",
  panel: "#12122A",
  panel2: "#1B1B3A",
  edge: "#3B3B7A",
  magenta: "#FF2E88",
  magentaDk: "#B3125C",
  cyan: "#2EF2FF",
  cyanDk: "#109CC0",
  green: "#6CFF6C",
  greenDk: "#22A84A",
  gold: "#FFCC33",
  goldDk: "#C98A00",
  red: "#FF4136",
  redDk: "#A3121C",
  white: "#FFFFFF",
  ink: "#0B0B12",
};

type Pal = Record<string, string>;

/** Modulo that stays positive for negative inputs (the outro runs on negative loop time). */
export const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Draws a pixel map. `px` = size of one pixel on screen. Horizontal runs are merged into one rect. */
export const Sprite: React.FC<{ map: string[]; pal: Pal; px: number; style?: React.CSSProperties }> = ({ map, pal, px, style }) => {
  const w = Math.max(...map.map((r) => r.length));
  const h = map.length;
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let e = x + 1;
      while (e < row.length && row[e] === ch) e++;
      const fill = pal[ch];
      if (fill) rects.push(<rect key={`${y}-${x}`} x={x} y={y} width={e - x} height={1} fill={fill} />);
      x = e;
    }
  });
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{ display: "block", overflow: "visible", ...style }}>
      {rects}
    </svg>
  );
};

// ---------- gems ----------

export const GEM = [
  "..KKKKKKKK..",
  ".KwwcwccCCK.",
  "KwwcccwcCCCK",
  "KLLLLLLLLLLK",
  ".KccwccccCK.",
  "..KcwcccCK..",
  "...KcccCK...",
  "....KcCK....",
  ".....KK.....",
];

const GEM_COLORS: [string, string, string][] = [
  [C.cyan, C.cyanDk, "#9FFBFF"],
  [C.magenta, C.magentaDk, "#FF9CC8"],
  [C.green, C.greenDk, "#C4FFC4"],
];

export const gemPal = (k = 0): Pal => {
  const [c, d, l] = GEM_COLORS[k % GEM_COLORS.length];
  return { K: C.ink, w: "#F4FFFF", c, C: d, L: l };
};

/** A small gem used as the currency symbol next to numbers. */
export const GemIcon: React.FC<{ size: number; k?: number; style?: React.CSSProperties }> = ({ size, k = 0, style }) => (
  <Sprite map={GEM} pal={gemPal(k)} px={size / 12} style={{ display: "inline-block", ...style }} />
);

const PILE_PAL: Pal = {
  K: C.ink, w: "#F4FFFF",
  c: C.cyan, C: C.cyanDk, L: "#9FFBFF",
  p: C.magenta, P: C.magentaDk, Q: "#FF9CC8",
  g: C.green, G: C.greenDk, H: "#C4FFC4",
};
const SWAP: Record<string, string>[] = [
  { c: "c", C: "C", L: "L" },
  { c: "p", C: "P", L: "Q" },
  { c: "g", C: "G", L: "H" },
];

/** Char map for a pyramid of gems: rows = 2 (3 gems), 3 (6), 4 (10), 5 (15). */
export const pileMap = (rows: number): string[] => {
  const gw = 12;
  const gh = 9;
  const dy = 6;
  const W = rows * gw;
  const H = gh + (rows - 1) * dy;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill("."));
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const count = rows - r;
    for (let i = 0; i < count; i++) {
      const ox = (r * gw) / 2 + i * gw;
      const oy = H - gh - r * dy;
      const sw = SWAP[(n * 2 + r) % 3];
      GEM.forEach((row, yy) =>
        row.split("").forEach((ch, xx) => {
          if (ch === ".") return;
          g[oy + yy][ox + xx] = sw[ch] ?? ch;
        }),
      );
      n++;
    }
  }
  return g.map((r) => r.join(""));
};

const PILES = [2, 3, 4, 5].map(pileMap);

/** A pile of gems that grows with the pack size (index 0..3), with one hopping sparkle (2 Hz). */
export const GemPile: React.FC<{ pack: number; px: number; t?: number; style?: React.CSSProperties }> = ({ pack, px, t = 0, style }) => {
  const map = PILES[pack];
  const W = map[0].length;
  const H = map.length;
  const hop = Math.floor(t * 2 + 0.5);
  const sx = 3 + mod(hop * 37 + pack * 11, Math.max(1, W - 6));
  const sy = 2 + mod(hop * 23 + pack * 5, Math.max(1, H - 6));
  return (
    <div style={{ position: "relative", width: W * px, height: H * px, ...style }}>
      <Sprite map={map} pal={PILE_PAL} px={px} />
      <svg width={W * px} height={H * px} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        <g fill="#fff">
          <rect x={sx} y={sy - 1} width={1} height={3} />
          <rect x={sx - 1} y={sy} width={3} height={1} />
        </g>
      </svg>
    </div>
  );
};

// ---------- props ----------

export const HOODIE = [
  ".....KKKKKK.....",
  "....KmmmmmmK....",
  "...KmmKKKKmmK...",
  "...KmKooooKmK...",
  "..KmmKooooKmmK..",
  ".KKmmmKKKKmmmKK.",
  "KmmmmmwmmwmmmmmK",
  "KmmMmmwmmwmmMmmK",
  "KmmMmmmccmmmMmmK",
  "KmmMmmcccCmmMmmK",
  "KmmMmmmcCmmmMmmK",
  "KmmMmmmmmmmmMmmK",
  "KKKKmmmmmmmmKKKK",
  "...KmMMMMMMmK...",
  "...KmmmmmmmmK...",
  "...KKKKKKKKKK...",
];
export const HOODIE_PAL: Pal = { K: "#1A0626", m: C.magenta, M: C.magentaDk, o: "#2A0B3A", w: "#FFFFFF", c: C.cyan, C: C.cyanDk };

export const CROWN = [
  ".K...K...K.",
  "KyK.KyK.KyK",
  "KyyKyyyKyyK",
  "KyyyyyyyyyK",
  "KyrryyyrryK",
  "KyyyyyyyyyK",
  "KYYYYYYYYYK",
  "KKKKKKKKKKK",
];
export const CROWN_PAL: Pal = { K: C.ink, y: C.gold, Y: C.goldDk, r: C.magenta };

export const TROPHY = [
  "..KKKKKKKKKK..",
  "KKKywyyyyyYKKK",
  "KyKywyyyyyYKyK",
  "KyKywyyyyyYKyK",
  ".KKyywyyyyYKK.",
  "...KyyyyyyYK..",
  "....KyyyyYK...",
  ".....KyyYK....",
  "......KYK.....",
  "......KYK.....",
  "....KKKKKK....",
  "...KyyyyyYK...",
  "...KKKKKKKK...",
];
export const TROPHY_PAL: Pal = { K: C.ink, y: C.gold, Y: C.goldDk, w: "#FFF6C8" };

export const VAULT = [
  "KKKKKKKKKKKKKK",
  "KggggggggggggK",
  "KgKKKKKKKKKKgK",
  "KgKddddddddKgK",
  "KgKddKKKKddKgK",
  "KgKdKwwwwKdKgK",
  "KgKdKwKKwKdKgK",
  "KgKdKwKKwKdKgK",
  "KgKdKwwwwKdKgK",
  "KgKddKKKKddKgK",
  "KgKddddddddKgK",
  "KgKKKKKKKKKKgK",
  "KggggggggggggK",
  "KKKKKKKKKKKKKK",
];
export const VAULT_PAL: Pal = { K: C.ink, g: "#8A93B8", d: "#4A5278", w: "#CFD6FF" };

export const LOCK = [
  "..KKKK..",
  ".K....K.",
  ".K....K.",
  "KKKKKKKK",
  "KyyyyyyK",
  "KyyKKyyK",
  "KyyKKyyK",
  "KYYYYYYK",
  "KKKKKKKK",
];
export const LOCK_PAL: Pal = { K: C.ink, y: C.gold, Y: C.goldDk };

// ---------- Centy as a 32x32 sprite ----------

export type PixelExpr = "talk" | "shocked" | "happy";

/** Builds Centy's 32x32 map: coin face, headset, eyes and mouth (0..1 open). */
export const centyMap = (expr: PixelExpr, open: number, blink: boolean): string[] => {
  const N = 32;
  const g: string[][] = Array.from({ length: N }, () => Array(N).fill("."));
  const cx = 15.5;
  const cy = 16.5;
  const R = 13.6;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R + 0.4) continue;
      if (d > R - 0.8) g[y][x] = "K";
      else if (d > R - 2.0) g[y][x] = "Y";
      else {
        const s = -(x - cx) * 0.6 - (y - cy) * 0.8;
        g[y][x] = s > 6.5 ? "h" : s < -6 ? "Y" : "y";
      }
      // inner rim
      if (d > R - 3.2 && d <= R - 2.4) g[y][x] = "Y";
    }
  }
  // shine
  [[8, 8], [9, 7], [10, 6], [11, 6], [7, 9], [7, 10]].forEach(([x, y]) => (g[y][x] = "w"));
  // headset band over the top
  for (let a = 200; a <= 340; a += 2) {
    const r = R + 1.6;
    const x = Math.round(cx + r * Math.cos((a * Math.PI) / 180));
    const y = Math.round(cy + r * Math.sin((a * Math.PI) / 180));
    if (y >= 0 && y < N && x >= 0 && x < N) g[y][x] = "B";
  }
  // ear cups
  for (let y = 13; y <= 20; y++) {
    for (const x of [0, 1, 2, 29, 30, 31]) g[y][x] = x === 1 || x === 30 ? "b" : "B";
  }
  // mic arm
  [[2, 21], [3, 22], [4, 23], [5, 24], [6, 25], [7, 25], [8, 25]].forEach(([x, y]) => (g[y][x] = "B"));
  g[25][9] = "m";
  g[24][9] = "m";
  // eyes
  const eyes = [10, 19];
  if (expr === "happy" || blink) {
    eyes.forEach((ex) => {
      if (expr === "happy") {
        g[14][ex] = "K"; g[13][ex + 1] = "K"; g[12][ex + 2] = "K"; g[13][ex + 3] = "K"; g[14][ex + 4] = "K";
        g[13][ex + 2] = "K";
      } else {
        for (let x = ex; x < ex + 4; x++) g[14][x] = "K";
      }
    });
  } else {
    const tall = expr === "shocked" ? 6 : 5;
    eyes.forEach((ex) => {
      for (let y = 11; y < 11 + tall; y++) for (let x = ex; x < ex + 4; x++) g[y][x] = "K";
      for (let y = 12; y < 10 + tall; y++) for (let x = ex + 1; x < ex + 3; x++) g[y][x] = "w";
      const py = expr === "shocked" ? 13 : 13;
      g[py][ex + 1] = "K";
      g[py + 1][ex + 1] = "K";
      if (expr === "shocked") { g[py][ex + 2] = "K"; g[py + 1][ex + 2] = "K"; g[py][ex + 1] = "w"; }
    });
  }
  // mouth
  if (expr === "shocked") {
    for (let y = 20; y <= 25; y++) for (let x = 13; x <= 18; x++) g[y][x] = "K";
    for (let y = 21; y <= 24; y++) for (let x = 14; x <= 17; x++) g[y][x] = "r";
  } else if (expr === "happy") {
    const top = 20;
    for (let x = 11; x <= 20; x++) g[top][x] = "K";
    for (let x = 12; x <= 19; x++) g[top + 1][x] = "r";
    for (let x = 12; x <= 19; x++) g[top + 2][x] = x === 12 || x === 19 ? "K" : "r";
    for (let x = 13; x <= 18; x++) g[top + 3][x] = "K";
    g[top + 1][11] = "K"; g[top + 1][20] = "K";
  } else {
    const h = Math.round(Math.max(0, Math.min(1, open)) * 3);
    if (h === 0) {
      for (let x = 13; x <= 18; x++) g[21][x] = "K";
    } else {
      for (let y = 20; y <= 21 + h; y++) for (let x = 13; x <= 18; x++) g[y][x] = "K";
      for (let y = 21; y <= 20 + h; y++) for (let x = 14; x <= 17; x++) g[y][x] = "r";
    }
  }
  return g.map((r) => r.join(""));
};

export const CENTY_PAL: Pal = {
  K: "#3A2200",
  Y: C.goldDk,
  y: C.gold,
  h: "#FFE58A",
  w: "#FFFFFF",
  B: "#1D1D28",
  b: C.magenta,
  m: C.cyan,
  r: "#7A1A2E",
};

export const PixelCenty: React.FC<{ px?: number; expr?: PixelExpr; mouth?: number; t?: number; style?: React.CSSProperties }> = ({
  px = 6,
  expr = "talk",
  mouth = 0,
  t = 0,
  style,
}) => {
  const blink = expr === "talk" && mod(t, 3.1) < 0.1;
  return <Sprite map={centyMap(expr, mouth, blink)} pal={CENTY_PAL} px={px} style={style} />;
};
