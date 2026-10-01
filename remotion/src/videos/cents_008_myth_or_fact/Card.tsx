import React from "react";
import { evolvePath } from "@remotion/paths";
import { BODY, BUNGEE, MONO } from "../../fonts";
import { clamp01, money } from "../../visuals/util";
import { P, rgba } from "./Set";

export const CARD_LEFT = 100;
export const CARD_W = 760;
export const CARD_TOP = 616;
export const CARD_H = 430;
export const CARD_H_MID = 452;
export const CARD_H_BOSS = 674;
const BORDER = 7;
const IW = CARD_W - 2 * BORDER; // inner width 746

export const STAMP_RED = "#E3163E";

const faceStyle = (edge: string, glow: number): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  borderRadius: 38,
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  background: "linear-gradient(180deg, #FFFFFF 0%, #F5F0FF 62%, #E7DCFF 100%)",
  border: `${BORDER}px solid ${edge}`,
  boxShadow: `0 22px 0 rgba(8,0,20,0.5), 0 0 ${40 + 50 * glow}px ${rgba(edge, 0.45 + 0.45 * glow)}, inset 0 -12px 0 rgba(42,15,79,0.07)`,
});

/** Card that flips in 3D. angle 0 shows a, 180 shows b. */
export const FlipCard: React.FC<{ h: number; angle: number; a: React.ReactNode; b?: React.ReactNode; s?: number }> = ({ h, angle, a, b, s = 1 }) => {
  const lift = Math.sin((Math.PI * Math.min(180, Math.max(0, angle % 360))) / 180);
  return (
    <div style={{ position: "absolute", left: CARD_LEFT, top: CARD_TOP, width: CARD_W, height: h, perspective: 1400 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `rotateY(${angle}deg) scale(${s * (1 + 0.06 * lift)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>{a}</div>
        {b ? (
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>{b}</div>
        ) : null}
      </div>
    </div>
  );
};

/** Marker highlight behind a phrase. k 0..1 sweeps it in from the left; band = [top%, bottom%] of the line box. */
const Hi: React.FC<{ c: string; k?: number; band?: [number, number]; children: React.ReactNode }> = ({ c, k = 1, band = [56, 94], children }) => (
  <span
    style={{
      backgroundImage: `linear-gradient(transparent ${band[0]}%, ${c} ${band[0]}%, ${c} ${band[1]}%, transparent ${band[1]}%)`,
      backgroundSize: `${clamp01(k) * 100}% 100%`,
      backgroundRepeat: "no-repeat",
      padding: "0 6px",
      margin: "0 -6px",
      WebkitBoxDecorationBreak: "clone",
      boxDecorationBreak: "clone",
    }}
  >
    {children}
  </span>
);

const UNDER: [number, number] = [84, 98];

/** Question text. hk = highlight sweeps (0..1), keyed to the spoken words by the stage. */
export const questionText = (round: number, hk: number[] = []): React.ReactNode => {
  const k = (i: number) => hk[i] ?? 1;
  if (round === 1)
    return (
      <>
        Checking <Hi c="rgba(30,214,196,0.45)">your own</Hi> credit score can{" "}
        <Hi c="rgba(255,59,92,0.7)" k={hk[0] ?? 0} band={UNDER}>
          lower it.
        </Hi>
      </>
    );
  if (round === 2)
    return (
      <>
        Using a debit card <Hi c="rgba(30,214,196,0.45)" k={k(0)}>doesn&apos;t</Hi> build credit.
      </>
    );
  return (
    <>
      A raise into a <Hi c="rgba(255,59,92,0.35)" k={k(0)}>higher tax bracket</Hi> can{" "}
      <Hi c="rgba(255,59,92,0.7)" k={k(1)} band={UNDER}>
        lower your take-home pay.
      </Hi>
    </>
  );
};

export const QuestionFace: React.FC<{ round: number; glow?: number; hk?: number[] }> = ({ round, glow = 0, hk }) => {
  const boss = round === 3;
  const edge = boss ? P.red : P.teal;
  return (
    <div style={faceStyle(edge, glow)}>
      <div
        style={{
          position: "absolute",
          left: 26,
          top: -24,
          padding: "6px 22px 8px",
          borderRadius: 16,
          background: boss ? P.red : P.ink,
          border: `4px solid ${boss ? "#2B0712" : P.teal}`,
          fontFamily: BUNGEE,
          fontSize: 40,
          color: "#ffffff",
          boxShadow: "0 6px 0 rgba(8,0,20,0.45)",
          whiteSpace: "nowrap",
        }}
      >
        {boss ? "BOSS ROUND" : `ROUND ${round}`}
      </div>
      <div style={{ position: "absolute", right: 30, bottom: 12, fontFamily: BUNGEE, fontSize: 130, lineHeight: 1, color: "rgba(42,15,79,0.045)", rotate: "12deg" }}>?</div>
      <div
        style={{
          position: "absolute",
          left: 44,
          right: 44,
          top: 46,
          bottom: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 800,
          fontSize: boss ? 56 : 66,
          lineHeight: 1.14,
          color: P.ink,
        }}
      >
        <div style={{ textWrap: "balance" } as React.CSSProperties}>{questionText(round, hk)}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", fontFamily: BUNGEE, fontSize: 44, whiteSpace: "nowrap" }}>
        <span style={{ color: P.red }}>MYTH</span>
        <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#7C6AA8", margin: "0 16px" }}>or</span>
        <span style={{ color: P.greenDark }}>FACT</span>
        <span style={{ color: P.ink }}>?</span>
      </div>
    </div>
  );
};

/** Rubber stamp with a speckled ink texture. */
export const Stamp: React.FC<{ text: string; color: string; size: number; id: string; rot?: number; clean?: boolean }> = ({ text, color, size, id, rot = -8, clean = false }) => {
  const w = text.length * size * 0.86 + size * 0.75;
  const h = size * 1.42;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", rotate: `${rot}deg`, display: "block" }}>
      <defs>
        <filter id={`${id}Ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves={2} seed={11} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -18 0 0 0 13.6" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
      <g filter={clean ? undefined : `url(#${id}Ink)`}>
        <rect x={size * 0.07} y={size * 0.07} width={w - size * 0.14} height={h - size * 0.14} rx={size * 0.2} fill={rgba(color === STAMP_RED ? "#FF3B5C" : "#14A851", 0.1)} stroke={color} strokeWidth={size * 0.09} />
        <text x={w / 2} y={h / 2 + size * 0.37} textAnchor="middle" fontFamily={BUNGEE} fontSize={size} fill={color} letterSpacing={size * 0.04}>
          {text}
        </text>
      </g>
    </svg>
  );
};

/** Stamp that springs from 1.6x to 1x. s = spring 0..1. */
const StampAt: React.FC<{ x: number; y: number; s: number; text: string; color: string; size: number; id: string; scale?: number; rot?: number; clean?: boolean }> = ({
  x,
  y,
  s,
  text,
  color,
  size,
  id,
  scale = 1,
  rot,
  clean,
}) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", scale: String(scale * (1.6 - 0.6 * s)), opacity: clamp01(s * 4) }}>
    <Stamp text={text} color={color} size={size} id={id} rot={rot} clean={clean} />
  </div>
);

const Rays: React.FC<{ x: number; y: number; color: string; o: number; rot: number }> = ({ x, y, color, o, rot }) => (
  <div
    style={{
      position: "absolute",
      left: x - 520,
      top: y - 520,
      width: 1040,
      height: 1040,
      borderRadius: "50%",
      opacity: o,
      rotate: `${rot}deg`,
      background: `repeating-conic-gradient(${rgba(color, 0.16)} 0deg 9deg, transparent 9deg 22.5deg)`,
      WebkitMaskImage: "radial-gradient(circle, black 18%, transparent 62%)",
    }}
  />
);

const answerFace = (edge: string, glow: number): React.CSSProperties => ({ ...faceStyle(edge, glow), overflow: "hidden" });

/** Round 1 back: MYTH. Checking your own score is a soft inquiry. */
export const Answer1Face: React.FC<{ s: number; rot: number; soft: number; glow?: number }> = ({ s, rot, soft, glow = 0 }) => (
  <div style={answerFace(P.red, glow)}>
    <Rays x={373} y={96} color={P.red} o={s} rot={rot} />
    <StampAt x={373} y={98} s={s} text="MYTH" color={STAMP_RED} size={104} id="mythA1" />
    <div style={{ position: "absolute", left: 22, top: 196, width: 240, height: 190 }}>
      <svg width={240} height={190} viewBox="0 0 240 190">
        <defs>
          <linearGradient id="mythGauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={P.red} />
            <stop offset="50%" stopColor={P.gold} />
            <stop offset="100%" stopColor={P.green} />
          </linearGradient>
        </defs>
        <path d="M24 140 A96 96 0 0 1 216 140" fill="none" stroke="#D9CCF5" strokeWidth={34} strokeLinecap="round" />
        <path d="M24 140 A96 96 0 0 1 216 140" fill="none" stroke="url(#mythGauge)" strokeWidth={26} strokeLinecap="round" />
        <g transform={`rotate(${38 + 1.5 * Math.sin(rot * 0.3)} 120 140)`}>
          <path d="M114 140 L120 62 L126 140 Z" fill={P.ink} />
        </g>
        <circle cx={120} cy={140} r={14} fill={P.ink} />
        {/* magnifier = checking */}
        <g transform="translate(178 142)">
          <line x1={20} y1={20} x2={42} y2={42} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
          <circle cx={4} cy={4} r={24} fill="#ffffff" stroke={P.ink} strokeWidth={8} />
          <path d="M-8 -2 Q-4 -12 6 -13" stroke={P.teal} strokeWidth={5} strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
    <div style={{ position: "absolute", left: 280, right: 18, top: 206, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: P.ink, whiteSpace: "nowrap" }}>Your own check</div>
      <div
        style={{
          fontFamily: BUNGEE,
          fontSize: 42,
          color: "#ffffff",
          background: P.tealDark,
          borderRadius: 14,
          padding: "4px 14px 6px",
          alignSelf: "flex-start",
          whiteSpace: "nowrap",
          scale: String(1 + 0.08 * soft),
          transformOrigin: "left center",
          boxShadow: `0 0 ${24 * soft}px ${rgba(P.teal, 0.9 * soft)}`,
        }}
      >
        = SOFT INQUIRY
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: "#5B4790", whiteSpace: "nowrap" }}>no score drop</div>
    </div>
  </div>
);

/** Round 2 back: FACT. Debit use isn't reported to the credit bureaus. */
export const Answer2Face: React.FC<{ s: number; rot: number; card: number; x: number; flow: number; glow?: number }> = ({ s, rot, card, x, flow, glow = 0 }) => (
  <div style={answerFace(P.greenDark, glow)}>
    <Rays x={373} y={92} color={P.green} o={s} rot={rot} />
    <StampAt x={373} y={86} s={s} text="FACT" color={P.greenDark} size={96} id="mythA2" />
    {/* generic debit card, no network marks */}
    <div style={{ position: "absolute", left: 28, top: 190, translate: `${(1 - card) * -60}px 0`, opacity: card, rotate: "-6deg" }}>
      <svg width={208} height={132} viewBox="0 0 208 132">
        <defs>
          <linearGradient id="mythDebit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7B5BEA" />
            <stop offset="100%" stopColor="#18B7A8" />
          </linearGradient>
        </defs>
        <rect x={2} y={6} width={204} height={124} rx={16} fill="#14062B" opacity={0.3} />
        <rect x={0} y={0} width={204} height={124} rx={16} fill="url(#mythDebit)" stroke={P.ink} strokeWidth={4} />
        <rect x={20} y={40} width={36} height={28} rx={6} fill={P.gold} stroke="#8A6200" strokeWidth={2} />
        <path d="M20 54 H56 M38 40 V68" stroke="#8A6200" strokeWidth={2} />
        <text x={186} y={34} textAnchor="end" fontFamily={BUNGEE} fontSize={24} fill="#ffffff">
          DEBIT
        </text>
        <text x={20} y={104} fontFamily={BODY} fontWeight={800} fontSize={22} fill="#ffffff" letterSpacing={3}>
          •••• •••• ••••
        </text>
      </svg>
    </div>
    <div style={{ position: "absolute", left: 18, width: 240, top: 336, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 40, color: P.ink, opacity: card }}>
      debit use
    </div>
    {/* arrow toward the bureaus, crossed out */}
    <svg width={IW} height={420} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={250} y1={258} x2={482} y2={258} stroke={P.ink} strokeWidth={9} strokeLinecap="round" strokeDasharray="2 22" strokeDashoffset={-flow * 24} opacity={card} />
      <path d="M472 240 L498 258 L472 276" fill="none" stroke={P.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={card} />
      <g transform={`translate(372 258) scale(${0.4 + 0.6 * x}) rotate(${(1 - x) * 40})`} opacity={clamp01(x * 3)}>
        <path d="M-42 -42 L42 42 M42 -42 L-42 42" stroke="#ffffff" strokeWidth={30} strokeLinecap="round" />
        <path d="M-42 -42 L42 42 M42 -42 L-42 42" stroke={P.red} strokeWidth={20} strokeLinecap="round" />
      </g>
    </svg>
    {/* credit bureaus */}
    <div style={{ position: "absolute", left: 512, top: 176, width: 200, opacity: card }}>
      <svg width={200} height={124} viewBox="0 0 200 124">
        <path d="M30 40 L100 6 L170 40 Z" fill={P.ink} />
        <rect x={34} y={44} width={132} height={10} fill={P.ink} />
        {[48, 82, 116, 150].map((x) => (
          <rect key={x} x={x - 7} y={58} width={14} height={46} rx={3} fill="#5B4790" />
        ))}
        <rect x={26} y={106} width={148} height={14} rx={3} fill={P.ink} />
      </svg>
      <div style={{ textAlign: "center", fontFamily: BUNGEE, fontSize: 40, lineHeight: 1.05, color: P.ink, marginTop: 6 }}>
        CREDIT
        <br />
        BUREAUS
      </div>
    </div>
  </div>
);

/** Boss round back: MYTH stamp, then 10 x $100 bills from $50,000 to $51,000 with the 12% / 22% slices. */
export type BossState = {
  stampS: number;
  dock: number;
  bills: number[]; // pop-in per bill
  cap22: number; // 0..1 growth of the extra 10 points on the bills past the line
  line: number;
  chip12: number;
  chip22: number;
  stair: number;
  axis: number;
  sweep: number; // -1..2 shimmer position across the bills
  tax1: number;
  tax2: number;
  taxBox: number;
  kept: number;
  rot: number;
  low: number;
  high: number;
  extra: number;
  keptV: number;
};

const BX = (i: number) => (i < 4 ? 34 + i * 66 : 326 + (i - 4) * 66);
const BW = 56;
const LINE_X = 307;
const BILL_TOP = 98;
const BILL_H = 268;

export const BossFace: React.FC<{ st: BossState; glow?: number }> = ({ st, glow = 0 }) => {
  const y12 = BILL_TOP + BILL_H * 0.12;
  const y22 = BILL_TOP + BILL_H * 0.22;
  const stairPath = `M ${BX(0)} ${y12} L ${LINE_X} ${y12} L ${LINE_X} ${y22} L ${BX(9) + BW} ${y22}`;
  const ev = evolvePath(clamp01(st.stair), stairPath);
  const dockX = 373 + (652 - 373) * st.dock;
  const dockY = 190 + (48 - 190) * st.dock;
  const chip: React.CSSProperties = {
    position: "absolute",
    top: 18,
    translate: "-50% 0",
    padding: "4px 18px 6px",
    borderRadius: 16,
    fontFamily: BUNGEE,
    fontSize: 44,
    color: "#ffffff",
    whiteSpace: "nowrap",
    boxShadow: "0 5px 0 rgba(20,6,43,0.35)",
  };
  return (
    <div style={answerFace(P.red, glow)}>
      <Rays x={dockX} y={dockY} color={P.red} o={st.stampS * (1 - st.dock)} rot={st.rot} />
      {/* bills */}
      <svg width={IW} height={CARD_H_BOSS} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="mythBill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F2B705" />
            <stop offset="45%" stopColor="#FFE07A" />
            <stop offset="100%" stopColor="#E0A400" />
          </linearGradient>
          <linearGradient id="mythCap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B85" />
            <stop offset="100%" stopColor={P.redDark} />
          </linearGradient>
        </defs>
        {/* bracket zones behind the bills */}
        <rect x={BX(0) - 12} y={BILL_TOP - 8} width={LINE_X - BX(0) + 2} height={BILL_H + 16} rx={14} fill={rgba(P.teal, 0.13 * st.chip12)} />
        <rect x={LINE_X + 10} y={BILL_TOP - 8} width={BX(9) + BW + 12 - LINE_X - 10} height={BILL_H + 16} rx={14} fill={rgba(P.red, 0.1 * st.chip22)} />
        {Array.from({ length: 10 }).map((_, i) => {
          const k = st.bills[i] ?? 0;
          if (k <= 0) return null;
          const x = BX(i);
          const rate = 0.12 + (i >= 4 ? 0.1 * st.cap22 : 0);
          const capH = BILL_H * rate;
          const shine = clamp01(1 - Math.abs(st.sweep * 11 - i) / 1.6);
          return (
            <g key={i} transform={`translate(${x + BW / 2} ${BILL_TOP + BILL_H}) scale(1 ${k}) translate(${-x - BW / 2} ${-BILL_TOP - BILL_H})`}>
              <rect x={x + 3} y={BILL_TOP + 6} width={BW} height={BILL_H} rx={8} fill="#14062B" opacity={0.25} />
              <rect x={x} y={BILL_TOP} width={BW} height={BILL_H} rx={8} fill="url(#mythBill)" stroke="#8A6200" strokeWidth={3} />
              <rect x={x + 6} y={BILL_TOP + 6} width={BW - 12} height={BILL_H - 12} rx={5} fill="none" stroke="#B88600" strokeWidth={2} opacity={0.7} />
              <text
                x={x + BW / 2}
                y={BILL_TOP + BILL_H * 0.62}
                textAnchor="middle"
                fontFamily={BUNGEE}
                fontSize={30}
                fill="#8A6200"
                transform={`rotate(-90 ${x + BW / 2} ${BILL_TOP + BILL_H * 0.62})`}
                dominantBaseline="middle"
              >
                $100
              </text>
              <rect x={x} y={BILL_TOP} width={BW} height={capH} rx={8} fill="url(#mythCap)" stroke={P.redDark} strokeWidth={3} />
              {shine > 0 && <rect x={x} y={BILL_TOP} width={BW} height={BILL_H} rx={8} fill="#ffffff" opacity={0.55 * shine} />}
            </g>
          );
        })}
        {/* staircase: the tax rate steps up only past the line */}
        <path d={stairPath} fill="none" stroke={P.ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={st.stair > 0 ? 1 : 0} />
        {/* the line */}
        <line x1={LINE_X} y1={10} x2={LINE_X} y2={10 + (BILL_TOP + BILL_H + 6 - 10) * st.line} stroke={P.ink} strokeWidth={5} strokeDasharray="14 10" />
      </svg>
      <div style={{ ...chip, left: (BX(0) + BX(3) + BW) / 2, background: P.tealDark, scale: String(st.chip12), opacity: clamp01(st.chip12 * 3) }}>12%</div>
      <div style={{ ...chip, left: 498, background: P.red, scale: String(st.chip22), opacity: clamp01(st.chip22 * 3) }}>22%</div>
      {/* axis labels */}
      <div style={{ position: "absolute", top: 376, left: LINE_X, translate: "-50% 0", fontFamily: MONO, fontWeight: 700, fontSize: 40, color: P.ink, opacity: st.line, whiteSpace: "nowrap", background: "#FFF3B0", borderRadius: 10, padding: "0 8px" }}>
        $50,400
      </div>
      <div style={{ position: "absolute", top: 376, left: BX(0) - 6, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#5B4790", opacity: st.axis, whiteSpace: "nowrap" }}>$50,000</div>
      <div style={{ position: "absolute", top: 376, right: IW - (BX(9) + BW) - 6, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#5B4790", opacity: st.axis, whiteSpace: "nowrap" }}>$51,000</div>
      {/* tax per group */}
      <div style={{ position: "absolute", top: 428, left: (BX(0) + BX(3) + BW) / 2, translate: "-50% 0", scale: String(st.tax1), fontFamily: BUNGEE, fontSize: 40, color: P.redDark, whiteSpace: "nowrap" }}>
        {money(st.low)} TAX
      </div>
      <div style={{ position: "absolute", top: 428, left: (BX(4) + BX(9) + BW) / 2, translate: "-50% 0", scale: String(st.tax2), fontFamily: BUNGEE, fontSize: 40, color: P.redDark, whiteSpace: "nowrap" }}>
        {money(st.high)} TAX
      </div>
      {/* totals */}
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 494,
          width: 208,
          height: 150,
          borderRadius: 24,
          background: "#FFE1E7",
          border: `5px solid ${P.red}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          scale: String(st.taxBox),
          opacity: clamp01(st.taxBox * 3),
        }}
      >
        <div style={{ fontFamily: BUNGEE, fontSize: 40, color: P.redDark, lineHeight: 1 }}>TAX</div>
        <div style={{ fontFamily: BUNGEE, fontSize: 62, color: P.red, lineHeight: 1.1 }}>{money(st.extra)}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 248,
          top: 482,
          width: 472,
          height: 172,
          borderRadius: 28,
          background: "linear-gradient(180deg, #3B1A73 0%, #1C0A3C 100%)",
          border: `6px solid ${P.gold}`,
          boxShadow: `0 0 ${40 * st.kept}px ${rgba(P.gold, 0.8)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          scale: String(1.5 - 0.5 * st.kept),
          opacity: clamp01(st.kept * 4),
        }}
      >
        <div style={{ fontFamily: BUNGEE, fontSize: 40, color: "#ffffff", lineHeight: 1.05, textAlign: "center" }}>
          YOU
          <br />
          KEEP
        </div>
        <div style={{ fontFamily: BUNGEE, fontSize: 108, color: P.gold, lineHeight: 1, textShadow: "0 6px 0 #8A6200" }}>{money(st.keptV)}</div>
      </div>
      <StampAt x={dockX} y={dockY} s={st.stampS} text="MYTH" color={STAMP_RED} size={110} id="mythA3" scale={1 - 0.64 * st.dock} clean={st.dock > 0.5} />
    </div>
  );
};

/** Outro recap so viewers can score themselves. */
export const KeyFace: React.FC<{ glow?: number }> = ({ glow = 0 }) => {
  const rows: [string, string, string][] = [
    ["1", "Score check hurts", "MYTH"],
    ["2", "Debit = no credit", "FACT"],
    ["3", "Raise = less pay", "MYTH"],
  ];
  return (
    <div style={answerFace(P.teal, glow)}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", fontFamily: BUNGEE, fontSize: 46, color: P.ink }}>ANSWER KEY</div>
      {rows.map(([n, label, ans], i) => {
        const c = ans === "MYTH" ? P.red : P.greenDark;
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              top: 92 + i * 104,
              height: 90,
              borderRadius: 22,
              background: "#ffffff",
              border: "3px solid #D9CCF5",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 16,
              boxShadow: "0 5px 0 rgba(42,15,79,0.12)",
            }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 29, background: P.ink, color: "#fff", fontFamily: BUNGEE, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
            <div style={{ flex: 1, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: P.ink, whiteSpace: "nowrap" }}>{label}</div>
            <div style={{ fontFamily: BUNGEE, fontSize: 40, color: c, border: `4px solid ${c}`, borderRadius: 12, padding: "0 12px 2px", rotate: "-5deg" }}>{ans}</div>
          </div>
        );
      })}
    </div>
  );
};
