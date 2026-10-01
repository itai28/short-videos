import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DISPLAY, MONO, PLAYFAIR } from "../../fonts";
import { VisualProps } from "../../types";
import { clamp01, popIn, rand, useT } from "../../visuals/util";
import { GalleryView } from "./Gallery";
import { BRASS, BRASS_HI, BRASS_LO, COPPER, CREAM, GOLD, INK, LINING, RED, SPOT } from "./palette";

// ---------- isometric helpers (world units -> screen px) ----------
const C30 = Math.cos(Math.PI / 6);
const S = 1.0;
const OX = 397;
const OY = 786;
const P = (x: number, y: number, z: number): [number, number] => [OX + (x - y) * C30 * S, OY + ((x + y) / 2 - z) * S];
const pts = (...ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const RX = 1.2247 * S; // horizontal circle radius r -> ellipse rx = r * RX
const RY = 0.7071 * S;

const Box: React.FC<{ x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; top: string; left: string; right: string; edge?: number }> = ({ x0, x1, y0, y1, z0, z1, top, left, right, edge = 0.35 }) => (
  <g>
    <polygon points={pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0))} fill={left} />
    <polygon points={pts(P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0))} fill={right} />
    <polygon points={pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1))} fill={top} />
    <polyline points={pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1))} fill="none" stroke={SPOT} strokeOpacity={edge} strokeWidth={2.5} strokeLinejoin="round" />
  </g>
);

const Cyl: React.FC<{ cx: number; cy: number; r: number; z0: number; z1: number; body: string; top: string; stroke?: string }> = ({ cx, cy, r, z0, z1, body, top, stroke }) => {
  const [sx, syT] = P(cx, cy, z1);
  const [, syB] = P(cx, cy, z0);
  const rx = r * RX;
  const ry = r * RY;
  return (
    <g>
      <path d={`M ${sx - rx} ${syT} L ${sx - rx} ${syB} A ${rx} ${ry} 0 0 0 ${sx + rx} ${syB} L ${sx + rx} ${syT} Z`} fill={body} />
      <ellipse cx={sx} cy={syT} rx={rx} ry={ry} fill={top} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
    </g>
  );
};

const gearPath = (r: number, n: number, depth: number) => {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wi = (Math.PI / n) * 0.62;
    const wo = (Math.PI / n) * 0.36;
    const p = (rr: number, aa: number) => `${(Math.cos(aa) * rr).toFixed(2)} ${(Math.sin(aa) * rr).toFixed(2)}`;
    out.push(`${i === 0 ? "M" : "L"} ${p(r - depth, a - wi)} L ${p(r, a - wo)} L ${p(r, a + wo)} L ${p(r - depth, a + wi)}`);
  }
  return out.join(" ") + " Z";
};

/** Gear drawn in the plane of a face at y = yFace (u along x, v along z). */
const FaceGear: React.FC<{ u: number; v: number; r: number; n: number; angle: number; yFace: number }> = ({ u, v, r, n, angle, yFace }) => {
  const m = `matrix(${C30 * S} ${0.5 * S} 0 ${-S} ${OX - yFace * C30 * S} ${OY + (yFace / 2) * S})`;
  return (
    <g transform={`${m} translate(${u} ${v}) rotate(${angle})`}>
      <path d={gearPath(r, n, r * 0.18)} fill="url(#pmGear)" stroke={BRASS_LO} strokeWidth={2} />
      <circle r={r * 0.66} fill={BRASS_LO} opacity={0.55} />
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={-r * 0.08} y={-r * 0.66} width={r * 0.16} height={r * 1.32} fill={BRASS} transform={`rotate(${k * 45})`} />
      ))}
      <circle r={r * 0.24} fill={BRASS_HI} stroke={BRASS_LO} strokeWidth={2} />
    </g>
  );
};

/** Coin lying flat at world (x, y, z). */
const FlatCoin: React.FC<{ x: number; y: number; z: number; r?: number; dim?: number }> = ({ x, y, z, r = 24, dim = 0 }) => {
  const [sx, sy] = P(x, y, z);
  const rx = r * RX;
  const ry = r * RY;
  const th = 5 * S;
  return (
    <g opacity={1 - dim}>
      <ellipse cx={sx} cy={sy + th} rx={rx} ry={ry} fill="#5A2A10" />
      <rect x={sx - rx} y={sy} width={2 * rx} height={th} fill="#7A3B17" />
      <ellipse cx={sx} cy={sy} rx={rx} ry={ry} fill="url(#pmCopper)" stroke="#6A3112" strokeWidth={1.5} />
      <ellipse cx={sx} cy={sy} rx={rx * 0.78} ry={ry * 0.78} fill="none" stroke="#FFD0A6" strokeOpacity={0.45} strokeWidth={1.5} />
      <g transform={`matrix(${C30 * S} ${0.5 * S} ${-C30 * S} ${0.5 * S} ${sx} ${sy})`}>
        <text x={0} y={9} textAnchor="middle" fontFamily={PLAYFAIR} fontWeight={700} fontSize={26} fill="#8C461F" style={LINING}>
          1¢
        </text>
      </g>
    </g>
  );
};

// ---------- world layout ----------
const DIE = { x: 252, y: 152 };
const HEAD_REST = 214;
const HEAD_HIT = 96;
const BIN = { x0: 404, x1: 560, y0: 64, y1: 236, z: 40 };
const binSlot = (k: number): [number, number, number] => [
  BIN.x0 + 36 + rand(k * 3 + 1) * (BIN.x1 - BIN.x0 - 72),
  BIN.y0 + 36 + rand(k * 5 + 2) * (BIN.y1 - BIN.y0 - 72),
  6 + Math.floor(k / 4) * 6,
];
const PRELOADED = 7;

const STAMPS = [0.78, 1.58, 2.38];

const headZ = (t: number, stamps: number[]) => {
  let z = HEAD_REST;
  for (const T of stamps) {
    if (t >= T - 0.16 && t < T) z = Math.min(z, interpolate(t, [T - 0.16, T], [HEAD_REST, HEAD_HIT], { easing: Easing.in(Easing.quad) }));
    else if (t >= T && t < T + 0.06) z = HEAD_HIT;
    else if (t >= T + 0.06 && t < T + 0.5) z = Math.min(z, interpolate(t, [T + 0.06, T + 0.5], [HEAD_HIT, HEAD_REST], { easing: Easing.out(Easing.cubic) }));
  }
  return z;
};

/** The iso coin press. on: lamp level 0..1. gear: gear angle (deg). head: piston head z. coins: coins resting in the bin. flying: [progress] of coins in the air. */
const PressArt: React.FC<{ on: number; gear: number; head: number; coins: number; flying: number[]; spark: number; blank: boolean; t: number }> = ({ on, gear, head, coins, flying, spark, blank, t }) => {
  const [lx, ly] = P(52, 152, 426);
  const [dx, dy] = P(DIE.x, DIE.y, 92);
  const binCoins = Array.from({ length: coins }).map((_, k) => binSlot(k));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="pmChrome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2E3540" />
          <stop offset="0.25" stopColor="#8C97A6" />
          <stop offset="0.45" stopColor="#F2F5F8" />
          <stop offset="0.7" stopColor="#8C97A6" />
          <stop offset="1" stopColor="#262C35" />
        </linearGradient>
        <linearGradient id="pmSteel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1A2433" />
          <stop offset="0.4" stopColor="#4A5A70" />
          <stop offset="1" stopColor="#141C28" />
        </linearGradient>
        <linearGradient id="pmBrassC" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={BRASS_LO} />
          <stop offset="0.45" stopColor={BRASS_HI} />
          <stop offset="1" stopColor={BRASS_LO} />
        </linearGradient>
        <radialGradient id="pmGear" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor={BRASS_HI} />
          <stop offset="1" stopColor={BRASS} />
        </radialGradient>
        <radialGradient id="pmCopper" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFC596" />
          <stop offset="0.5" stopColor={COPPER} />
          <stop offset="1" stopColor="#7A3B17" />
        </radialGradient>
        <radialGradient id="pmLamp">
          <stop offset="0" stopColor={RED} stopOpacity={0.9} />
          <stop offset="1" stopColor={RED} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pmSpark">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.35" stopColor={SPOT} stopOpacity={0.8} />
          <stop offset="1" stopColor={SPOT} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pmFloorGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={SPOT} stopOpacity={0.22} />
          <stop offset="1" stopColor={SPOT} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* floor glow + iso tiles */}
      <ellipse cx={P(260, 150, 0)[0]} cy={P(260, 150, 0)[1] + 10} rx={520} ry={300} fill="url(#pmFloorGlow)" />
      <g stroke="rgba(255,231,176,0.07)" strokeWidth={2}>
        {Array.from({ length: 15 }).map((_, i) => {
          const v = -120 + i * 60;
          return (
            <g key={i}>
              <line x1={P(-120, v, 0)[0]} y1={P(-120, v, 0)[1]} x2={P(660, v, 0)[0]} y2={P(660, v, 0)[1]} />
              <line x1={P(v, -120, 0)[0]} y1={P(v, -120, 0)[1]} x2={P(v, 420, 0)[0]} y2={P(v, 420, 0)[1]} />
            </g>
          );
        })}
      </g>
      {/* shadows */}
      <polygon points={pts(P(-10, 20, 0), P(380, 20, 0), P(400, 330, 0), P(-10, 330, 0))} fill="#000" opacity={0.4} />
      <polygon points={pts(P(BIN.x0, BIN.y0 + 10, 0), P(BIN.x1 + 16, BIN.y0 + 10, 0), P(BIN.x1 + 16, BIN.y1 + 16, 0), P(BIN.x0, BIN.y1 + 16, 0))} fill="#000" opacity={0.4} />
      {/* base */}
      <Box x0={0} x1={360} y0={0} y1={300} z0={0} z1={56} top="#4C6890" left="#2E4465" right="#1E2E47" />
      <polygon points={pts(P(0, 300, 30), P(360, 300, 30), P(360, 300, 20), P(0, 300, 20))} fill={COPPER} opacity={0.9} />
      <polygon points={pts(P(360, 0, 30), P(360, 300, 30), P(360, 300, 20), P(360, 0, 20))} fill="#8E4A22" opacity={0.9} />
      {/* column + gears */}
      <Box x0={14} x1={144} y0={92} y1={212} z0={56} z1={400} top="#5A779F" left="#34507A" right="#22344F" />
      {[
        [34, 120],
        [124, 120],
        [34, 370],
        [124, 370],
      ].map(([u, v], i) => {
        const [rx, ry] = P(u, 212, v);
        return <circle key={i} cx={rx} cy={ry} r={5} fill="#1A2638" stroke={SPOT} strokeOpacity={0.3} strokeWidth={1.5} />;
      })}
      <FaceGear u={79} v={272} r={52} n={14} angle={gear} yFace={212.5} />
      <FaceGear u={79} v={190} r={36} n={10} angle={-gear * (52 / 36) + 9} yFace={212.5} />
      {/* die */}
      <Cyl cx={DIE.x} cy={DIE.y} r={60} z0={56} z1={66} body="url(#pmSteel)" top="#3A4B63" />
      <Cyl cx={DIE.x} cy={DIE.y} r={50} z0={66} z1={90} body="url(#pmChrome)" top="#B9C2CE" />
      {blank ? <FlatCoin x={DIE.x} y={DIE.y} z={92} r={26} /> : null}
      {/* chute */}
      <polygon points={pts(P(296, 124, 70), P(410, 124, 46), P(410, 182, 46), P(296, 182, 70))} fill="#5C6F8C" />
      <polygon points={pts(P(296, 182, 70), P(410, 182, 46), P(410, 182, 38), P(296, 182, 62))} fill="#2B3B55" />
      {/* bin back walls + floor */}
      <polygon points={pts(P(BIN.x0, BIN.y0, BIN.z), P(BIN.x0, BIN.y1, BIN.z), P(BIN.x0, BIN.y1, 4), P(BIN.x0, BIN.y0, 4))} fill="#141E2E" />
      <polygon points={pts(P(BIN.x0, BIN.y0, BIN.z), P(BIN.x1, BIN.y0, BIN.z), P(BIN.x1, BIN.y0, 4), P(BIN.x0, BIN.y0, 4))} fill="#1B2739" />
      <polygon points={pts(P(BIN.x0, BIN.y0, 4), P(BIN.x1, BIN.y0, 4), P(BIN.x1, BIN.y1, 4), P(BIN.x0, BIN.y1, 4))} fill="#0F1724" />
      {binCoins
        .map((c, k) => ({ c, k }))
        .sort((a, b) => a.c[2] - b.c[2] || a.c[0] + a.c[1] - (b.c[0] + b.c[1]))
        .map(({ c, k }) => (
          <FlatCoin key={k} x={c[0]} y={c[1]} z={c[2]} />
        ))}
      {/* bin front walls */}
      <polygon points={pts(P(BIN.x1, BIN.y0, BIN.z), P(BIN.x1, BIN.y1, BIN.z), P(BIN.x1, BIN.y1, 0), P(BIN.x1, BIN.y0, 0))} fill="#22344F" />
      <polygon points={pts(P(BIN.x0, BIN.y1, BIN.z), P(BIN.x1, BIN.y1, BIN.z), P(BIN.x1, BIN.y1, 0), P(BIN.x0, BIN.y1, 0))} fill="#34507A" />
      <polyline points={pts(P(BIN.x0, BIN.y1, BIN.z), P(BIN.x1, BIN.y1, BIN.z), P(BIN.x1, BIN.y0, BIN.z))} fill="none" stroke={BRASS} strokeWidth={4} strokeLinejoin="round" />
      <polyline points={pts(P(BIN.x0, BIN.y1, BIN.z), P(BIN.x0, BIN.y0, BIN.z), P(BIN.x1, BIN.y0, BIN.z))} fill="none" stroke={BRASS_LO} strokeWidth={3} strokeLinejoin="round" />
      {/* piston */}
      <Cyl cx={DIE.x} cy={DIE.y} r={24} z0={head + 30} z1={300} body="url(#pmChrome)" top="#DDE3EA" />
      <Cyl cx={DIE.x} cy={DIE.y} r={54} z0={head} z1={head + 30} body="url(#pmSteel)" top="#55657D" />
      <Cyl cx={DIE.x} cy={DIE.y} r={46} z0={296} z1={330} body="url(#pmBrassC)" top={BRASS} />
      {/* arm */}
      <Box x0={14} x1={336} y0={98} y1={206} z0={330} z1={400} top="#5A779F" left="#34507A" right="#22344F" edge={0.45} />
      <polygon points={pts(P(14, 206, 372), P(336, 206, 372), P(336, 206, 360), P(14, 206, 360))} fill={COPPER} opacity={0.9} />
      <polygon points={pts(P(336, 98, 372), P(336, 206, 372), P(336, 206, 360), P(336, 98, 360))} fill="#8E4A22" opacity={0.9} />
      {/* lamp */}
      <Cyl cx={52} cy={152} r={18} z0={400} z1={412} body="url(#pmBrassC)" top={BRASS} />
      <circle cx={lx} cy={ly} r={70 + 10 * Math.sin(t * 9)} fill="url(#pmLamp)" opacity={on} />
      <path d={`M ${lx - 17} ${ly + 8} A 17 17 0 0 1 ${lx + 17} ${ly + 8} Z`} fill={on > 0.5 ? "#FF6B6B" : "#5A2A2A"} stroke="#2A0D0D" strokeWidth={2} />
      <circle cx={lx - 5} cy={ly - 2} r={4} fill="#fff" opacity={0.3 + 0.5 * on} />
      {/* impact spark */}
      {spark > 0 ? <circle cx={dx} cy={dy} r={40 + 90 * (1 - spark)} fill="url(#pmSpark)" opacity={spark} /> : null}
      {/* coins in the air */}
      {flying.map((f, i) => {
        if (f < 0) return null;
        const end = binSlot(PRELOADED + i);
        const x = DIE.x + (end[0] - DIE.x) * f;
        const y = DIE.y + (end[1] - DIE.y) * f;
        const z = 92 + (end[2] - 92) * f + 150 * Math.sin(Math.PI * f);
        const [sx, sy] = P(x, y, z);
        const flip = Math.abs(Math.cos(f * Math.PI * 3));
        return (
          <g key={i}>
            <ellipse cx={sx} cy={sy} rx={26 * RX} ry={Math.max(4, 26 * RY * 1.6 * flip)} fill="url(#pmCopper)" stroke="#6A3112" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

/** Gauge + readouts above the press. */
const Panel: React.FC<{ cost: number; on: number; worth: number; off: number }> = ({ cost, on, worth, off }) => {
  const R = 74;
  const C = 2 * Math.PI * R;
  const v = Math.min(cost, 1) / 4;
  const l = Math.max(0, cost - 1) / 4;
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 234,
        width: 770,
        height: 208,
        borderRadius: 26,
        background: "linear-gradient(180deg, #1C293D 0%, #0E1727 100%)",
        border: "3px solid #3A4B66",
        boxShadow: "inset 0 2px 0 rgba(255,231,176,0.15), 0 18px 34px rgba(0,0,0,0.55)",
        filter: off > 0 ? `brightness(${1 - 0.35 * off})` : undefined,
      }}
    >
      {[
        [14, 14],
        [742, 14],
        [14, 208],
        [742, 208],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 1, top: y - 1, width: 10, height: 10, borderRadius: 5, background: "#53647E" }} />
      ))}
      <svg width={220} height={220} style={{ position: "absolute", left: 6, top: -6 }}>
        <circle cx={110} cy={110} r={R} fill="none" stroke="#24344C" strokeWidth={26} />
        <circle cx={110} cy={110} r={R} fill="none" stroke={COPPER} strokeWidth={26} strokeDasharray={`${C * v} ${C}`} transform="rotate(-90 110 110)" />
        <circle cx={110} cy={110} r={R} fill="none" stroke={RED} strokeWidth={26} strokeDasharray={`${C * l} ${C}`} strokeDashoffset={-C / 4} transform="rotate(-90 110 110)" />
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={110} y1={110 - R - 17} x2={110} y2={110 - R + 17} stroke="#0E1727" strokeWidth={4} transform={`rotate(${k * 90} 110 110)`} />
        ))}
        <text x={110} y={124} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill={CREAM}>
          ¢ IN
        </text>
      </svg>
      <div style={{ position: "absolute", left: 240, top: 12, fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: "#8FA3BF" }}>COST IN</div>
      <div style={{ position: "absolute", left: 236, top: 46, fontFamily: MONO, fontWeight: 700, fontSize: 104, lineHeight: 1, color: GOLD, textShadow: "0 0 24px rgba(255,204,51,0.35)" }}>
        {cost.toFixed(2)}¢
      </div>
      <div style={{ position: "absolute", left: 240, top: 150, fontFamily: MONO, fontWeight: 700, fontSize: 44, color: "#F0A97C", opacity: worth * (1 - off) }}>
        <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: COPPER, marginRight: 14 }} />
        WORTH OUT: 1¢
      </div>
      <div style={{ position: "absolute", left: 240, top: 150, fontFamily: MONO, fontWeight: 700, fontSize: 44, color: RED, opacity: off }}>
        <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: on > 0.5 ? RED : "#5A2A2A", marginRight: 14 }} />
        PRESS: OFF
      </div>
    </div>
  );
};

const Damage: React.FC<{ x: number; y: number; age: number; text: string }> = ({ x, y, age, text }) => {
  if (age < 0 || age > 1.15) return null;
  const s = popIn(age, 0, 0.18);
  const rise = 120 * Easing.out(Easing.cubic)(clamp01(age / 1.0));
  const op = age < 0.75 ? 1 : 1 - (age - 0.75) / 0.4;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - rise,
        translate: "-50% -50%",
        scale: String(0.6 + 0.4 * s),
        opacity: Math.max(0, op),
        fontFamily: DISPLAY,
        fontSize: 96,
        color: RED,
        WebkitTextStroke: "12px #1A0505",
        paintOrder: "stroke fill",
        textShadow: "0 6px 0 rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Hanging museum tag for the last circulating strike, with a "still legal tender" footer. */
const DateTag: React.FC<{ drop: number; age: number; foot: number }> = ({ drop, age, foot }) => {
  const swing = age > 0 ? 7 * Math.exp(-age * 2.6) * Math.sin(age * 8) : 0;
  const W = 560;
  const y = 236 - 620 * (1 - drop);
  return (
    <div style={{ position: "absolute", left: 480 - W / 2, top: 0, width: W, height: 900, rotate: `${swing}deg`, transformOrigin: `50% ${y}px`, opacity: drop > 0.01 ? 1 : 0 }}>
      <div style={{ position: "absolute", left: W / 2 - 2, top: y - 700, width: 4, height: 712, background: CREAM, opacity: 0.8 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: y,
          width: W,
          padding: "42px 20px 0",
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #FBF3E1 0%, #EAD9B6 100%)",
          clipPath: "polygon(12% 0, 88% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)",
          textAlign: "center",
          color: INK,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: "50%", top: 12, width: 26, height: 26, borderRadius: 13, translate: "-50% 0", background: "#0E1A2E", border: `5px solid ${BRASS}` }} />
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 2, lineHeight: 1.15 }}>
          LAST PENNY MADE
          <br />
          FOR CIRCULATION
        </div>
        <div style={{ height: 3, background: "rgba(42,26,8,0.3)", margin: "12px 30px 6px" }} />
        <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 124, lineHeight: 1.04, color: "#7A1E2B", ...LINING }}>NOV 2025</div>
        <div style={{ margin: "14px -20px 0", padding: "12px 0 14px", background: "#0E1A2E", color: SPOT, fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 2, opacity: 0.2 + 0.8 * foot }}>
          <span style={{ display: "inline-block", scale: String(0.7 + 0.3 * foot) }}>STILL LEGAL TENDER</span>
        </div>
      </div>
    </div>
  );
};

/** Isometric coin press. mode "run": three strikes, each makes a 1¢ coin that cost 3.69¢. mode "stop": power down + date tag. */
export const PressScene: React.FC<VisualProps> = ({ scene, timeline, index }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mode = scene.visual.mode as string;
  const run = mode === "run";
  const W0 = 210; // gear speed, deg/s
  const prevDur = index > 0 ? timeline.scenes[index - 1].dur : 0;
  let gear: number;
  let on: number;
  let head: number;
  let coins: number;
  let flying: number[] = [];
  let spark = 0;
  let blank = false;
  let off = 0;
  if (run) {
    gear = W0 * t;
    on = 0.75 + 0.25 * Math.sin(t * 10);
    head = headZ(t, STAMPS);
    coins = PRELOADED + STAMPS.filter((T) => t >= T + 0.55).length;
    // -1 = not in the air; the index keeps each coin's own landing slot
    flying = STAMPS.map((T) => (t >= T + 0.1 && t < T + 0.55 ? (t - T - 0.1) / 0.45 : -1));
    spark = Math.max(0, ...STAMPS.map((T) => (t >= T && t < T + 0.25 ? 1 - (t - T) / 0.25 : 0)));
    blank = STAMPS.some((T) => t >= T - 0.5 && t < T + 0.1) || t < STAMPS[0];
  } else {
    const T = 1.9;
    const prevGear = W0 * prevDur;
    gear = prevGear + (t < T ? W0 * (t - (t * t) / (2 * T)) : (W0 * T) / 2);
    const flick = t < 0.55 ? (Math.sin(t * 60) > 0 ? 1 : 0.15) * (1 - t / 0.55) : 0;
    on = flick;
    head = interpolate(t, [0.9, 1.55], [HEAD_REST, HEAD_HIT + 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    coins = PRELOADED + STAMPS.length;
    off = clamp01((t - 0.35) / 0.3);
  }
  // scene 1 opens with a wipe from the gallery
  const wipe = run ? interpolate(t, [0, 0.38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 1;
  const cost = run ? 3.69 * interpolate(t, [0.25, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 3.69;
  const worth = run ? popIn(t, STAMPS[0] + 0.05) : 1;
  const [dx, dy] = P(DIE.x, DIE.y, 120);
  const dropAt = 1.85;
  const drop = mode === "stop" ? spring({ frame: frame - Math.round(dropAt * fps), fps, config: { damping: 11, stiffness: 120 } }) : 0;
  const chipAt = (scene.words.find((w) => /^2025/.test(w.w))?.t ?? 2.9) - 0.05;
  const chip = mode === "stop" ? popIn(t, chipAt) : 0;
  return (
    <AbsoluteFill>
      {run && wipe < 1 ? <GalleryView tt={1.5} mouth={0} underline={1} signOpacity={1 - clamp01(t / 0.1)} /> : null}
      <AbsoluteFill style={{ clipPath: wipe < 1 ? `inset(0 0 0 ${(1 - wipe) * 1080}px)` : undefined }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 50% 52%, #1B2C47 0%, #0C1627 60%, #050A13 100%)" }} />
        <PressArt on={on} gear={gear} head={head} coins={coins} flying={flying} spark={spark} blank={blank} t={t} />
        <Panel cost={cost} on={on} worth={worth} off={off} />
        {run ? STAMPS.map((T, i) => <Damage key={i} x={dx + (i % 2 === 0 ? -70 : 70)} y={dy - 40} age={t - T} text="-2.69¢" />) : null}
        {mode === "stop" ? <DateTag drop={drop} age={t - dropAt} foot={chip} /> : null}
      </AbsoluteFill>
      {run && wipe > 0 && wipe < 1 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: (1 - wipe) * 1080 - 6, width: 12, background: SPOT, boxShadow: `0 0 40px 12px ${SPOT}` }} /> : null}
    </AbsoluteFill>
  );
};

