import React, { useId } from "react";
import { MONO, PLAYFAIR } from "../../fonts";
import { Centy } from "../../shared/Centy";
import { rand } from "../../visuals/util";
import { BRASS, BRASS_HI, BRASS_LO, COPPER, INK, LINING, NICKEL, OXBLOOD, SPOT, pmod } from "./palette";

const FLOOR_Y = 1190;

export type Spot = { x: number; w: number; a: number };

/** Navy gallery wall, wood floor, spotlight beams and drifting dust motes (full frame). */
export const GalleryRoom: React.FC<{ spots: Spot[]; tt: number; motes?: number }> = ({ spots, tt, motes = 1 }) => {
  const main = spots.reduce((m, s) => (s.a > m.a ? s : m), spots[0] ?? { x: 480, w: 300, a: 0 });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="pmWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060E1A" />
          <stop offset="0.55" stopColor="#102039" />
          <stop offset="1" stopColor="#0A1527" />
        </linearGradient>
        <linearGradient id="pmFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C1D12" />
          <stop offset="0.25" stopColor="#1A110A" />
          <stop offset="1" stopColor="#060403" />
        </linearGradient>
        <radialGradient id="pmPool">
          <stop offset="0" stopColor={SPOT} stopOpacity={0.6} />
          <stop offset="0.6" stopColor={SPOT} stopOpacity={0.16} />
          <stop offset="1" stopColor={SPOT} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="pmBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SPOT} stopOpacity={0.3} />
          <stop offset="0.7" stopColor={SPOT} stopOpacity={0.1} />
          <stop offset="1" stopColor={SPOT} stopOpacity={0.02} />
        </linearGradient>
        <radialGradient id="pmVig" cx="0.45" cy="0.38" r="0.8">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.7} />
        </radialGradient>
        <filter id="pmSoft" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width={1080} height={FLOOR_Y} fill="url(#pmWall)" />
      {/* wall panelling */}
      <rect x={34} y={360} width={1012} height={660} rx={8} fill="none" stroke="rgba(255,231,176,0.07)" strokeWidth={4} />
      <rect x={54} y={380} width={972} height={620} rx={5} fill="none" stroke="rgba(255,231,176,0.045)" strokeWidth={2} />
      <rect x={0} y={1046} width={1080} height={14} fill="rgba(255,231,176,0.09)" />
      <rect x={0} y={1060} width={1080} height={6} fill="rgba(0,0,0,0.35)" />
      <rect x={0} y={1160} width={1080} height={30} fill="#060B15" />
      <rect x={0} y={1160} width={1080} height={3} fill="rgba(255,231,176,0.08)" />
      {/* floor */}
      <rect x={0} y={FLOOR_Y} width={1080} height={1920 - FLOOR_Y} fill="url(#pmFloor)" />
      {Array.from({ length: 17 }).map((_, i) => (
        <line key={`p${i}`} x1={480 + (i - 8) * 70} y1={FLOOR_Y} x2={480 + (i - 8) * 260} y2={1920} stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
      ))}
      {[1238, 1300, 1385, 1500, 1660].map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke="rgba(255,231,176,0.04)" strokeWidth={2} />
      ))}
      {/* light */}
      {spots.map((s, i) => (
        <g key={`s${i}`} opacity={s.a}>
          <ellipse cx={s.x} cy={640} rx={s.w * 1.05} ry={s.w * 1.25} fill="url(#pmPool)" opacity={0.55} />
          <polygon
            points={`${s.x - 40},-20 ${s.x + 40},-20 ${s.x + s.w * 0.95},${FLOOR_Y} ${s.x - s.w * 0.95},${FLOOR_Y}`}
            fill="url(#pmBeam)"
            filter="url(#pmSoft)"
          />
          <ellipse cx={s.x} cy={FLOOR_Y + 46} rx={s.w * 1.25} ry={70} fill="url(#pmPool)" opacity={0.7} />
        </g>
      ))}
      {/* dust motes in the main beam */}
      {Array.from({ length: 30 }).map((_, i) => {
        const r0 = rand(i * 13 + 1);
        const r1 = rand(i * 7 + 3);
        const r2 = rand(i * 5 + 11);
        const y = 370 + pmod(r1 * 780 - tt * 18, 780);
        const half = 40 + (main.w * 0.95 - 40) * ((y + 20) / (FLOOR_Y + 20));
        const x = main.x + (r0 * 2 - 1) * half * 0.85 + 16 * Math.sin(tt * 0.7 + i * 1.9);
        const edge = Math.min(1, Math.min(y - 370, 1150 - y) / 90);
        return <circle key={`m${i}`} cx={x} cy={y} r={1.6 + r2 * 3.4} fill={SPOT} opacity={(0.25 + 0.55 * r2) * main.a * motes * Math.max(0, edge)} />;
      })}
      <rect width={1080} height={1920} fill="url(#pmVig)" />
    </svg>
  );
};

/** Brass exhibit title on the wall. */
export const WallSign: React.FC<{ y?: number; opacity?: number }> = ({ y = 205, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 70, width: 820, top: y, textAlign: "center", opacity }}>
    <div
      style={{
        fontFamily: PLAYFAIR,
        fontWeight: 700,
        fontSize: 66,
        letterSpacing: 2,
        color: BRASS_HI,
        textShadow: `0 3px 0 ${BRASS_LO}, 0 10px 22px rgba(0,0,0,0.7)`,
        lineHeight: 1.05,
      }}
    >
      THE MONEY-LOSERS
    </div>
    <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: "#A89E89", marginTop: 8, textShadow: "0 4px 12px rgba(0,0,0,0.7)" }}>
      PERMANENT EXHIBIT
    </div>
  </div>
);

export type CoinKind = "penny" | "nickel";
const COIN = {
  penny: { hi: "#FFD0A6", mid: COPPER, lo: "#6A3112", edge: "#8C461F", edge2: "#4E220B", emb: "#A5552A", label: "1¢", word: "ONE CENT", th: 9 },
  nickel: { hi: "#FFFFFF", mid: NICKEL, lo: "#666E79", edge: "#949BA6", edge2: "#525963", emb: "#8E959F", label: "5¢", word: "FIVE CENTS", th: 12 },
};

/** A plain disc stamped only with its value (no portraits, no real coin design). turn = degrees around the vertical axis. */
export const Coin: React.FC<{ d: number; kind: CoinKind; turn?: number; glow?: number; style?: React.CSSProperties }> = ({ d, kind, turn = 0, glow = 0, style }) => {
  const id = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const P = COIN[kind];
  const rad = (turn * Math.PI) / 180;
  const c = Math.max(0.02, Math.abs(Math.cos(rad)));
  const ex = Math.sin(rad) * P.th;
  return (
    <svg
      width={d}
      height={d}
      viewBox="0 0 200 200"
      style={{ overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${28 * glow}px rgba(255,231,176,${0.85 * glow}))` : undefined, ...style }}
    >
      <defs>
        <radialGradient id={`${id}f`} cx="34%" cy="28%" r="85%">
          <stop offset="0" stopColor={P.hi} />
          <stop offset="0.45" stopColor={P.mid} />
          <stop offset="1" stopColor={P.lo} />
        </radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.edge2} />
          <stop offset="0.5" stopColor={P.edge} />
          <stop offset="1" stopColor={P.edge2} />
        </linearGradient>
        <path id={`${id}a`} d="M 36 104 A 64 64 0 0 1 164 104" />
        <clipPath id={`${id}c`}>
          <ellipse cx={100} cy={100} rx={100 * c} ry={100} />
        </clipPath>
      </defs>
      <ellipse cx={100 + ex} cy={100} rx={100 * c} ry={100} fill={`url(#${id}e)`} />
      <rect x={100 + Math.min(0, ex)} y={0} width={Math.abs(ex)} height={200} fill={`url(#${id}e)`} />
      <g transform={`translate(100 100) scale(${c} 1) translate(-100 -100)`}>
        <circle cx={100} cy={100} r={100} fill={`url(#${id}f)`} />
        <circle cx={100} cy={100} r={97} fill="none" stroke={P.hi} strokeOpacity={0.55} strokeWidth={3} />
        <circle cx={100} cy={100} r={91} fill="none" stroke={P.lo} strokeOpacity={0.55} strokeWidth={3} />
        <circle cx={100} cy={100} r={84} fill="none" stroke={P.lo} strokeOpacity={0.35} strokeWidth={2.5} strokeDasharray="1.5 5" strokeLinecap="round" />
        <text fontFamily={MONO} fontWeight={700} fontSize={16} letterSpacing={5} fill={P.emb} textAnchor="middle">
          <textPath href={`#${id}a`} startOffset="50%">
            {P.word}
          </textPath>
        </text>
        {[
          { dx: 2.5, dy: 3.5, fill: P.lo, op: 0.7 },
          { dx: -1.8, dy: -1.8, fill: P.hi, op: 0.85 },
          { dx: 0, dy: 0, fill: P.emb, op: 1 },
        ].map((l, i) => (
          <text
            key={i}
            x={100 + l.dx}
            y={140 + l.dy}
            textAnchor="middle"
            fontFamily={PLAYFAIR}
            fontWeight={700}
            fontSize={86}
            fill={l.fill}
            opacity={l.op}
            style={LINING}
          >
            {P.label}
          </text>
        ))}
      </g>
      <g clipPath={`url(#${id}c)`}>
        <rect x={20 + turn * 5} y={-40} width={34} height={280} fill="#fff" opacity={0.2} transform="rotate(24 100 100)" />
        <rect x={64 + turn * 5} y={-40} width={10} height={280} fill="#fff" opacity={0.14} transform="rotate(24 100 100)" />
      </g>
    </svg>
  );
};

/** Glass vitrine on a plinth. Positioned by its case centre x and case top y; the plinth runs down to the floor. */
export const Exhibit: React.FC<{
  cx: number;
  top: number;
  w: number;
  h: number;
  plinthW: number;
  coinD: number;
  kind: CoinKind;
  turn: number;
  tt: number;
  light?: number;
  coinGlow?: number;
}> = ({ cx, top, w, h, plinthW, coinD, kind, turn, tt, light = 1, coinGlow = 0 }) => {
  const id = "e" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const L = plinthW;
  const x0 = (L - w) / 2;
  const y0 = 26;
  const H = FLOOR_Y - top + y0 + 4;
  const yb = y0 + h; // plinth top
  const d = Math.min(26, w * 0.07);
  const stY = yb - 40; // stand top
  const coinY = stY - 18 - coinD / 2;
  const glare = pmod(tt * 0.2 + 0.32, 1.35);
  const gx = x0 - 160 + glare * (w + 320);
  return (
    <div style={{ position: "absolute", left: cx - L / 2, top: top - y0, width: L, height: H, filter: light < 1 ? `brightness(${0.45 + 0.55 * light})` : undefined }}>
      <svg width={L} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id={`${id}bw`} cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#2A3D5E" />
            <stop offset="1" stopColor="#0C172A" />
          </radialGradient>
          <linearGradient id={`${id}pad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3D0F18" />
            <stop offset="1" stopColor={OXBLOOD} />
          </linearGradient>
          <linearGradient id={`${id}pl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0A1322" />
            <stop offset="0.42" stopColor="#1C2C47" />
            <stop offset="0.6" stopColor="#15233A" />
            <stop offset="1" stopColor="#09111F" />
          </linearGradient>
          <linearGradient id={`${id}cap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4E70" />
            <stop offset="1" stopColor="#16233A" />
          </linearGradient>
          <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SPOT} stopOpacity={0.22} />
            <stop offset="0.5" stopColor={SPOT} stopOpacity={0.04} />
            <stop offset="1" stopColor={SPOT} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}lid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4A3420" />
            <stop offset="1" stopColor="#1F140B" />
          </linearGradient>
          <linearGradient id={`${id}gl`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
            <stop offset="0.4" stopColor="#fff" stopOpacity={0.01} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.06} />
          </linearGradient>
          <clipPath id={`${id}glass`}>
            <rect x={x0} y={y0} width={w} height={h} />
          </clipPath>
        </defs>
        {/* plinth */}
        <ellipse cx={L / 2} cy={H - 2} rx={L * 0.56} ry={20} fill="#000" opacity={0.55} />
        <rect x={12} y={yb + 22} width={L - 24} height={H - yb - 22} fill={`url(#${id}pl)`} />
        <rect x={12} y={yb + 22} width={L - 24} height={H - yb - 22} fill={`url(#${id}sheen)`} />
        <rect x={0} y={yb} width={L} height={24} rx={3} fill={`url(#${id}cap)`} />
        <rect x={0} y={yb} width={L} height={3} fill={SPOT} opacity={0.45} />
        {/* case interior */}
        <rect x={x0 + d} y={y0 + 4} width={w - 2 * d} height={h - 58} fill={`url(#${id}bw)`} />
        <polygon points={`${x0},${y0} ${x0 + d},${y0 + 4} ${x0 + d},${yb - 54} ${x0},${yb}`} fill="rgba(255,255,255,0.05)" />
        <polygon points={`${x0 + w},${y0} ${x0 + w - d},${y0 + 4} ${x0 + w - d},${yb - 54} ${x0 + w},${yb}`} fill="rgba(0,0,0,0.25)" />
        <polygon points={`${x0},${yb} ${x0 + w},${yb} ${x0 + w - d},${yb - 54} ${x0 + d},${yb - 54}`} fill={`url(#${id}pad)`} />
        <ellipse cx={L / 2} cy={stY + 10} rx={coinD * 0.42} ry={12} fill="#000" opacity={0.45} />
        {/* acrylic stand */}
        <polygon points={`${L / 2 - 46},${stY + 14} ${L / 2 + 46},${stY + 14} ${L / 2 + 30},${stY - 20} ${L / 2 - 30},${stY - 20}`} fill="rgba(220,235,255,0.16)" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: L / 2 - coinD / 2, top: coinY - coinD / 2 }}>
        <Coin d={coinD} kind={kind} turn={turn} glow={coinGlow} />
      </div>
      <svg width={L} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* glass front */}
        <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id}gl)`} stroke="rgba(235,245,255,0.32)" strokeWidth={3} />
        <g clipPath={`url(#${id}glass)`}>
          <polygon points={`${gx},${y0} ${gx + 90},${y0} ${gx - 60},${yb} ${gx - 150},${yb}`} fill="#fff" opacity={0.09} />
          <polygon points={`${gx + 120},${y0} ${gx + 142},${y0} ${gx - 8},${yb} ${gx - 30},${yb}`} fill="#fff" opacity={0.12} />
        </g>
        <line x1={x0 + 6} y1={y0 + 8} x2={x0 + 6} y2={yb - 8} stroke="#fff" strokeOpacity={0.28} strokeWidth={3} />
        <line x1={x0 + w - 6} y1={y0 + 8} x2={x0 + w - 6} y2={yb - 8} stroke="#fff" strokeOpacity={0.1} strokeWidth={2} />
        {/* lid and base trim */}
        <rect x={x0 - 10} y={y0 - 22} width={w + 20} height={24} rx={4} fill={`url(#${id}lid)`} />
        <rect x={x0 - 10} y={y0 - 22} width={w + 20} height={3} rx={2} fill={SPOT} opacity={0.4} />
        <rect x={x0 - 4} y={yb - 8} width={w + 8} height={10} fill={BRASS} opacity={0.85} />
      </svg>
    </div>
  );
};

/** Engraved brass plate. */
export const Placard: React.FC<{ x: number; y: number; w: number; children: React.ReactNode; opacity?: number; s?: number }> = ({ x, y, w, children, opacity = 1, s = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y,
      width: w,
      opacity,
      scale: String(s),
      transformOrigin: "50% 0%",
      background: `linear-gradient(180deg, ${BRASS_HI} 0%, ${BRASS} 42%, #B98D40 72%, ${BRASS} 100%)`,
      borderRadius: 10,
      border: `3px solid ${BRASS_LO}`,
      boxShadow: "inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -4px 0 rgba(0,0,0,0.22), 0 14px 26px rgba(0,0,0,0.6)",
      padding: "12px 14px 10px",
      boxSizing: "border-box",
      color: INK,
      textAlign: "center",
      textShadow: "0 1.5px 0 rgba(255,255,255,0.45)",
    }}
  >
    {[
      [10, 10],
      [w - 22, 10],
    ].map(([l, t], i) => (
      <div key={i} style={{ position: "absolute", left: l, top: t, width: 10, height: 10, borderRadius: 5, background: BRASS_LO, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)" }} />
    ))}
    {children}
  </div>
);

export const PlateLabel: React.FC<{ children: React.ReactNode; size?: number; spacing?: number }> = ({ children, size = 40, spacing = 3 }) => (
  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: spacing, lineHeight: 1.1, whiteSpace: "nowrap" }}>{children}</div>
);

export const PlateNumber: React.FC<{ children: React.ReactNode; size?: number; color?: string; s?: number }> = ({ children, size = 100, color = INK, s = 1 }) => (
  <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: size, lineHeight: 1.0, color, whiteSpace: "nowrap", scale: String(s), ...LINING }}>{children}</div>
);

/** Brass stanchions with a velvet rope, in front of the hook exhibit. */
export const Stanchions: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity }}>
    <defs>
      <linearGradient id="pmPost" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={BRASS_LO} />
        <stop offset="0.4" stopColor={BRASS_HI} />
        <stop offset="1" stopColor={BRASS_LO} />
      </linearGradient>
    </defs>
    {[105, 855].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={1196} rx={40} ry={10} fill="#000" opacity={0.5} />
        <ellipse cx={x} cy={1190} rx={34} ry={9} fill="url(#pmPost)" />
        <rect x={x - 7} y={1098} width={14} height={92} fill="url(#pmPost)" />
        <circle cx={x} cy={1094} r={15} fill="url(#pmPost)" />
        <circle cx={x - 5} cy={1089} r={5} fill="#fff" opacity={0.6} />
      </g>
    ))}
    <path d="M 105 1102 Q 480 1282 855 1102" fill="none" stroke="#4A0E19" strokeWidth={18} strokeLinecap="round" />
    <path d="M 105 1102 Q 480 1282 855 1102" fill="none" stroke="#8E2236" strokeWidth={12} strokeLinecap="round" />
    <path d="M 108 1098 Q 480 1276 852 1098" fill="none" stroke="#D0566A" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
  </svg>
);

const Glove: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} stroke="#2b1a05" strokeWidth={4} strokeLinejoin="round">
    <rect x={-13} y={-50} width={11} height={30} rx={5.5} fill="#FBF8F0" />
    <rect x={-1} y={-54} width={11} height={34} rx={5.5} fill="#FBF8F0" />
    <rect x={11} y={-48} width={11} height={28} rx={5.5} fill="#FBF8F0" />
    <rect x={-16} y={-30} width={40} height={36} rx={12} fill="#FBF8F0" />
    <rect x={-26} y={-26} width={13} height={24} rx={6.5} fill="#FBF8F0" transform="rotate(-30 -20 -14)" />
    <rect x={-14} y={4} width={36} height={14} rx={4} fill="#ECE6D6" />
    <path d="M -4 -24 L -4 -8 M 6 -24 L 6 -8 M 16 -24 L 16 -8" stroke="#C9C1AE" strokeWidth={2.5} />
  </g>
);

/** Centy as the museum curator: no headset, bow tie, white gloves. */
export const Curator: React.FC<{ size: number; mouth: number; expr?: "talk" | "smug" | "shocked" | "worried" | "hype" | "deadpan"; wave?: number; look?: number }> = ({
  size,
  mouth,
  expr = "talk",
  wave = 0,
  look = 0,
}) => (
  <Centy size={size} mouth={mouth} expr={expr} headset={false} look={look}>
    <g transform="translate(100 194)">
      <path d="M0 0 L-30 -16 L-30 16 Z" fill={OXBLOOD} stroke="#2b1a05" strokeWidth={4} strokeLinejoin="round" />
      <path d="M0 0 L30 -16 L30 16 Z" fill={OXBLOOD} stroke="#2b1a05" strokeWidth={4} strokeLinejoin="round" />
      <circle r={8} fill="#8E2236" stroke="#2b1a05" strokeWidth={4} />
    </g>
    <Glove x={6} y={176} rot={-28} />
    <Glove x={204} y={128 + wave * 6} rot={24 + wave * 18} />
  </Centy>
);

