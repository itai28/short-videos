import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, PLAYFAIR } from "../../fonts";
import { VisualProps } from "../../types";
import { at, clamp01, popIn, rand, useT } from "../../visuals/util";
import { GalleryRoom } from "./Museum";
import { BRASS, BRASS_HI, BRASS_LO, CREAM, GOLD, LINING, NAVY, RED, SPOT } from "./palette";

const PX = 480;
const PY = 478;
const ARM = 250;
const CHAIN = 228;
const PAN = 118;

const copper = { top: "#E08A52", edge: "#7A3B17", hi: "#FFC79A" };
const silver = { top: "#D4D9E0", edge: "#6F7782", hi: "#FFFFFF" };

/** Heap of flat coins resting on a pan rim at (x, y). rows = coins per row, bottom first. */
const Heap: React.FC<{ x: number; y: number; rows: number[]; rx: number; ry: number; gap: number; rowH: number; th: number; c: typeof copper; seed: number }> = ({ x, y, rows, rx, ry, gap, rowH, th, c, seed }) => (
  <g>
    {rows.map((n, j) =>
      Array.from({ length: n }).map((_, i) => {
        const cx = x + (i - (n - 1) / 2) * gap + (rand(seed + j * 31 + i) - 0.5) * 4;
        const cy = y - 3 - j * rowH + (rand(seed + j * 17 + i * 3) - 0.5) * 3;
        return (
          <g key={`${j}-${i}`}>
            <ellipse cx={cx} cy={cy + th} rx={rx} ry={ry} fill={c.edge} />
            <rect x={cx - rx} y={cy} width={rx * 2} height={th} fill={c.edge} />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={c.top} stroke={c.edge} strokeWidth={1.2} />
            <ellipse cx={cx - rx * 0.25} cy={cy - ry * 0.25} rx={rx * 0.45} ry={ry * 0.35} fill={c.hi} opacity={0.45} />
          </g>
        );
      }),
    )}
  </g>
);

const Pan: React.FC<{ ex: number; ey: number; kind: "penny" | "nickel" }> = ({ ex, ey, kind }) => {
  const rim = ey + CHAIN;
  return (
    <g>
      {[-PAN + 6, 0, PAN - 6].map((dx, i) => (
        <g key={i}>
          <line x1={ex} y1={ey} x2={ex + dx} y2={rim - (i === 1 ? 14 : 0)} stroke={BRASS_LO} strokeWidth={5} strokeDasharray="8 4" />
          <line x1={ex} y1={ey} x2={ex + dx} y2={rim - (i === 1 ? 14 : 0)} stroke={BRASS_HI} strokeWidth={2} strokeDasharray="8 4" opacity={0.6} />
        </g>
      ))}
      <ellipse cx={ex} cy={rim} rx={PAN} ry={17} fill="#5E4013" />
      {kind === "penny" ? (
        <Heap x={ex} y={rim} rows={[19, 17, 15, 13, 11, 9, 7, 5, 3, 1]} rx={12.5} ry={5} gap={11.6} rowH={8.6} th={3} c={copper} seed={3} />
      ) : (
        <Heap x={ex} y={rim} rows={[7, 6, 4, 2, 1]} rx={16.5} ry={6.5} gap={30} rowH={11} th={4} c={silver} seed={9} />
      )}
      <path d={`M ${ex - PAN} ${rim} A ${PAN} 17 0 0 0 ${ex + PAN} ${rim} Q ${ex + PAN * 0.8} ${rim + 52} ${ex} ${rim + 54} Q ${ex - PAN * 0.8} ${rim + 52} ${ex - PAN} ${rim} Z`} fill="url(#pmPanG)" />
      <path d={`M ${ex - PAN} ${rim} A ${PAN} 17 0 0 0 ${ex + PAN} ${rim}`} fill="none" stroke={BRASS_HI} strokeWidth={4} />
      <circle cx={ex} cy={ey} r={9} fill={BRASS_HI} stroke={BRASS_LO} strokeWidth={3} />
    </g>
  );
};

/** Antique brass balance: 100 pennies (left) vs 20 nickels (right). theta in degrees, negative = left side down. */
const Balance: React.FC<{ theta: number; center: React.ReactNode; ring: number }> = ({ theta, center, ring }) => {
  const r = (theta * Math.PI) / 180;
  const lx = PX - ARM * Math.cos(r);
  const ly = PY - ARM * Math.sin(r);
  const rx = PX + ARM * Math.cos(r);
  const ry = PY + ARM * Math.sin(r);
  const nx = PX - 162 * Math.sin(r);
  const ny = PY + 162 * Math.cos(r);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="pmPostG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={BRASS_LO} />
          <stop offset="0.38" stopColor={BRASS_HI} />
          <stop offset="0.7" stopColor={BRASS} />
          <stop offset="1" stopColor={BRASS_LO} />
        </linearGradient>
        <linearGradient id="pmPanG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRASS_HI} />
          <stop offset="0.5" stopColor={BRASS} />
          <stop offset="1" stopColor={BRASS_LO} />
        </linearGradient>
        <linearGradient id="pmBeamG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRASS_HI} />
          <stop offset="0.55" stopColor={BRASS} />
          <stop offset="1" stopColor={BRASS_LO} />
        </linearGradient>
      </defs>
      {/* base + post */}
      <ellipse cx={PX} cy={1186} rx={230} ry={18} fill="#000" opacity={0.5} />
      <rect x={PX - 190} y={1140} width={380} height={42} rx={10} fill="url(#pmPostG)" />
      <rect x={PX - 130} y={1104} width={260} height={42} rx={10} fill="url(#pmPostG)" />
      <rect x={PX - 190} y={1140} width={380} height={4} fill="#fff" opacity={0.35} />
      <rect x={PX - 16} y={PY} width={32} height={630} fill="url(#pmPostG)" />
      {[640, 820, 1000].map((y) => (
        <rect key={y} x={PX - 24} y={y} width={48} height={16} rx={5} fill="url(#pmPostG)" />
      ))}
      {/* dial behind the needle */}
      {(() => {
        const pt = (rr: number, deg: number) => [PX + rr * Math.sin((deg * Math.PI) / 180), PY + rr * Math.cos((deg * Math.PI) / 180)];
        const [a1x, a1y] = pt(172, -30);
        const [a2x, a2y] = pt(172, 30);
        const [b1x, b1y] = pt(118, 30);
        const [b2x, b2y] = pt(118, -30);
        return (
          <g>
            <path d={`M ${a1x} ${a1y} A 172 172 0 0 0 ${a2x} ${a2y} L ${b1x} ${b1y} A 118 118 0 0 1 ${b2x} ${b2y} Z`} fill="#13213A" stroke="url(#pmPostG)" strokeWidth={6} strokeLinejoin="round" />
            {[-24, -16, -8, 0, 8, 16, 24].map((a) => {
              const [x1, y1] = pt(150, a);
              const [x2, y2] = pt(166, a);
              return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a === 0 ? GOLD : BRASS_HI} strokeWidth={a === 0 ? 5 : 3} />;
            })}
          </g>
        );
      })()}
      <line x1={PX} y1={PY} x2={nx} y2={ny} stroke="#1A120A" strokeWidth={6} strokeLinecap="round" />
      <line x1={PX} y1={PY} x2={nx} y2={ny} stroke={BRASS_HI} strokeWidth={2.5} strokeLinecap="round" />
      {/* finial */}
      <path d={`M ${PX} ${PY - 118} L ${PX + 12} ${PY - 66} L ${PX - 12} ${PY - 66} Z`} fill="url(#pmPostG)" />
      <circle cx={PX} cy={PY - 70} r={14} fill="url(#pmPostG)" />
      {/* pans hang straight down */}
      <Pan ex={lx} ey={ly} kind="penny" />
      <Pan ex={rx} ey={ry} kind="nickel" />
      {/* beam */}
      <g transform={`rotate(${theta} ${PX} ${PY})`}>
        <path
          d={`M ${PX - ARM - 10} ${PY - 6} Q ${PX - 120} ${PY - 12} ${PX} ${PY - 24} Q ${PX + 120} ${PY - 12} ${PX + ARM + 10} ${PY - 6} L ${PX + ARM + 10} ${PY + 6} Q ${PX + 120} ${PY + 12} ${PX} ${PY + 26} Q ${PX - 120} ${PY + 12} ${PX - ARM - 10} ${PY + 6} Z`}
          fill="url(#pmBeamG)"
          stroke={BRASS_LO}
          strokeWidth={3}
        />
        <circle cx={PX - ARM - 10} cy={PY} r={14} fill={BRASS_HI} stroke={BRASS_LO} strokeWidth={3} />
        <circle cx={PX + ARM + 10} cy={PY} r={14} fill={BRASS_HI} stroke={BRASS_LO} strokeWidth={3} />
      </g>
      {/* medallion at the pivot */}
      <circle cx={PX} cy={PY} r={58} fill="url(#pmPostG)" stroke={BRASS_LO} strokeWidth={4} />
      <circle cx={PX} cy={PY} r={44} fill={NAVY} stroke={BRASS_LO} strokeWidth={3} />
      {ring > 0 ? (
        <circle cx={PX} cy={PY} r={51} fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray={`${2 * Math.PI * 51 * ring} 999`} transform={`rotate(-90 ${PX} ${PY})`} strokeLinecap="round" />
      ) : null}
      <foreignObject x={PX - 44} y={PY - 44} width={88} height={88}>
        <div style={{ width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 64, color: CREAM, lineHeight: 1, ...LINING }}>
          {center}
        </div>
      </foreignObject>
    </svg>
  );
};

const Card: React.FC<{ x: number; y: number; flip: number; front: React.ReactNode; back: React.ReactNode; hot?: number; s?: number; lit?: number }> = ({ x, y, flip, front, back, hot = 0, s = 1, lit = 0 }) => {
  const sx = Math.abs(Math.cos(flip * Math.PI));
  return (
    <div
      style={{
        position: "absolute",
        left: x - 150,
        top: y,
        width: 300,
        height: 214,
        scale: `${Math.max(0.02, sx) * s * (1 + 0.08 * lit)} ${s * (1 + 0.08 * lit)}`,
        opacity: s > 0.01 ? 1 : 0,
        borderRadius: 22,
        background: "linear-gradient(180deg, #1A2A44 0%, #0B1424 100%)",
        border: `4px solid ${hot > 0 ? `rgba(255,77,77,${0.4 + 0.6 * hot})` : lit > 0.05 ? GOLD : BRASS}`,
        boxShadow: `0 16px 30px rgba(0,0,0,0.55)${hot > 0 ? `, 0 0 ${36 * hot}px rgba(255,77,77,${0.7 * hot})` : ""}${lit > 0.05 ? `, 0 0 ${40 * lit}px rgba(255,204,51,${0.6 * lit})` : ""}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: CREAM,
      }}
    >
      {flip < 0.5 ? front : back}
    </div>
  );
};

const Line1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, lineHeight: 1.15, whiteSpace: "nowrap", color: "#C7D2E2" }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = GOLD, size = 104 }) => (
  <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: size, lineHeight: 1.0, color, whiteSpace: "nowrap", textShadow: "0 6px 0 rgba(0,0,0,0.45)", ...LINING }}>{children}</div>
);

/** Quiz balance. mode "guess": wobbles, 3-2-1 on the medallion across the hold. mode "reveal": tips 14 deg to the penny side at the reveal. */
export const ScaleScene: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mode = scene.visual.mode as string;
  const abs = scene.start + t;
  const hold = (scene.hold as number) ?? 0;
  const holdStart = scene.dur - hold;
  const amp = mode === "guess" ? interpolate(t, [holdStart - 0.4, holdStart], [2.5, 4.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 4.5;
  const wob = amp * Math.sin(abs * Math.PI * 2 * 0.85);
  const R = mode === "reveal" ? at(scene, "reveal", 0.5) : Infinity;
  const tipS = Number.isFinite(R) ? spring({ frame: frame - Math.round(R * fps), fps, config: { damping: 7, stiffness: 140, mass: 1.1 } }) : 0;
  const wobAtR = Number.isFinite(R) ? 4.5 * Math.sin((scene.start + R) * Math.PI * 2 * 0.85) : 0;
  const settle = Number.isFinite(R) ? clamp01((t - R - 1.4) / 0.8) : 0;
  const theta = t < R ? wob : wobAtR + (-14 - wobAtR) * tipS + 1.1 * settle * Math.sin((t - R - 1.4) * 2.4);
  const inHold = mode === "guess" && t >= holdStart;
  const ring = inHold ? clamp01((t - holdStart) / Math.max(0.1, hold)) : 0;
  const digit = inHold ? String(Math.max(1, 3 - Math.floor((t - holdStart) / Math.max(0.1, hold / 3)))) : null;
  const center = mode === "reveal" ? (t >= R ? "¢" : "?") : digit ?? "?";
  // each card flips to its cost just before the voice says it
  const w369 = scene.words.find((w) => /^\$3\.69/.test(w.w))?.t ?? R + 1.8;
  const w276 = scene.words.find((w) => /^\$2\.76/.test(w.w))?.t ?? R + 3.4;
  const wCost = scene.words.find((w) => /^cost$/i.test(w.w))?.t ?? R + 0.7;
  const flip = Number.isFinite(R) ? clamp01((t - (w369 - 0.3)) / 0.3) : 0;
  const hot = Number.isFinite(R) ? clamp01((t - (w369 + 0.05)) / 0.25) : 0;
  const stamp = Number.isFinite(R) ? popIn(t, w369 + 0.12, 0.25) : 0;
  const enter = mode === "guess" ? popIn(t, 0, 0.35) : 1;
  // guess beats: cards appear on "$1", each side lights up as it is named
  const wAt = (re: RegExp, fb: number) => scene.words.find((w) => re.test(w.w))?.t ?? fb;
  const bump = (a: number) => (t >= a ? Math.sin(Math.PI * clamp01((t - a) / 0.6)) : 0);
  const cardsIn = mode === "guess" ? popIn(t, wAt(/^\$1/, 0.6) - 0.08, 0.3) : 1;
  const litL = mode === "guess" ? bump(wAt(/^100$/, 2.1) - 0.05) : 0;
  const litR = mode === "guess" ? bump(wAt(/^20$/, 3.2) - 0.05) : 0;
  const titleA = mode === "guess" ? 1 : 1 - clamp01((t - (wCost - 0.15)) / 0.15);
  const titleB = mode === "reveal" ? popIn(t, wCost - 0.1, 0.3) : 0;
  const push = mode === "reveal" ? interpolate(t, [w369, scene.dur], [1, 1.035], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill>
      <GalleryRoom spots={[{ x: 480, w: 380, a: 0.85 }]} tt={abs} motes={0.7} />
      <div style={{ position: "absolute", left: 70, width: 820, top: 214, textAlign: "center" }}>
        <div style={{ position: "relative", height: 84 }}>
          <div style={{ position: "absolute", inset: 0, fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 64, color: CREAM, opacity: titleA, textShadow: "0 6px 16px rgba(0,0,0,0.6)" }}>GUESS BEFORE IT TIPS</div>
          <div style={{ position: "absolute", inset: 0, fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 66, color: RED, scale: String(titleB), opacity: titleB > 0 ? 1 : 0, textShadow: "0 6px 16px rgba(0,0,0,0.6)" }}>PENNIES COST MORE</div>
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 2, color: "#9FB2CC", marginTop: 6 }}>COST TO MAKE $1 OF COINS</div>
      </div>
      <AbsoluteFill style={{ scale: String(push), transformOrigin: "480px 760px" }}>
      <AbsoluteFill style={{ scale: String(0.9 + 0.1 * enter), opacity: enter, transformOrigin: "50% 60%" }}>
        <Balance theta={theta} center={center} ring={ring} />
      </AbsoluteFill>
      <Card
        x={238}
        y={858}
        flip={flip}
        hot={hot}
        s={cardsIn}
        lit={litL}
        front={
          <>
            <Line1>100 PENNIES</Line1>
            <Big>= $1</Big>
          </>
        }
        back={
          <>
            <Line1>100 × 3.69¢</Line1>
            <Big size={96}>$3.69</Big>
          </>
        }
      />
      <Card
        x={722}
        y={858}
        s={cardsIn}
        lit={litR}
        flip={Number.isFinite(R) ? clamp01((t - (w276 - 0.3)) / 0.3) : 0}
        front={
          <>
            <Line1>20 NICKELS</Line1>
            <Big>= $1</Big>
          </>
        }
        back={
          <>
            <Line1>20 × 13.78¢</Line1>
            <Big size={96}>$2.76</Big>
          </>
        }
      />
      {stamp > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 238,
            top: 846,
            translate: "-50% -50%",
            rotate: "-7deg",
            scale: String(0.6 + 0.4 * stamp),
            opacity: stamp,
            background: RED,
            color: "#fff",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 40,
            padding: "6px 20px",
            borderRadius: 10,
            boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          COSTS MORE
        </div>
      ) : null}
      {[
        { x: 230, v: litL },
        { x: 730, v: litR },
      ].map((g) =>
        g.v > 0.01 ? <div key={g.x} style={{ position: "absolute", left: g.x, top: 690, translate: "-50% -50%", width: 380, height: 300, borderRadius: "50%", background: `radial-gradient(ellipse, ${SPOT}66 0%, transparent 70%)`, opacity: g.v, mixBlendMode: "screen" }} /> : null,
      )}
      {mode === "reveal" && t >= R ? (
        <div style={{ position: "absolute", left: 230, top: 610, translate: "-50% -50%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${SPOT}55 0%, transparent 70%)`, opacity: 1 - clamp01((t - R) / 0.8) }} />
      ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
