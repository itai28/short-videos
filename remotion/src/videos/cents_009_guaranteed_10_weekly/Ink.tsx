import React from "react";
import { Easing, interpolate } from "remotion";
import { noise2D } from "@remotion/noise";
import { evolvePath } from "@remotion/paths";
import { rand } from "../../visuals/util";

// Notebook palette (from the brainstorm visual_style)
export const NAVY = "#1E2A4A";
export const RED = "#E8322A";
export const BLUE = "#3B6FD8";
export const HL = "#FFF27A";
export const PAPER = "#FAF7EE";
export const RULE = "#9CC3E6";
export const MARGIN = "#E85D5D";
export const DESK = "#E4D4B4";

export type Pt = [number, number];
const f = (n: number) => n.toFixed(1);

/** 0..1 progress of an action that starts at `a` and lasts `d` seconds. */
export const prog = (t: number, a: number, d: number, easing: (x: number) => number = Easing.out(Easing.cubic)) =>
  Number.isFinite(a) ? interpolate(t, [a, a + Math.max(0.001, d)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }) : 0;

/** Hand-drawn lines "boil" at 12 fps like real frame-by-frame ink. */
export const boil = (frame: number) => Math.floor(frame / 5);

/** ±amp px noise wobble on every point (stable per point index, changes with the boil step). */
export const jitter = (pts: Pt[], seed: string, step: number, amp = 1.5, key?: (i: number) => number): Pt[] =>
  pts.map(([x, y], i) => {
    const k = key ? key(i) : i * 0.61;
    return [x + amp * noise2D(seed + "x", k, step * 0.73), y + amp * noise2D(seed + "y", k, step * 0.73)];
  });

/** Catmull-Rom spline through the points as an SVG path. */
export const smoothPath = (pts: Pt[]) => {
  if (pts.length === 0) return "";
  if (pts.length < 3) return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L");
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
};

/** A marker rectangle: starts a little past the first corner and overshoots at the end. */
export const roughRect = (x: number, y: number, w: number, h: number, seed: number): Pt[] => {
  const o = (k: number) => (rand(seed * 13 + k) - 0.5) * 8;
  const pts: Pt[] = [[x + 14, y + o(1)]];
  const side = (ax: number, ay: number, bx: number, by: number, k: number) => {
    for (let s = 1; s <= 4; s++) pts.push([ax + ((bx - ax) * s) / 4 + o(k + s) * 0.5, ay + ((by - ay) * s) / 4 + o(k + s + 9) * 0.5]);
  };
  side(x, y, x + w, y + o(2), 10);
  side(x + w, y, x + w + o(3), y + h, 20);
  side(x + w, y + h, x + o(4), y + h, 30);
  side(x, y + h, x + o(5), y - 10, 40);
  pts.push([x + 30, y - 4 + o(6)]);
  return pts;
};

/** A marker loop around something (a bit more than one turn, slightly lopsided). */
export const roughEllipse = (cx: number, cy: number, rx: number, ry: number, seed: number, turns = 1.12, n = 44): Pt[] =>
  Array.from({ length: n + 1 }).map((_, i) => {
    const a = -Math.PI * 0.9 + (i / n) * turns * Math.PI * 2;
    const r = 1 + 0.05 * Math.sin(a * 2 + seed) + 0.04 * (i / n);
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
  });

/** An SVG path that draws itself (p 0..1) in marker. */
export const InkPath: React.FC<{ d: string; p?: number; color?: string; width?: number; opacity?: number; fill?: string; cap?: "round" | "butt" }> = ({
  d,
  p = 1,
  color = NAVY,
  width = 7,
  opacity = 1,
  fill = "none",
  cap = "round",
}) => {
  if (p <= 0 || !d) return null;
  const ev = p < 1 ? evolvePath(p, d) : null;
  return (
    <path
      d={d}
      fill={fill}
      stroke={color}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeLinejoin="round"
      opacity={opacity}
      strokeDasharray={ev?.strokeDasharray}
      strokeDashoffset={ev?.strokeDashoffset}
    />
  );
};

/** Content that writes itself left to right (a slanted wipe), with a faint boil. */
export const Write: React.FC<{ p: number; style?: React.CSSProperties; children: React.ReactNode; step?: number; seed?: string }> = ({ p, style, children, step, seed = "w" }) => {
  if (p <= 0) return null;
  const e = -8 + p * 118;
  const dx = step === undefined ? 0 : 0.7 * noise2D(seed + "dx", step * 0.5, 1);
  const dy = step === undefined ? 0 : 0.7 * noise2D(seed + "dy", step * 0.5, 2);
  return (
    <div
      style={{
        position: "absolute",
        whiteSpace: "nowrap",
        clipPath: p >= 1 ? undefined : `polygon(-10% -40%, ${e + 6}% -40%, ${e}% 140%, -10% 140%)`,
        translate: `${dx}px ${dy}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A highlighter swipe (multiply blend) that grows left to right. */
export const Highlight: React.FC<{ x: number; y: number; w: number; h: number; p: number; rot?: number; color?: string }> = ({ x, y, w, h, p, rot = -1.5, color = HL }) => {
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w * p,
        height: h,
        background: color,
        opacity: 0.92,
        mixBlendMode: "multiply",
        borderRadius: "10px 22px 14px 8px / 18px 10px 22px 12px",
        rotate: `${rot}deg`,
      }}
    />
  );
};

const grainSvg = (alpha: number, tint: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${tint} 0 0 0 0 ${tint} 0 0 0 0 ${tint} 0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
/** Paper / desk grain as a tiled background image (rasterised once by the browser). */
export const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(grainSvg(0.5, "0.32"))}")`;
export const GRAIN_LIGHT = `url("data:image/svg+xml;utf8,${encodeURIComponent(grainSvg(0.28, "0.4"))}")`;

/** The cream desk the photo and the notebook lie on (full frame). */
export const Desk: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: DESK }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.55, mixBlendMode: "multiply" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 45% 40%, rgba(255,250,235,0.55) 0%, rgba(255,250,235,0) 60%), radial-gradient(ellipse 120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(90,60,25,0.35) 100%)",
      }}
    />
  </div>
);

/** Torn notch points along the top edge (page-local coordinates), q = 0..1 tear depth. */
export const tearPoints = (tx: number, q: number): Pt[] => {
  const raw: Pt[] = [
    [-130, 0], [-112, 14], [-96, 8], [-80, 40], [-62, 30], [-48, 74], [-30, 62], [-16, 118], [-4, 104], [6, 168],
    [18, 132], [30, 146], [44, 96], [58, 104], [74, 58], [90, 66], [104, 26], [118, 30], [134, 0],
  ];
  return raw.map(([x, y]) => [tx + x, y * q]);
};

/** A college-ruled notebook page. Local coords: x 0..1080, y 0..height. */
export const NotebookPage: React.FC<{
  left?: number;
  top: number;
  height: number;
  tear?: number; // 0..1
  tearX?: number;
  ruleStart?: number;
  shadow?: boolean;
}> = ({ left = 0, top, height, tear = 0, tearX = 810, ruleStart = 150, shadow = true }) => {
  const tp = tear > 0 ? tearPoints(tearX, tear) : [];
  const poly = tear > 0 ? ["0px 0px", ...tp.map(([x, y]) => `${f(x)}px ${f(y)}px`), "1080px 0px", `1080px ${height}px`, `0px ${height}px`].join(", ") : undefined;
  const holes = [ruleStart + 170, ruleStart + 170 + 640, ruleStart + 170 + 1280, ruleStart + 170 + 1920].filter((y) => y < height - 40);
  return (
    <div style={{ position: "absolute", left, top, width: 1080, height, filter: shadow ? "drop-shadow(0 6px 10px rgba(80,55,20,0.32))" : undefined }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: PAPER,
          clipPath: poly ? `polygon(${poly})` : undefined,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ruleStart,
            bottom: 0,
            backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 61px, ${RULE} 61px, ${RULE} 64px)`,
          }}
        />
        <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 3, background: MARGIN, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 127, top: 0, bottom: 0, width: 2, background: MARGIN, opacity: 0.35 }} />
        {holes.map((y, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 30,
              top: y - 22,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: DESK,
              boxShadow: "inset 0 4px 6px rgba(70,45,15,0.45)",
            }}
          />
        ))}
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN_LIGHT, opacity: 0.5, mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 40%, rgba(120,90,40,0.06) 100%)" }} />
      </div>
      {tear > 0 && (
        <svg width={1080} height={200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={"M" + tp.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} fill="none" stroke="#ffffff" strokeWidth={7} strokeLinejoin="round" opacity={0.95} />
          <path d={"M" + tp.map(([x, y]) => `${f(x + 2)} ${f(y + 5)}`).join(" L")} fill="none" stroke="rgba(150,120,80,0.25)" strokeWidth={3} strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};

/** Paper scraps that burst out of a tear and flutter down. t = seconds since the rip. */
export const Scraps: React.FC<{ x: number; y: number; t: number; n?: number }> = ({ x, y, t, n = 11 }) => {
  if (t < 0) return null;
  return (
    <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const r1 = rand(i * 3 + 1);
        const r2 = rand(i * 7 + 2);
        const r3 = rand(i * 11 + 5);
        const vx = (r1 - 0.5) * 760;
        const vy = -420 - r2 * 520;
        const g = 900;
        const drag = 1 - Math.exp(-t * 2.2);
        const px = x + (vx / 2.2) * drag + 26 * Math.sin(t * (3 + r3 * 2) + i);
        // fall speed is capped (paper floats) once it starts coming down
        const rise = (vy / 2.2) * drag;
        const fall = t > 0.45 ? Math.min(0.5 * g * (t - 0.45) ** 2, 260 * (t - 0.45)) : 0;
        const py = y + rise + fall;
        const s = 26 + r3 * 34;
        const rot = (r3 - 0.5) * 900 * t + i * 40;
        const pts = [
          [-s * 0.5, -s * 0.4],
          [s * 0.45, -s * 0.5],
          [s * 0.55, s * 0.2],
          [s * 0.1, s * 0.55],
          [-s * 0.45, s * 0.35],
        ]
          .map(([a, b]) => `${f(a)},${f(b)}`)
          .join(" ");
        return (
          <g key={i} transform={`translate(${f(px)} ${f(py)}) rotate(${f(rot)}) scale(1 ${f(0.55 + 0.45 * Math.abs(Math.cos(t * 5 + i)))})`}>
            <polygon points={pts} fill={PAPER} stroke="rgba(120,95,60,0.35)" strokeWidth={1.5} />
            <line x1={-s * 0.5} y1={s * 0.05} x2={s * 0.5} y2={-s * 0.05} stroke={RULE} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
};

/** A navy felt-tip marker. The tip sits at (0,0); the body leans up and to the right. */
export const MarkerPen: React.FC<{ x: number; y: number; angle?: number; color?: string; scale?: number }> = ({ x, y, angle = 32, color = NAVY, scale = 1 }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", filter: "drop-shadow(10px 14px 8px rgba(40,30,10,0.28))" }}>
    <g transform={`rotate(${angle}) scale(${scale})`}>
      <path d="M0 0 L-9 -26 L9 -26 Z" fill="#141a2e" />
      <rect x={-15} y={-60} width={30} height={36} rx={6} fill="#cfd3dc" />
      <rect x={-20} y={-300} width={40} height={244} rx={14} fill={color} />
      <rect x={-12} y={-290} width={8} height={224} rx={4} fill="rgba(255,255,255,0.28)" />
      <rect x={-21} y={-110} width={42} height={18} rx={4} fill="#ffffff" opacity={0.9} />
      <rect x={-22} y={-318} width={44} height={30} rx={10} fill="#141a2e" />
    </g>
  </svg>
);

/** A yellow pencil. The point sits at (0,0); the body leans up and to the right. */
export const Pencil: React.FC<{ x: number; y: number; angle?: number }> = ({ x, y, angle = 30 }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", filter: "drop-shadow(12px 16px 9px rgba(40,30,10,0.3))" }}>
    <g transform={`rotate(${angle})`}>
      <path d="M0 0 L-8 -22 L8 -22 Z" fill="#2b2b2b" />
      <path d="M-8 -22 L-19 -62 L19 -62 L8 -22 Z" fill="#F2C89B" />
      <rect x={-19} y={-330} width={38} height={270} fill="#FFC531" />
      <rect x={-19} y={-330} width={11} height={270} fill="#E8A417" />
      <rect x={6} y={-330} width={6} height={270} fill="#FFE07A" />
      <rect x={-20} y={-372} width={40} height={44} rx={3} fill="#B9BEC8" />
      <rect x={-20} y={-362} width={40} height={6} fill="#8E95A3" />
      <rect x={-20} y={-348} width={40} height={6} fill="#8E95A3" />
      <rect x={-19} y={-418} width={38} height={48} rx={10} fill="#F28C9A" />
    </g>
  </svg>
);
