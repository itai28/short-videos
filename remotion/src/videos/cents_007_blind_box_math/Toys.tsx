import React from "react";
import { AbsoluteFill } from "remotion";
import { BALOO } from "../../fonts";

/** fonts.ts names the family Baloo 2; it must be quoted in CSS because the name contains a token starting with a digit. */
export const BAL = `${BALOO}, "Archivo Black", sans-serif`;
import { clamp01, rand } from "../../visuals/util";

/** Toy-shelf diorama palette. Gold always means a box count or a dollar figure; red means a loss. */
export const C = {
  cream: "#FFF4E6",
  lilac: "#B9A3FF",
  lilacDark: "#8C72EC",
  lilacDeep: "#5E45B8",
  gum: "#FF8FB1",
  gumDark: "#E0628C",
  mint: "#7FE3C8",
  mintDark: "#2FA986",
  gold: "#FFCC33",
  goldDark: "#D99A00",
  ink: "#3B2A5A",
  kraft: "#C89B6D",
  kraftDark: "#9E7247",
  kraftLight: "#E2BE90",
  grey: "#A9A3B8",
  red: "#FF5A6E",
  redDark: "#D63A50",
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.22 0 0 0 0 0.12 0 0 0 0.13 0'/></filter><rect width='256' height='256' filter='url(#n)'/></svg>",
)}")`;

/** Cream wall with paper grain and lilac polka dots, over a lilac wooden counter top. Full frame. */
export const Room: React.FC<{ t: number; tableY?: number }> = ({ t, tableY = 1190 }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 95% 62% at 46% 34%, #FFFCF6 0%, #FFF4E6 52%, #F5DFC6 100%)" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(185,163,255,0.26) 6px, transparent 7px), radial-gradient(circle, rgba(255,143,177,0.18) 5px, transparent 6px)",
        backgroundSize: "96px 96px, 96px 96px",
        backgroundPosition: `${(t * 4) % 96}px 0px, ${48 + ((t * 4) % 96)}px 48px`,
      }}
    />
    <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN }} />
    {/* soft contact shadow where the wall meets the counter */}
    <div style={{ position: "absolute", left: 0, right: 0, top: tableY - 70, height: 70, background: "linear-gradient(rgba(59,42,90,0), rgba(59,42,90,0.16))" }} />
    {/* counter top surface */}
    <div style={{ position: "absolute", left: 0, right: 0, top: tableY, height: 54, background: "linear-gradient(#E3D8FF, #C6B4FF)", borderTop: "3px solid rgba(255,255,255,0.8)" }} />
    {/* counter front */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: tableY + 54,
        bottom: 0,
        background: "linear-gradient(#9C84F0, #6A50C8 55%, #4E3699)",
        boxShadow: "inset 0 10px 14px rgba(40,20,90,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 3px, transparent 3px, transparent 41px)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.8 }} />
    </div>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 90% at 50% 38%, rgba(0,0,0,0) 60%, rgba(59,42,90,0.22) 100%)" }} />
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ figures */

export type ToyKind = 0 | 1 | 2 | 3 | 4 | 5 | 6; // pirate, astronaut, chef, ninja, DJ, wizard, secret
export const TOY_COLORS: [string, string, string][] = [
  ["#FFC9A6", "#E8915E", "#B8622F"], // pirate - copper
  ["#F4F7FC", "#C9D3E3", "#8E9BB3"], // astronaut - silver
  ["#D6FFF2", "#86E3C8", "#3DB894"], // chef - mint
  ["#C9BEFF", "#8A76E3", "#5B47B5"], // ninja - violet
  ["#FFD6E4", "#FF95BA", "#DB5E8C"], // DJ - bubblegum
  ["#CFE3FF", "#7FB0FF", "#4A7FE0"], // wizard - sky
  ["#FFF3B8", "#FFCC33", "#C98A00"], // secret - gold
];
export const TOY_NAMES = ["PIRATE", "ASTRONAUT", "CHEF", "NINJA", "DJ", "WIZARD", "SECRET"];

const Face: React.FC<{ eyes?: boolean; smileY?: number }> = ({ eyes = true, smileY = 152 }) => (
  <g>
    {eyes &&
      [78, 122].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={124} rx={11} ry={13} fill="#fff" stroke={C.ink} strokeWidth={3.5} />
          <circle cx={x + 1.5} cy={127} r={6.5} fill={C.ink} />
          <circle cx={x + 4} cy={123.5} r={2.2} fill="#fff" />
        </g>
      ))}
    <ellipse cx={62} cy={146} rx={9} ry={6} fill="#FF6F9A" opacity={0.35} />
    <ellipse cx={138} cy={146} rx={9} ry={6} fill="#FF6F9A" opacity={0.35} />
    <path d={`M86 ${smileY} Q100 ${smileY + 11} 114 ${smileY}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
  </g>
);

const Star4: React.FC<{ x: number; y: number; r: number; fill: string }> = ({ x, y, r, fill }) => (
  <path d={`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`} fill={fill} />
);

/** One collectible coin figurine, drawn in a 200 x 240 box (feet + display base at the bottom). */
export const ToyArt: React.FC<{ kind: ToyKind; base?: boolean }> = ({ kind, base = true }) => {
  const [l, m, d] = TOY_COLORS[kind];
  const id = `toy${kind}`;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}b`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor={l} />
          <stop offset="55%" stopColor={m} />
          <stop offset="100%" stopColor={d} />
        </radialGradient>
      </defs>
      {base && (
        <g>
          <ellipse cx={100} cy={222} rx={60} ry={14} fill="#B7A4F5" stroke={C.ink} strokeWidth={4} />
          <rect x={40} y={212} width={120} height={10} fill="#B7A4F5" />
          <ellipse cx={100} cy={212} rx={60} ry={14} fill="#E6DDFF" stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {/* wizard hat and DJ headphones sit behind/around the coin */}
      {kind === 4 && <path d="M30 122 Q30 40 100 40 Q170 40 170 122" stroke="#2E2448" strokeWidth={13} fill="none" strokeLinecap="round" />}
      <ellipse cx={80} cy={204} rx={17} ry={10} fill={d} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={120} cy={204} rx={17} ry={10} fill={d} stroke={C.ink} strokeWidth={4} />
      <circle cx={100} cy={128} r={70} fill={`url(#${id}b)`} stroke={C.ink} strokeWidth={5} />
      <circle cx={100} cy={128} r={59} fill="none" stroke={d} strokeWidth={4} opacity={0.55} />
      <path d="M52 98 Q62 70 92 64" stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.65} />
      {kind === 0 && (
        <g>
          <path d="M33 112 Q34 56 100 54 Q166 56 167 112 Q100 90 33 112 Z" fill="#E5484D" stroke={C.ink} strokeWidth={4} />
          {[60, 88, 118, 146].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 76 : 92} r={5} fill="#fff" opacity={0.9} />
          ))}
          <path d="M162 98 Q190 88 196 104 Q180 106 166 106 Z" fill="#E5484D" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M164 104 Q186 118 182 134 Q170 122 160 110 Z" fill="#C93339" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <Face eyes={false} />
          <ellipse cx={78} cy={124} rx={11} ry={13} fill="#fff" stroke={C.ink} strokeWidth={3.5} />
          <circle cx={79.5} cy={127} r={6.5} fill={C.ink} />
          <circle cx={82} cy={123.5} r={2.2} fill="#fff" />
          <path d="M46 108 Q100 112 158 140" stroke={C.ink} strokeWidth={4} fill="none" />
          <ellipse cx={122} cy={126} rx={15} ry={14} fill="#2E2448" stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {kind === 1 && (
        <g>
          <Face />
          <circle cx={100} cy={126} r={88} fill="rgba(170,220,255,0.22)" stroke="#fff" strokeWidth={6} />
          <circle cx={100} cy={126} r={91} fill="none" stroke={C.ink} strokeWidth={4} />
          <path d="M40 92 Q52 58 86 46" stroke="#fff" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.85} />
          <path d="M34 178 Q100 214 166 178" stroke="#7E8AA3" strokeWidth={12} fill="none" strokeLinecap="round" />
          <line x1={100} y1={36} x2={100} y2={14} stroke={C.ink} strokeWidth={5} />
          <circle cx={100} cy={12} r={9} fill={C.red} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {kind === 2 && (
        <g>
          <circle cx={68} cy={46} r={22} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <circle cx={132} cy={46} r={22} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <circle cx={100} cy={34} r={28} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <rect x={58} y={52} width={84} height={26} rx={6} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <path d="M70 56 L70 76 M100 56 L100 76 M130 56 L130 76" stroke="#E4DDF0" strokeWidth={3} />
          <Face smileY={160} />
          <path d="M100 144 Q86 134 72 142 Q78 152 100 148 Q122 152 128 142 Q114 134 100 144 Z" fill="#6B3E26" stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {kind === 3 && (
        <g>
          <path d="M162 112 Q190 98 198 112 Q186 116 168 120 Z" fill={C.red} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M164 120 Q192 128 194 146 Q178 136 162 128 Z" fill={C.redDark} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M34 106 Q100 92 166 106 L166 142 Q100 130 34 142 Z" fill="#2E2448" stroke={C.ink} strokeWidth={4} />
          <Face />
          <path d="M64 108 L92 114 M136 108 L108 114" stroke="#2E2448" strokeWidth={6} strokeLinecap="round" />
        </g>
      )}
      {kind === 4 && (
        <g>
          <rect x={14} y={100} width={30} height={50} rx={13} fill={C.mint} stroke={C.ink} strokeWidth={4} />
          <rect x={156} y={100} width={30} height={50} rx={13} fill={C.mint} stroke={C.ink} strokeWidth={4} />
          <Face eyes={false} smileY={150} />
          <rect x={56} y={110} width={40} height={28} rx={10} fill="#2E2448" stroke={C.ink} strokeWidth={3} />
          <rect x={104} y={110} width={40} height={28} rx={10} fill="#2E2448" stroke={C.ink} strokeWidth={3} />
          <path d="M96 118 L104 118" stroke={C.ink} strokeWidth={5} />
          <path d="M62 118 L74 114 M110 118 L122 114" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
        </g>
      )}
      {kind === 5 && (
        <g>
          <Face />
          <path d="M48 84 Q80 -6 104 4 Q96 30 152 84 Z" fill="#4B3FA8" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <ellipse cx={100} cy={84} rx={68} ry={14} fill="#3A2F8A" stroke={C.ink} strokeWidth={4} />
          <Star4 x={86} y={50} r={9} fill="#fff" />
          <Star4 x={112} y={66} r={6} fill="#fff" />
          <Star4 x={96} y={26} r={5} fill="#fff" />
        </g>
      )}
      {kind === 6 && (
        <g>
          <Face eyes={false} smileY={154} />
          <rect x={36} y={106} width={128} height={36} rx={18} fill="url(#visor)" stroke={C.ink} strokeWidth={4} />
          <defs>
            <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2E2448" />
              <stop offset="60%" stopColor="#5B3FB8" />
              <stop offset="100%" stopColor="#FF8FB1" />
            </linearGradient>
          </defs>
          <rect x={40} y={110} width={120} height={28} rx={14} fill="none" stroke={C.gold} strokeWidth={3} />
          <path d="M56 120 L92 116" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
          <Star4 x={150} y={58} r={16} fill="#fff" />
          <Star4 x={46} y={66} r={9} fill="#FFF3B8" />
        </g>
      )}
    </g>
  );
};

/** A figurine as its own SVG. width px; height is 1.2x. dupe = grey duplicate; silhouette = unknown slot. */
export const Toy: React.FC<{
  kind: ToyKind;
  w: number;
  dupe?: boolean;
  silhouette?: boolean;
  glow?: string;
  base?: boolean;
  style?: React.CSSProperties;
}> = ({ kind, w, dupe, silhouette, glow, base = true, style }) => (
  <svg
    width={w}
    height={w * 1.2}
    viewBox="0 0 200 240"
    style={{
      overflow: "visible",
      filter: silhouette
        ? "brightness(0) opacity(0.5)"
        : dupe
          ? "grayscale(1) brightness(1.08) contrast(0.85) drop-shadow(0 6px 6px rgba(59,42,90,0.25))"
          : glow
            ? `drop-shadow(0 0 26px ${glow}) drop-shadow(0 8px 10px rgba(59,42,90,0.3))`
            : "drop-shadow(0 8px 9px rgba(59,42,90,0.3))",
      ...style,
    }}
  >
    <ToyArt kind={kind} base={base} />
  </svg>
);

/* ------------------------------------------------------------------ kraft box */

const BW = 160;
const BH = 122;
const BD = 84;
const KX = 0.45;
const KY = 0.32;
const P = (x: number, y: number, z: number) => `${(x + z * KX).toFixed(1)},${(-y - z * KY).toFixed(1)}`;
const poly = (pts: [number, number, number][]) => pts.map((p) => P(...p)).join(" ");

/**
 * Plain kraft mystery box in a 3/4 view. lid = opening angle in degrees (0 closed, ~115 flipped open).
 * figure = optional toy rising out of it (rise 0..1). w = drawn width in px.
 */
export const KraftBox: React.FC<{
  w: number;
  lid?: number;
  figure?: ToyKind;
  rise?: number;
  sticker?: boolean;
  label?: string;
  style?: React.CSSProperties;
}> = ({ w, lid = 0, figure, rise = 0, sticker = true, label, style }) => {
  const th = (Math.min(lid, 179) * Math.PI) / 180;
  const yF = BH + BD * Math.sin(th);
  const zF = BD - BD * Math.cos(th);
  const lidPts = poly([
    [0, BH, BD],
    [BW, BH, BD],
    [BW, yF, zF],
    [0, yF, zF],
  ]);
  const open = lid > 4;
  const back = lid > 90;
  const lidFill = back ? "url(#kbLidIn)" : "url(#kbLid)";
  const cx = BW / 2 + (BD / 2) * KX;
  const figW = 150;
  const figY = -BH - (BD / 2) * KY - 30 - rise * 128; // top of the figure box in svg units
  return (
    <svg width={w} height={(w * 300) / 240} viewBox="-14 -270 240 300" style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id="kbFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2BE90" />
          <stop offset="100%" stopColor="#C08F5D" />
        </linearGradient>
        <linearGradient id="kbSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A87A4E" />
          <stop offset="100%" stopColor="#8E643C" />
        </linearGradient>
        <linearGradient id="kbLid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#F0D3A8" />
          <stop offset="100%" stopColor="#D9B080" />
        </linearGradient>
        <linearGradient id="kbLidIn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B88A5A" />
          <stop offset="100%" stopColor="#8A5F37" />
        </linearGradient>
        <radialGradient id="kbShadow">
          <stop offset="0%" stopColor="rgba(59,42,90,0.38)" />
          <stop offset="100%" stopColor="rgba(59,42,90,0)" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={-6} rx={128} ry={26} fill="url(#kbShadow)" />
      {open && back && <polygon points={lidPts} fill={lidFill} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />}
      {open && (
        <polygon
          points={poly([
            [0, BH, 0],
            [BW, BH, 0],
            [BW, BH, BD],
            [0, BH, BD],
          ])}
          fill="#4A2F1A"
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      )}
      {figure !== undefined && rise > 0 && (
        <g transform={`translate(${cx - figW / 2} ${figY}) scale(${figW / 200})`}>
          <ToyArt kind={figure} base={false} />
        </g>
      )}
      <polygon
        points={poly([
          [BW, 0, 0],
          [BW, 0, BD],
          [BW, BH, BD],
          [BW, BH, 0],
        ])}
        fill="url(#kbSide)"
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <polygon
        points={poly([
          [0, 0, 0],
          [BW, 0, 0],
          [BW, BH, 0],
          [0, BH, 0],
        ])}
        fill="url(#kbFront)"
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* flap seam + tape on the front */}
      <rect x={BW / 2 - 13} y={-BH} width={26} height={44} fill="rgba(255,255,255,0.28)" />
      {sticker && (
        <g>
          <circle cx={BW / 2} cy={-BH / 2 + 4} r={33} fill={C.gum} stroke="#fff" strokeWidth={6} />
          <text x={BW / 2} y={-BH / 2 + 24} textAnchor="middle" fontFamily={BAL} fontWeight={800} fontSize={58} fill="#fff">
            {label ?? "?"}
          </text>
        </g>
      )}
      {!back && (
        <g>
          <polygon points={lidPts} fill={lidFill} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          {lid < 10 && (
            <polygon
              points={poly([
                [BW / 2 - 13, BH, 0],
                [BW / 2 + 13, BH, 0],
                [BW / 2 + 13, BH, BD],
                [BW / 2 - 13, BH, BD],
              ])}
              fill="rgba(255,255,255,0.35)"
            />
          )}
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ shelf */

export type ShelfGeo = { x: number; y: number; cols: number; rows: number; cw: number; ch: number; f: number };
export const cubby = (g: ShelfGeo, i: number) => {
  const c = i % g.cols;
  const r = Math.floor(i / g.cols);
  const x = g.x + g.f + c * (g.cw + g.f);
  const y = g.y + g.f + r * (g.ch + g.f);
  return { x, y, w: g.cw, h: g.ch, cx: x + g.cw / 2, floor: y + g.ch - 12 };
};

/** Lilac wooden cubby shelf, drawn at its geometry; content goes on top via cubby(). */
export const Shelf: React.FC<{ g: ShelfGeo; id?: string }> = ({ g, id = "s" }) => {
  const W = g.cols * g.cw + (g.cols + 1) * g.f;
  const H = g.rows * g.ch + (g.rows + 1) * g.f;
  const top = 26;
  return (
    <svg
      width={W}
      height={H + top}
      viewBox={`0 ${-top} ${W} ${H + top}`}
      style={{ position: "absolute", left: g.x, top: g.y - top, overflow: "visible", filter: "drop-shadow(0 22px 22px rgba(59,42,90,0.28))" }}
    >
      <defs>
        <linearGradient id={`${id}wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9B8FF" />
          <stop offset="100%" stopColor="#A48BF5" />
        </linearGradient>
        <linearGradient id={`${id}in`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5E45B8" />
          <stop offset="35%" stopColor="#7A62D6" />
          <stop offset="100%" stopColor="#9B86EE" />
        </linearGradient>
      </defs>
      <polygon points={`0,0 ${W},0 ${W - 18},${-top} 18,${-top}`} fill="#E4DAFF" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={0} y={0} width={W} height={H} rx={8} fill={`url(#${id}wood)`} stroke={C.ink} strokeWidth={4} />
      {Array.from({ length: g.cols * g.rows }).map((_, i) => {
        const b = cubby({ ...g, x: 0, y: 0 }, i);
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill={`url(#${id}in)`} stroke={C.ink} strokeWidth={4} />
            <polygon points={`${b.x + 3},${b.y + b.h - 3} ${b.x + b.w - 3},${b.y + b.h - 3} ${b.x + b.w - 14},${b.y + b.h - 20} ${b.x + 14},${b.y + b.h - 20}`} fill="#B9A6FF" />
            <polygon points={`${b.x + 3},${b.y + 3} ${b.x + 14},${b.y + 14} ${b.x + 14},${b.y + b.h - 20} ${b.x + 3},${b.y + b.h - 3}`} fill="rgba(40,20,90,0.22)" />
          </g>
        );
      })}
      {Array.from({ length: g.rows + 1 }).map((_, r) => (
        <line key={r} x1={10} x2={W - 10} y1={r * (g.ch + g.f) + 3} y2={r * (g.ch + g.f) + 3} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ type + bits */

/** Gold (or any) display number with a thick ink outline. */
export const Num: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({ children, size, color = C.gold, stroke, style }) => (
  <span
    style={{
      fontFamily: BAL,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1,
      color,
      WebkitTextStroke: `${stroke ?? Math.max(8, size * 0.09)}px ${C.ink}`,
      paintOrder: "stroke fill",
      textShadow: `0 ${Math.round(size * 0.05)}px 0 rgba(59,42,90,0.28)`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

/** Rounded label pill, centred on (x, y). */
export const Pill: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  s?: number;
  rot?: number;
  border?: string;
  style?: React.CSSProperties;
}> = ({ x, y, children, bg = C.ink, color = "#fff", size = 44, s = 1, rot = 0, border, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(Math.max(0, s)),
      rotate: `${rot}deg`,
      background: bg,
      color,
      fontFamily: BAL,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.1,
      padding: `${size * 0.22}px ${size * 0.6}px ${size * 0.14}px`,
      borderRadius: 999,
      whiteSpace: "nowrap",
      border: border ?? `4px solid ${C.ink}`,
      boxShadow: "0 8px 0 rgba(59,42,90,0.25)",
      opacity: s > 0.01 ? 1 : 0,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Little star burst around a point. p: 0..1 progress. */
export const Burst: React.FC<{ x: number; y: number; p: number; r?: number; n?: number; color?: string; seed?: number }> = ({ x, y, p, r = 120, n = 10, color = C.gold, seed = 1 }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <svg style={{ position: "absolute", left: x - r * 1.4, top: y - r * 1.4, overflow: "visible" }} width={r * 2.8} height={r * 2.8}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(seed + i) * 0.5;
        const d = r * (0.35 + 0.75 * Math.sqrt(p)) * (0.8 + 0.4 * rand(seed * 3 + i));
        const sz = (10 + 10 * rand(seed + i * 5)) * (1 - p);
        return <Star4 key={i} x={r * 1.4 + Math.cos(a) * d} y={r * 1.4 + Math.sin(a) * d} r={sz} fill={i % 3 === 0 ? "#fff" : color} />;
      })}
    </svg>
  );
};

/** Odometer-style rolling number: every digit rolls like a mechanical counter. */
export const Odo: React.FC<{ value: number; decimals?: number; size: number; color?: string; prefix?: string; minInt?: number; hideLead?: boolean }> = ({
  value,
  decimals = 0,
  size,
  color = C.gold,
  prefix = "",
  minInt = 1,
  hideLead = false,
}) => {
  const V = Math.round(Math.max(0, value) * Math.pow(10, decimals) * 1000) / 1000;
  const intDigits = Math.max(minInt, String(Math.floor(V / Math.pow(10, decimals))).length);
  const n = intDigits + decimals;
  const lh = size * 1.18;
  const cols: React.ReactNode[] = [];
  const stroke = Math.max(8, size * 0.09);
  const glyph: React.CSSProperties = {
    fontFamily: BAL,
    fontWeight: 800,
    fontSize: size,
    lineHeight: `${lh}px`,
    height: lh,
    color,
    WebkitTextStroke: `${stroke}px ${C.ink}`,
    paintOrder: "stroke fill",
    textAlign: "center",
  };
  for (let p = n - 1; p >= 0; p--) {
    const raw = V / Math.pow(10, p);
    let pos: number;
    if (p === 0) {
      // the last digit ticks (no torn half-digits); the higher columns roll over as it passes 9
      pos = Math.floor(V % 10);
    } else {
      const digit = Math.floor(raw) % 10;
      const lower = V % Math.pow(10, p);
      const k = clamp01(lower - (Math.pow(10, p) - 1));
      pos = digit + clamp01((k - 0.7) / 0.3);
    }
    cols.push(
      <div
        key={p}
        style={{
          width: size * 0.58,
          height: lh,
          clipPath: `inset(0px ${-size}px)`,
          position: "relative",
          opacity: hideLead && p > decimals && V < Math.pow(10, p) - 0.3 ? 0 : 1,
          WebkitMaskImage: "linear-gradient(transparent 0%, #000 13%, #000 87%, transparent 100%)",
        }}
      >
        <div style={{ translate: `0 ${-pos * lh}px` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, k) => (
            <div key={k} style={glyph}>
              {d}
            </div>
          ))}
        </div>
      </div>,
    );
    if (p === decimals && decimals > 0) {
      cols.push(
        <div key="dot" style={{ ...glyph, width: size * 0.26 }}>
          .
        </div>,
      );
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", filter: `drop-shadow(0 ${size * 0.05}px 0 rgba(59,42,90,0.28))` }}>
      {prefix && <div style={{ ...glyph, paddingRight: size * 0.02 }}>{prefix}</div>}
      {cols}
    </div>
  );
};
