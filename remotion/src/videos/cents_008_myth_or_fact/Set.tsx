import React from "react";
import { AbsoluteFill } from "remotion";
import { BODY, BUNGEE } from "../../fonts";
import { Centy } from "../../shared/Centy";
import { clamp01, rand } from "../../visuals/util";

/** Palette for the game-show stage (original set, not styled after any real show). */
export const P = {
  wall: "#2A0F4F",
  deep: "#14062B",
  violet: "#4B1E8A",
  teal: "#1ED6C4",
  tealDark: "#0B8F84",
  red: "#FF3B5C",
  redDark: "#C0123A",
  green: "#31E07A",
  greenDark: "#14A851",
  gold: "#FFCC33",
  ink: "#2A0F4F",
  bossWall: "#3E0B26",
  bossDeep: "#17030D",
};

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mix = (a: string, b: string, k: number) => {
  const A = hex(a);
  const B = hex(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * clamp01(k)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hex(h);
  return `rgba(${r},${g},${b},${a})`;
};
const mixA = (a: string, b: string, k: number, alpha: number) => mix(a, b, k).replace("rgb(", "rgba(").replace(")", `,${alpha})`);

/** Full-frame stage: LED wall, halo rings, sweeping spotlights, floor. boss 0..1 turns the lights red. */
export const Backdrop: React.FC<{ beam: number; halo: number; vt: number; boss: number }> = ({ beam, halo, vt, boss }) => {
  const light = mix(P.teal, P.red, boss);
  const beams = [
    { ox: 40, oy: -90, rot: -21 + beam },
    { ox: 1040, oy: -90, rot: 21 - beam },
  ];
  const floorY = 1430;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 60% at 46% 40%, ${mix(P.violet, "#7A1636", boss)} 0%, ${mix(P.wall, P.bossWall, boss)} 48%, ${mix(P.deep, P.bossDeep, boss)} 100%)`,
        }}
      />
      {/* LED wall dots, fading toward the floor */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${mixA("#B9A6FF", "#FF9AB0", boss, 0.16)} 2.5px, transparent 3.5px)`,
          backgroundSize: "34px 34px",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, transparent 72%)",
        }}
      />
      {/* halo rings behind the card */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="mythHaloFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={light} stopOpacity={0.22} />
            <stop offset="70%" stopColor={light} stopOpacity={0.06} />
            <stop offset="100%" stopColor={light} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="mythBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light} stopOpacity={0.6} />
            <stop offset="55%" stopColor={light} stopOpacity={0.16} />
            <stop offset="100%" stopColor={light} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="mythPool" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={light} stopOpacity={0.5} />
            <stop offset="100%" stopColor={light} stopOpacity={0} />
          </radialGradient>
          <filter id="mythBlur" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <circle cx={480} cy={840} r={560} fill="url(#mythHaloFill)" />
        <g transform={`rotate(${halo} 480 840)`}>
          <circle cx={480} cy={840} r={500} fill="none" stroke={light} strokeOpacity={0.22} strokeWidth={6} strokeDasharray="40 91" />
        </g>
        <g transform={`rotate(${-halo * 1.5} 480 840)`}>
          <circle cx={480} cy={840} r={455} fill="none" stroke="#ffffff" strokeOpacity={0.07} strokeWidth={3} strokeDasharray="6 22" />
        </g>
        {/* floor */}
        <ellipse cx={480} cy={floorY + 260} rx={900} ry={330} fill={mix("#1C0838", "#22040F", boss)} />
        <ellipse cx={480} cy={floorY + 250} rx={820} ry={290} fill="none" stroke={light} strokeOpacity={0.35} strokeWidth={5} />
        <ellipse cx={480} cy={floorY + 250} rx={760} ry={250} fill="none" stroke="#ffffff" strokeOpacity={0.08} strokeWidth={3} />
        {/* spotlights */}
        <g style={{ mixBlendMode: "screen" }}>
          {beams.map((b, i) => {
            const r = (b.rot * Math.PI) / 180;
            const L = (floorY + 120 - b.oy) / Math.cos(r);
            const hx = b.ox - Math.sin(r) * L;
            return (
              <g key={i}>
                <g filter="url(#mythBlur)" transform={`rotate(${b.rot} ${b.ox} ${b.oy})`}>
                  <polygon points={`${b.ox - 20},${b.oy} ${b.ox + 20},${b.oy} ${b.ox + 250},${b.oy + 1800} ${b.ox - 250},${b.oy + 1800}`} fill="url(#mythBeam)" />
                </g>
                <ellipse cx={hx} cy={floorY + 120} rx={230} ry={56} fill="url(#mythPool)" />
              </g>
            );
          })}
        </g>
        {/* twinkles */}
        {Array.from({ length: 26 }).map((_, i) => {
          const x = 60 + rand(i * 3.1) * 960;
          const y = 120 + rand(i * 7.7) * 1250;
          const tw = 0.5 + 0.5 * Math.sin(vt * (2 + rand(i) * 3) + i * 1.7);
          return <circle key={i} cx={x} cy={y} r={2 + rand(i * 5.3) * 2.5} fill="#ffffff" opacity={0.08 + 0.32 * tw * tw} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 65% at 50% 45%, transparent 55%, rgba(5,0,15,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Marquee banner with chasing bulbs, y 162-240. */
export const Marquee: React.FC<{ vt: number; chase: number }> = ({ chase }) => {
  const L = 70;
  const T = 162;
  const W = 820;
  const H = 78;
  const bulbs: { x: number; y: number }[] = [];
  for (let x = L + 22; x <= L + W - 22; x += 31) bulbs.push({ x, y: T + 9 });
  bulbs.push({ x: L + W - 9, y: T + H / 2 });
  for (let x = L + W - 22; x >= L + 22; x -= 31) bulbs.push({ x, y: T + H - 9 });
  bulbs.push({ x: L + 9, y: T + H / 2 });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: L,
          top: T,
          width: W,
          height: H,
          borderRadius: 22,
          background: "linear-gradient(180deg, #3B1A73 0%, #1C0A3C 100%)",
          border: "4px solid #8C74D8",
          boxShadow: "0 10px 0 rgba(8,0,20,0.55), 0 0 30px rgba(30,214,196,0.25), inset 0 2px 0 rgba(255,255,255,0.25)",
        }}
      />
      <svg width={1080} height={300} style={{ position: "absolute", left: 0, top: 0 }}>
        {bulbs.map((b, i) => {
          const on = (((i - chase) % 4) + 4) % 4 === 0;
          return (
            <g key={i}>
              {on && <circle cx={b.x} cy={b.y} r={11} fill="#FFE9A8" opacity={0.35} />}
              <circle cx={b.x} cy={b.y} r={5.5} fill={on ? "#FFF6D6" : "#8A6A3A"} />
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: L,
          top: T,
          width: W,
          height: H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BUNGEE,
          fontSize: 48,
          letterSpacing: 2,
          color: "#ffffff",
          textShadow: "0 0 18px rgba(30,214,196,0.9), 0 4px 0 #14062B",
        }}
      >
        BEAT YOUR PARENTS
      </div>
    </>
  );
};

/** Red BOSS ROUND sign that drops on chains over the marquee. y = sign top. */
export const BossSign: React.FC<{ y: number; swing: number }> = ({ y, swing }) => {
  if (y < -200) return null;
  const left = 150;
  const w = 660;
  const h = 96;
  const links = (x: number) => {
    const out = [];
    for (let yy = -40; yy < y + 10; yy += 26) out.push(<ellipse key={yy} cx={x} cy={yy} rx={8} ry={14} fill="none" stroke="#C9C2D9" strokeWidth={5} />);
    return out;
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 420, rotate: `${swing}deg`, transformOrigin: "480px 0px" }}>
      <svg width={1080} height={420} style={{ position: "absolute", inset: 0 }}>
        {links(left + 70)}
        {links(left + w - 70)}
      </svg>
      <div
        style={{
          position: "absolute",
          left,
          top: y,
          width: w,
          height: h,
          borderRadius: 18,
          background: `linear-gradient(180deg, #FF5A76 0%, ${P.red} 45%, ${P.redDark} 100%)`,
          border: "5px solid #2B0712",
          boxShadow: "0 14px 0 rgba(20,0,8,0.6), 0 0 50px rgba(255,59,92,0.6), inset 0 3px 0 rgba(255,255,255,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BUNGEE,
          fontSize: 62,
          color: "#ffffff",
          letterSpacing: 3,
          WebkitTextStroke: "8px #2B0712",
          paintOrder: "stroke fill",
        }}
      >
        BOSS ROUND
        {[24, w - 34].map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 7, top: h / 2 - 9, width: 16, height: 16, borderRadius: 8, background: "#FFD6DE", boxShadow: "inset 0 -3px 0 #9A1030" }} />
        ))}
      </div>
    </div>
  );
};

/** YOU _/3 vs PARENTS _/3. Blank fill-ins only (never a fake score). pulse 0..1 makes the blanks glow gold. */
export const Scoreboard: React.FC<{ pulse: number }> = ({ pulse }) => {
  const Box: React.FC = () => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        padding: "2px 14px 4px",
        borderRadius: 14,
        background: "#0B0320",
        border: `3px solid ${mix("#5B4790", P.gold, pulse)}`,
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.8), 0 0 ${24 * pulse}px ${rgba(P.gold, 0.8 * pulse)}`,
        fontFamily: BUNGEE,
        fontSize: 42,
        color: P.gold,
        textShadow: `0 0 ${6 + 10 * pulse}px rgba(255,204,51,0.8)`,
      }}
    >
      <span style={{ display: "inline-block", width: 34, borderBottom: `5px solid ${P.gold}`, height: 34, marginRight: 4, scale: String(1 + 0.18 * pulse) }} />
      /3
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 260,
        height: 86,
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: 24,
        background: "linear-gradient(180deg, #24104A 0%, #12062A 100%)",
        border: `4px solid ${P.teal}`,
        boxShadow: "0 10px 0 rgba(8,0,20,0.55), 0 0 26px rgba(30,214,196,0.35)",
        fontFamily: BUNGEE,
        fontSize: 40,
        color: "#ffffff",
      }}
    >
      <span>YOU</span>
      <Box />
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: P.teal, margin: "0 2px" }}>vs</span>
      <span>PARENTS</span>
      <Box />
    </div>
  );
};

/** Centy as the show's host: bow tie and a little microphone. */
export const Host: React.FC<{ mouth: number; expr: "talk" | "smug" | "shocked" | "worried" | "hype"; look: number; bob: number }> = ({ mouth, expr, look, bob }) => (
  <div style={{ position: "absolute", left: 742, top: 232 + bob, filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.5))" }}>
    <Centy size={132} mouth={mouth} expr={expr} look={look} headset={false}>
      {/* microphone */}
      <g transform="rotate(-24 30 170)">
        <rect x={22} y={150} width={16} height={58} rx={7} fill="#2B2440" stroke="#14062B" strokeWidth={4} />
        <circle cx={30} cy={146} r={17} fill="#9A93B5" stroke="#14062B" strokeWidth={4} />
        <path d="M18 140 L42 140 M17 148 L43 148" stroke="#5E577A" strokeWidth={3} />
      </g>
      {/* bow tie */}
      <g transform="translate(100 196)">
        <path d="M-6 0 L-40 -18 L-40 18 Z" fill={P.teal} stroke="#14062B" strokeWidth={5} strokeLinejoin="round" />
        <path d="M6 0 L40 -18 L40 18 Z" fill={P.teal} stroke="#14062B" strokeWidth={5} strokeLinejoin="round" />
        <rect x={-10} y={-11} width={20} height={22} rx={6} fill={P.tealDark} stroke="#14062B" strokeWidth={5} />
      </g>
    </Centy>
  </div>
);

/** Arcade-style buzzer. light 0..1 (0.6 = idle), press 0..1 pushes the dome down. */
export const Buzzer: React.FC<{ cx: number; cy: number; color: string; dark: string; label: string; light: number; press: number; id: string; s?: number; opacity?: number }> = ({
  cx,
  cy,
  color,
  dark,
  label,
  light,
  press,
  id,
  s = 1,
  opacity = 1,
}) => {
  const w = 250;
  const h = 230;
  const dy = press * 12;
  const glow = clamp01((light - 0.6) / 0.4);
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, scale: String(s), opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={`${id}Dome`} cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
            <stop offset="22%" stopColor={color} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
          <radialGradient id={`${id}Glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}Base`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1B1230" />
            <stop offset="45%" stopColor="#4A3B6E" />
            <stop offset="100%" stopColor="#140C26" />
          </linearGradient>
        </defs>
        <ellipse cx={w / 2} cy={92} rx={150} ry={130} fill={`url(#${id}Glow)`} opacity={0.15 + 0.85 * glow} />
        <ellipse cx={w / 2} cy={212} rx={118} ry={16} fill="#000" opacity={0.45} />
        {/* housing */}
        <path d={`M20 128 L20 178 A105 30 0 0 0 230 178 L230 128 Z`} fill={`url(#${id}Base)`} stroke="#0A0418" strokeWidth={4} />
        <ellipse cx={w / 2} cy={128} rx={105} ry={30} fill="#3A2C5C" stroke="#0A0418" strokeWidth={4} />
        <ellipse cx={w / 2} cy={128} rx={86} ry={22} fill="#120A22" />
        {/* dome */}
        <g transform={`translate(0 ${dy})`} style={{ filter: `brightness(${0.62 + 0.55 * light})` }}>
          <path d={`M40 ${122} A85 74 0 0 1 210 ${122} A85 18 0 0 1 40 ${122} Z`} fill={`url(#${id}Dome)`} stroke="#0A0418" strokeWidth={4} />
          <ellipse cx={92} cy={74} rx={26} ry={11} fill="#ffffff" opacity={0.55} transform="rotate(-24 92 74)" />
        </g>
        {/* label plate */}
        <rect x={50} y={146} width={150} height={52} rx={12} fill={dark} stroke="#0A0418" strokeWidth={4} />
        <text x={w / 2} y={186} textAnchor="middle" fontFamily={BUNGEE} fontSize={40} fill="#ffffff">
          {label}
        </text>
      </svg>
    </div>
  );
};

/** Countdown ring. p = remaining 0..1. center: "?" | digit | "x" | "check". */
export const Ring: React.FC<{ cx: number; cy: number; p: number; color: string; center: string; cs?: number; s?: number; opacity?: number }> = ({
  cx,
  cy,
  p,
  color,
  center,
  cs = 1,
  s = 1,
  opacity = 1,
}) => {
  const r = 78;
  const C = 2 * Math.PI * r;
  return (
    <div style={{ position: "absolute", left: cx - 110, top: cy - 110, width: 220, height: 220, scale: String(s), opacity }}>
      <svg width={220} height={220} viewBox="0 0 220 220">
        <defs>
          <radialGradient id="mythBezel" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#3E2670" />
            <stop offset="100%" stopColor="#0E0420" />
          </radialGradient>
        </defs>
        <circle cx={110} cy={116} r={102} fill="#000" opacity={0.4} />
        <circle cx={110} cy={110} r={102} fill="url(#mythBezel)" stroke="#8C74D8" strokeWidth={4} />
        <circle cx={110} cy={110} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={18} />
        <circle
          cx={110}
          cy={110}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - clamp01(p))}
          transform="rotate(-90 110 110)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          opacity={p > 0.002 ? 1 : 0}
        />
        <g transform={`translate(110 110) scale(${cs})`}>
          {center === "x" ? (
            <g stroke={P.red} strokeWidth={20} strokeLinecap="round">
              <path d="M-30 -30 L30 30 M30 -30 L-30 30" />
            </g>
          ) : center === "check" ? (
            <path d="M-34 2 L-10 26 L36 -26" stroke={P.green} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <text x={0} y={36} textAnchor="middle" fontFamily={BUNGEE} fontSize={center === "?" ? 104 : 96} fill={P.gold} stroke="#14062B" strokeWidth={8} paintOrder="stroke">
              {center}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};

/** Burst of sparks from a point after a reveal. k = seconds since the burst. */
export const Burst: React.FC<{ x: number; y: number; k: number; color: string; seed: number }> = ({ x, y, k, color, seed }) => {
  if (k < 0 || k > 1.1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const a = -Math.PI / 2 + (rand(seed + i * 3.3) - 0.5) * 2.6;
        const v = 520 + rand(seed + i * 1.7) * 520;
        const px = x + Math.cos(a) * v * k;
        const py = y + Math.sin(a) * v * k + 900 * k * k;
        const c = i % 3 === 0 ? P.gold : color;
        const sz = 7 + rand(seed + i) * 9;
        return <rect key={i} x={px - sz / 2} y={py - sz / 2} width={sz} height={sz * 1.6} rx={2} fill={c} opacity={clamp01(1.1 - k)} transform={`rotate(${k * 720 * (rand(seed + i * 9) - 0.5)} ${px} ${py})`} />;
      })}
    </svg>
  );
};
