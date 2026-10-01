import React from "react";
import { noise2D } from "@remotion/noise";
import { CAVEAT, MARKER } from "../../fonts";
import { Desk, GRAIN, HL, InkPath, NAVY, Pt, RED, boil, jitter, smoothPath } from "./Ink";

/**
 * Baby Centy: a brand-new coin with an oversized headset (this video's take on the channel mascot).
 * squint 0..1 narrows the eyes into a skeptical look. Drawn in a 200x200 face box like the shared Centy.
 */
export const BabyCenty: React.FC<{ size: number; squint?: number; blink?: boolean; u?: number; id?: string }> = ({ size, squint = 0, blink = false, u = 0, id = "bc" }) => {
  const s = Math.max(0, Math.min(1, squint));
  const lerp = (a: number, b: number) => a + (b - a) * s;
  const eyes = [72, 128];
  return (
    <svg width={size} height={size * 1.1} viewBox="-60 -80 320 352" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}face`} cx="70" cy="58" r="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF6CC" />
          <stop offset="38%" stopColor="#FFD54A" />
          <stop offset="100%" stopColor="#C98A00" />
        </radialGradient>
        {eyes.map((x, i) => (
          <clipPath key={i} id={`${id}eye${i}`}>
            <ellipse cx={x} cy={96} rx={22} ry={26} />
          </clipPath>
        ))}
      </defs>
      {/* oversized headset band (behind the head) */}
      <path d="M-20 112 Q100 -176 220 112" fill="none" stroke="#23232f" strokeWidth={22} strokeLinecap="round" />
      <path d="M-6 74 Q100 -150 206 74" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={100} cy={196} rx={86} ry={10} fill="rgba(60,30,0,0.18)" />
      {/* face */}
      <circle cx={100} cy={100} r={92} fill={`url(#${id}face)`} stroke="#9A6A00" strokeWidth={5} />
      {Array.from({ length: 72 }).map((_, i) => {
        const a = (i / 72) * Math.PI * 2;
        return <line key={i} x1={100 + Math.cos(a) * 86} y1={100 + Math.sin(a) * 86} x2={100 + Math.cos(a) * 91} y2={100 + Math.sin(a) * 91} stroke="#B98300" strokeWidth={2} />;
      })}
      <circle cx={100} cy={100} r={79} fill="none" stroke="#E0A200" strokeWidth={4} />
      <path d="M40 64 Q58 34 94 27" stroke="rgba(255,255,255,0.85)" strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d="M150 160 Q166 146 172 128" stroke="rgba(255,255,255,0.45)" strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* blush */}
      <ellipse cx={46} cy={128} rx={15} ry={9} fill="#FF8A8A" opacity={0.55 * (1 - 0.6 * s)} />
      <ellipse cx={154} cy={128} rx={15} ry={9} fill="#FF8A8A" opacity={0.55 * (1 - 0.6 * s)} />
      {/* eyes */}
      {eyes.map((x, i) => {
        const dir = i === 0 ? 1 : -1; // lids tilt down toward the nose when squinting
        const top = lerp(62, 92);
        if (blink) return <path key={i} d={`M${x - 18} 98 Q${x} 106 ${x + 18} 98`} stroke="#2b1a05" strokeWidth={6} strokeLinecap="round" fill="none" />;
        return (
          <g key={i}>
            <ellipse cx={x} cy={96} rx={22} ry={26} fill="#fff" />
            <g clipPath={`url(#${id}eye${i})`}>
              <circle cx={x + 1} cy={lerp(91, 97)} r={15} fill="#2b1a05" />
              <circle cx={x - 5} cy={lerp(84, 92)} r={6} fill="#fff" />
              <circle cx={x + 6} cy={lerp(98, 102)} r={3} fill="#fff" />
              <path d={`M${x - 30} 50 L${x + 30} 50 L${x + 30} ${top - dir * 5 * s} L${x - 30} ${top + dir * 5 * s} Z`} fill={`url(#${id}face)`} />
              <path d={`M${x - 30} 140 L${x + 30} 140 L${x + 30} ${lerp(124, 112)} L${x - 30} ${lerp(124, 112)} Z`} fill={`url(#${id}face)`} />
              {s > 0.02 && <path d={`M${x - 30} ${top + dir * 5 * s} L${x + 30} ${top - dir * 5 * s}`} stroke="#2b1a05" strokeWidth={5} />}
            </g>
            <ellipse cx={x} cy={96} rx={22} ry={26} fill="none" stroke="#2b1a05" strokeWidth={4} />
          </g>
        );
      })}
      {/* brows: raised and round (innocent) -> low and flat (skeptical) */}
      <g stroke="#2b1a05" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d={`M${lerp(52, 50)} ${lerp(60, 64)} Q72 ${lerp(48, 66)} ${lerp(92, 94)} ${lerp(58, 72)}`} />
        <path d={`M${lerp(148, 150)} ${lerp(60, 64)} Q128 ${lerp(48, 66)} ${lerp(108, 106)} ${lerp(58, 72)}`} />
      </g>
      {/* mouth */}
      <path d="M84 140 Q100 162 116 140 Q100 148 84 140 Z" fill="#5a1d12" stroke="#2b1a05" strokeWidth={3} opacity={1 - s} />
      <path d="M85 147 L117 144" stroke="#2b1a05" strokeWidth={6} strokeLinecap="round" opacity={s} />
      {/* oversized ear cups and mic (in front of the face edge) */}
      {[-44, 194].map((x, i) => (
        <g key={i}>
          <rect x={x} y={70} width={50} height={96} rx={22} fill="#23232f" />
          <rect x={x + 7} y={82} width={36} height={72} rx={16} fill="#3a3a4d" />
          <rect x={x + 12} y={88} width={8} height={56} rx={4} fill="rgba(255,255,255,0.22)" />
        </g>
      ))}
      <path d="M-22 160 Q-14 216 56 210" fill="none" stroke="#23232f" strokeWidth={8} strokeLinecap="round" />
      <circle cx={60} cy={209} r={12} fill="#23232f" />
      {/* fresh-from-the-mint sparkles */}
      {[
        [204, 6, 20],
        [-20, 40, 13],
        [190, 196, 11],
      ].map(([x, y, r], i) => {
        const k = 0.75 + 0.25 * Math.sin(u * 5 + i * 2.1);
        return (
          <path
            key={i}
            d={`M${x} ${y - r * k} Q${x} ${y} ${x + r * k} ${y} Q${x} ${y} ${x} ${y + r * k} Q${x} ${y} ${x - r * k} ${y} Q${x} ${y} ${x} ${y - r * k} Z`}
            fill="#FFFFFF"
            stroke="#E0A200"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
};

/** The scene inside the instant print: a warm nursery corner, faded like an old print. */
const PrintImage: React.FC<{ w: number; h: number; squint: number; u: number; blink: boolean }> = ({ w, h, squint, u, blink }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#E9C9A2" }}>
    <div style={{ position: "absolute", inset: 0, filter: "sepia(0.2) saturate(1.15) contrast(0.97) brightness(1.02)" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="pwall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5DFC0" />
            <stop offset="100%" stopColor="#E6BE93" />
          </linearGradient>
          <radialGradient id="pwin" cx="0.2" cy="0.12" r="0.7">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="pbokeh" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFF4C8" stopOpacity={0.95} />
            <stop offset="70%" stopColor="#FFE08A" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#FFE08A" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="pblanket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B7D3EC" />
            <stop offset="100%" stopColor="#8DB2D8" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#pwall)" />
        {Array.from({ length: 9 }).map((_, r) =>
          Array.from({ length: 9 }).map((__, c) => (
            <circle key={`${r}-${c}`} cx={c * 62 + (r % 2) * 31 + 10} cy={r * 50 + 14} r={5} fill="#D9A877" opacity={0.45} />
          )),
        )}
        <rect width={w} height={h} fill="url(#pwin)" />
        <path d={`M-10 40 Q${w / 2} 110 ${w + 10} 36`} fill="none" stroke="#7a5a3a" strokeWidth={2} opacity={0.6} />
        {[0.08, 0.22, 0.37, 0.52, 0.67, 0.82, 0.95].map((k, i) => {
          const x = k * w;
          const y = 40 + Math.sin(k * Math.PI) * 62;
          const r = 20 + (i % 3) * 7;
          return <circle key={i} cx={x} cy={y + 8} r={r * (0.92 + 0.08 * Math.sin(u * 3 + i))} fill="url(#pbokeh)" />;
        })}
        <path d={`M0 ${h - 120} Q${w * 0.25} ${h - 150} ${w * 0.5} ${h - 128} T${w} ${h - 136} L${w} ${h} L0 ${h} Z`} fill="url(#pblanket)" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M0 ${h - 92 + i * 34} Q${w * 0.3} ${h - 112 + i * 34} ${w * 0.55} ${h - 94 + i * 34} T${w} ${h - 100 + i * 34}`} fill="none" stroke="#7FA6CF" strokeWidth={3} strokeDasharray="10 9" />
        ))}
        <ellipse cx={w / 2} cy={h - 118} rx={130} ry={16} fill="rgba(40,40,80,0.22)" />
      </svg>
      <div style={{ position: "absolute", left: w / 2 - 190, top: -6, rotate: `${2 * Math.sin(u * 2.2)}deg`, transformOrigin: "50% 90%" }}>
        <BabyCenty size={380} squint={squint} u={u} blink={blink} />
      </div>
    </div>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(90,45,10,0.38) 100%)" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 100% 8%, rgba(255,120,60,0.42) 0%, rgba(255,120,60,0) 38%)", mixBlendMode: "screen" }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.3, mixBlendMode: "multiply" }} />
  </div>
);

const LETTERING = ["what i looked like when the", "“guaranteed 10% a week” guy", "told me to do the math:"];

/** A red-marker flag doodle (pole + waving flag), drawn on the print. */
const FlagDoodle: React.FC<{ step: number }> = ({ step }) => {
  const pole: Pt[] = [
    [8, 210],
    [20, 110],
    [32, 8],
  ];
  const flag: Pt[] = [
    [32, 10],
    [70, -4],
    [104, 18],
    [140, 6],
    [128, 52],
    [96, 66],
    [62, 56],
    [26, 72],
  ];
  return (
    <svg width={170} height={240} viewBox="-10 -20 170 240" style={{ overflow: "visible" }}>
      <path d={smoothPath(jitter(flag, "fl", step, 1.5)) + " Z"} fill={RED} opacity={0.9} />
      <InkPath d={smoothPath(jitter(flag, "fl2", step, 1.5)) + " Z"} color="#B81E18" width={6} />
      <InkPath d={smoothPath(jitter(pole, "po", step, 1.5))} color="#B81E18" width={9} />
      <InkPath d={smoothPath(jitter([[118, 92], [146, 100]], "m1", step))} color={RED} width={6} />
      <InkPath d={smoothPath(jitter([[112, 116], [138, 132]], "m2", step))} color={RED} width={6} />
    </svg>
  );
};

/** Arrow drawn in marker, pointing right, in a box w x h. */
export const ArrowDoodle: React.FC<{ w: number; h: number; color?: string; step: number; seed?: string; width?: number }> = ({ w, h, color = RED, step, seed = "ar", width = 9 }) => {
  const shaft: Pt[] = [
    [4, h / 2 + 4],
    [w * 0.5, h / 2 - 3],
    [w - 8, h / 2],
  ];
  const head: Pt[] = [
    [w - 40, h / 2 - 26],
    [w - 6, h / 2],
    [w - 42, h / 2 + 24],
  ];
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <InkPath d={smoothPath(jitter(shaft, seed, step))} color={color} width={width} />
      <InkPath d={"M" + jitter(head, seed + "h", step).map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} color={color} width={width} />
    </svg>
  );
};

/**
 * The opening (and closing) frame: hand lettering, a tilted instant print of baby Centy, and a red-marker
 * "$100 -> $14,204 in 52 weeks?!" under it. u = loop time (0 at frame 0; the outro ends at u = 0), so the
 * last frame of the video matches the first.
 */
export const PhotoFrame: React.FC<{ u: number; squint?: number }> = ({ u, squint = 0 }) => {
  const frame = Math.round(u * 60);
  const step = boil(frame + 600);
  const push = Math.max(0.95, Math.min(1.06, 1 + 0.015 * u));
  const pw = 520;
  const ph = 600;
  const inset = 22;
  const iw = pw - inset * 2;
  const ih = ph - inset - 118;
  const q = 1 + 0.06 * Math.sin(u * 4.2);
  const flagWave = 1.5 * noise2D("fw", u * 0.8, 0);
  const blink = false;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Desk />
      <div style={{ position: "absolute", inset: 0, scale: String(push), transformOrigin: "480px 740px" }}>
        {/* hand lettering */}
        <div style={{ position: "absolute", left: 92, top: 150, rotate: "-1.5deg", fontFamily: CAVEAT, fontSize: 62, lineHeight: "68px", color: NAVY }}>
          {LETTERING.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        {/* instant print */}
        <div
          style={{
            position: "absolute",
            left: 480 - pw / 2,
            top: 712 - ph / 2,
            width: pw,
            height: ph,
            rotate: "4deg",
            background: "linear-gradient(160deg, #FFFFFD 0%, #F6F3EA 100%)",
            borderRadius: 6,
            boxShadow: "0 22px 34px rgba(70,45,15,0.38), 0 3px 6px rgba(70,45,15,0.25)",
          }}
        >
          <div style={{ position: "absolute", left: inset, top: inset, width: iw, height: ih, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)" }}>
            <PrintImage w={iw} h={ih} squint={squint} u={u} blink={blink} />
          </div>
          <div style={{ position: "absolute", left: inset + 10, top: inset + ih + 26, fontFamily: CAVEAT, fontSize: 50, color: NAVY, rotate: "-2deg", whiteSpace: "nowrap" }}>
            me, 1 day old
          </div>
          {/* "mint condition" sticker */}
          <div
            style={{
              position: "absolute",
              left: inset - 18,
              top: ih - 70,
              padding: "4px 22px 8px",
              background: "linear-gradient(180deg, #FFE45C 0%, #FFD23A 100%)",
              borderRadius: 10,
              rotate: "-7deg",
              fontFamily: CAVEAT,
              fontSize: 46,
              color: NAVY,
              whiteSpace: "nowrap",
              boxShadow: "0 5px 8px rgba(70,45,15,0.3)",
            }}
          >
            mint condition ✓
          </div>
          {/* masking tape */}
          <div style={{ position: "absolute", left: pw / 2 - 80, top: -26, width: 160, height: 50, background: "rgba(245,236,205,0.82)", rotate: "-3deg", boxShadow: "0 2px 4px rgba(0,0,0,0.12)" }} />
          {/* red-marker doodles on the print */}
          <div style={{ position: "absolute", left: 392, top: -18, rotate: `${flagWave}deg`, scale: "0.82", transformOrigin: "0 100%" }}>
            <FlagDoodle step={step} />
          </div>
          <div style={{ position: "absolute", left: 44, top: 20, fontFamily: MARKER, fontSize: 150, color: RED, rotate: "-10deg", scale: String(q), lineHeight: 1 }}>?</div>
        </div>
        {/* red marker under the print */}
        <div style={{ position: "absolute", left: 0, top: 0, rotate: "-2deg", transformOrigin: "480px 1120px" }}>
          <div style={{ position: "absolute", left: 455, top: 1078, width: 330, height: 62, background: HL, opacity: 0.9, mixBlendMode: "multiply", borderRadius: "10px 22px 14px 8px", rotate: "-1deg" }} />
          <div style={{ position: "absolute", left: 120, top: 1040, fontFamily: MARKER, fontSize: 90, color: RED, whiteSpace: "nowrap", lineHeight: "110px" }}>$100</div>
          <div style={{ position: "absolute", left: 330, top: 1062 }}>
            <ArrowDoodle w={112} h={60} step={step} />
          </div>
          <div style={{ position: "absolute", left: 460, top: 1040, fontFamily: MARKER, fontSize: 90, color: RED, whiteSpace: "nowrap", lineHeight: "110px" }}>$14,204</div>
          <div style={{ position: "absolute", left: 300, top: 1146, fontFamily: CAVEAT, fontSize: 60, color: RED, whiteSpace: "nowrap" }}>in just 52 weeks?!</div>
        </div>
      </div>
    </div>
  );
};
