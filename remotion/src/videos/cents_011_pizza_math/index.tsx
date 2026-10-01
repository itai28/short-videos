import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DISPLAY, MONO } from "../../fonts";
import { Centy, useMouth } from "../../shared/Centy";
import { VisualMap, VisualProps } from "../../types";
import { at, clamp01, popIn, useT } from "../../visuals/util";
import { Pizza, Table } from "./Pizza";

const CX = 480; // centre of the safe area (x 70..890)
const BIG = 500; // 18-inch pizza in px; everything else is to scale
const IN = BIG / 18;

const Chip: React.FC<{ x: number; y: number; text: string; color?: string; s?: number; size?: number }> = ({ x, y, text, color = "#2b0f0a", s = 1, size = 46 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(s),
      background: color,
      color: "#fff",
      fontFamily: DISPLAY,
      fontSize: size,
      padding: "10px 28px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      boxShadow: "0 8px 0 rgba(0,0,0,0.35)",
    }}
  >
    {text}
  </div>
);

const Big: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; s?: number }> = ({ x, y, text, color = "#FFCC33", size = 120, s = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(s),
      fontFamily: DISPLAY,
      fontSize: size,
      color,
      WebkitTextStroke: "12px #2b0f0a",
      paintOrder: "stroke fill",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const Ring: React.FC<{ x: number; y: number; p: number; label: string }> = ({ x, y, p, label }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%" }}>
    <svg width={150} height={150} viewBox="0 0 150 150">
      <circle cx={75} cy={75} r={64} fill="#2b0f0a" />
      <circle cx={75} cy={75} r={64} fill="none" stroke="#FFCC33" strokeWidth={12} strokeDasharray={2 * Math.PI * 64} strokeDashoffset={2 * Math.PI * 64 * p} transform="rotate(-90 75 75)" strokeLinecap="round" />
    </svg>
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 58, color: "#fff" }}>{label}</div>
  </div>
);

/** One 18" (top) vs two 12" (bottom), to scale. Modes: hook | guess | reveal | outro. */
const Versus: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const mode = scene.visual.mode as string;
  const med = 12 * IN;
  const bigY = 455;
  const pairY = 930;
  const reveal = mode === "reveal" ? at(scene, "reveal", 0.6) : Infinity;
  const won = t >= reveal;
  const crown = Number.isFinite(reveal) ? spring({ frame: frame - Math.round(reveal * fps), fps, config: { damping: 9 } }) : 0;
  const holdStart = scene.dur - ((scene.hold as number) ?? 0);
  const ringP = mode === "guess" ? clamp01((t - holdStart) / Math.max(0.1, scene.dur - holdStart)) : 0;
  const breathe = 1 + 0.015 * Math.sin(t * 4);
  const spin = (mode === "hook" || mode === "outro" ? t * 6 : 0);
  return (
    <AbsoluteFill>
      <Table t={t} />
      <div style={{ position: "absolute", left: CX - BIG / 2, top: bigY - BIG / 2, scale: String(won ? 1 + 0.06 * crown : breathe), rotate: `${spin}deg` }}>
        <Pizza d={BIG} seed={3} glow={won ? "#FFCC33" : undefined} />
      </div>
      {[CX - med / 2 - 22, CX + med / 2 + 22].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x - med / 2, top: pairY - med / 2, rotate: `${-spin}deg` }}>
          <Pizza d={med} seed={7 + i} dim={won ? 0.45 : 0} />
        </div>
      ))}
      <Chip x={CX} y={190} text="A · ONE 18-INCH" color={won ? "#1f7a3d" : "#2b0f0a"} />
      <Chip x={CX} y={735} text="B · TWO 12-INCH" color={won ? "#6b6b6b" : "#2b0f0a"} />
      {mode === "guess" && t >= holdStart ? (
        <Ring x={CX + 340} y={735} p={ringP} label={String(Math.max(1, Math.ceil((scene.dur - t) / Math.max(0.5, (scene.dur - holdStart) / 3))))} />
      ) : null}
      {(mode === "hook" || mode === "outro" || (mode === "guess" && t < holdStart)) && (
        <Big x={CX + 330} y={735} text="?" size={150} s={1 + 0.08 * Math.sin(t * 6)} />
      )}
      {won && (
        <>
          <Big x={CX} y={bigY - BIG / 2 - 10} text="👑" size={130} s={crown} />
          <Chip x={CX + 250} y={bigY + 180} text="MORE PIZZA" color="#1f7a3d" s={crown} size={40} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Ruler across the diameter (what you pay for), then the area fills in (what you eat). */
const Ruler: React.FC<VisualProps> = () => {
  const t = useT();
  const y = 560;
  const len = interpolate(t, [0.1, 0.9], [0, BIG], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const sweep = interpolate(t, [1.4, 2.4], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Table t={t} />
      <div style={{ position: "absolute", left: CX - BIG / 2, top: y - BIG / 2 }}>
        <Pizza d={BIG} seed={3} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `conic-gradient(rgba(255,204,51,0.72) ${sweep}deg, transparent ${sweep}deg)`,
          }}
        />
      </div>
      <div style={{ position: "absolute", left: CX - BIG / 2, top: y - 26, width: len, height: 52, background: "#fff7d6", border: "4px solid #2b0f0a", borderRadius: 8, overflow: "hidden" }}>
        {Array.from({ length: 19 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: i * IN, top: 0, width: 3, height: i % 6 === 0 ? 30 : 16, background: "#2b0f0a" }} />
        ))}
      </div>
      <Chip x={CX} y={225} text="18 in = what you pay for" s={popIn(t, 0.6)} size={44} />
      <Chip x={CX} y={890} text="254 sq in = what you eat" color="#1f7a3d" s={popIn(t, 2.2)} size={44} />
    </AbsoluteFill>
  );
};

/** Area counters: 254 vs 226 square inches, with to-scale bars. */
const Area: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const big = scene.visual.big as number;
  const med = scene.visual.med as number;
  const w1 = scene.words.findIndex((w) => /^about$/i.test(w.w));
  const startB = scene.words.length > 6 ? scene.words[Math.max(0, scene.words.findIndex((w) => /^Two$/.test(w.w)))].t : 2;
  const p1 = interpolate(t, [(scene.words[w1]?.t ?? 0.3), (scene.words[w1]?.t ?? 0.3) + 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const p2 = interpolate(t, [startB, startB + 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const full = 760;
  const Row: React.FC<{ y: number; p: number; v: number; label: string; color: string; icons: number[] }> = ({ y, p, v, label, color, icons }) => (
    <>
      <div style={{ position: "absolute", left: 90, top: y - 150, display: "flex", gap: 16, alignItems: "center" }}>
        {icons.map((d, i) => (
          <Pizza key={i} d={d} seed={3 + i * 4} />
        ))}
        <div style={{ fontFamily: DISPLAY, fontSize: 52, color: "#2b0f0a", marginLeft: 12 }}>{label}</div>
      </div>
      <div style={{ position: "absolute", left: 90, top: y, width: full, height: 96, background: "rgba(43,15,10,0.18)", borderRadius: 24 }} />
      <div style={{ position: "absolute", left: 90, top: y, width: (full * v * p) / big, height: 96, background: color, borderRadius: 24, border: "5px solid #2b0f0a" }} />
      <div style={{ position: "absolute", left: 110, top: y + 48, translate: "0 -50%", fontFamily: MONO, fontWeight: 700, fontSize: 56, color: "#fff", WebkitTextStroke: "8px #2b0f0a", paintOrder: "stroke fill" }}>
        {Math.round(v * p)} sq in
      </div>
    </>
  );
  return (
    <AbsoluteFill>
      <Table t={t} />
      <Row y={420} p={p1} v={big} label="18-inch" color="#FFB703" icons={[130]} />
      <Row y={860} p={p2} v={med} label="two 12-inch" color="#E76F51" icons={[87, 87]} />
    </AbsoluteFill>
  );
};

/** The leftover ring of the 18" equals a whole 6" pizza, which pops out at the reveal. */
const Gap: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = at(scene, "reveal", 1.2);
  const inner = BIG * Math.sqrt(72) / 9; // circle with the same area as two 12-inch pizzas
  const ring = interpolate(t, [0.2, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = spring({ frame: frame - Math.round(reveal * fps), fps, config: { damping: 10 } });
  const y = 520;
  return (
    <AbsoluteFill>
      <Table t={t} />
      <div style={{ position: "absolute", left: CX - BIG / 2, top: y - BIG / 2 }}>
        <Pizza d={BIG} seed={3} />
        <div style={{ position: "absolute", left: (BIG - inner) / 2, top: (BIG - inner) / 2, width: inner, height: inner, borderRadius: "50%", background: "rgba(43,15,10,0.45)", opacity: ring, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 44, color: "#fff", textAlign: "center", lineHeight: 1.1 }}>
            = two
            <br />
            12-inch
          </span>
        </div>
        <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `${10 + 6 * Math.sin(t * 8)}px solid #FFCC33`, opacity: ring * (t < reveal ? 1 : 1 - out) }} />
      </div>
      <div style={{ position: "absolute", left: CX - 3 * IN + 210 * out, top: y + 230 + 250 * out - 3 * IN, scale: String(0.2 + 0.8 * out), opacity: out > 0.01 ? 1 : 0 }}>
        <Pizza d={6 * IN} seed={21} slices={4} glow="#FFCC33" />
      </div>
      <Chip x={CX - 120} y={y + 360} text="+1 FREE 6-INCH" color="#1f7a3d" s={out} size={50} />
    </AbsoluteFill>
  );
};

/** 16-inch = four 8-inch pizzas. */
const Double: React.FC<VisualProps> = () => {
  const t = useT();
  const small = 8 * IN * 0.7;
  const large = 16 * IN * 0.7;
  return (
    <AbsoluteFill>
      <Table t={t} />
      <div style={{ position: "absolute", left: CX - large / 2, top: 230, scale: String(popIn(t, 0)) }}>
        <Pizza d={large} seed={5} />
      </div>
      <Chip x={CX} y={215} text="16-INCH" s={popIn(t, 0.1)} />
      <Big x={CX} y={790} text="=" size={110} s={popIn(t, 0.9)} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: CX - 2 * small - 30 + i * (small + 20), top: 860, scale: String(popIn(t, 1.2 + i * 0.15)) }}>
          <Pizza d={small} seed={11 + i} slices={6} />
        </div>
      ))}
      <Chip x={CX} y={1140} text="FOUR 8-INCH" s={popIn(t, 1.9)} />
    </AbsoluteFill>
  );
};

/** Price per square inch tip, with Centy holding a slice. */
const Tip: React.FC<VisualProps> = ({ scene, timeline }) => {
  const t = useT();
  const mouth = useMouth(timeline.mouth, scene.start);
  return (
    <AbsoluteFill>
      <Table t={t} />
      <div style={{ position: "absolute", left: 90, right: 190, top: 250, background: "#fffaf0", border: "6px solid #2b0f0a", borderRadius: 36, padding: "40px 30px", textAlign: "center", scale: String(popIn(t, 0)), boxShadow: "0 14px 0 rgba(0,0,0,0.3)" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 64, color: "#2b0f0a" }}>PRICE</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 64, color: "#D7432F" }}>÷ SQUARE INCHES</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: "#2b0f0a", marginTop: 18 }}>= what each bite costs</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, color: "#6b4b3e", marginTop: 14 }}>area = 3.14 × radius × radius</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 760, scale: String(popIn(t, 0.3)) }}>
        <Centy size={300} mouth={mouth} expr="talk" />
      </div>
      <div style={{ position: "absolute", left: 470, top: 850, rotate: `${-12 + 6 * Math.sin(t * 3)}deg`, scale: String(popIn(t, 0.5)) }}>
        <svg width={260} height={240} viewBox="0 0 200 180">
          <path d="M10 20 Q100 -10 190 20 L100 175 Z" fill="#FFD166" stroke="#B8692A" strokeWidth={10} strokeLinejoin="round" />
          <circle cx={70} cy={50} r={13} fill="#B3261E" />
          <circle cx={125} cy={45} r={13} fill="#B3261E" />
          <circle cx={100} cy={100} r={12} fill="#B3261E" />
        </svg>
      </div>
      <Chip x={CX} y={1160} text="send to whoever orders" color="#1f7a3d" s={popIn(t, (scene.words.find((w) => /^Send$/.test(w.w))?.t ?? 2) - 0.1)} size={40} />
    </AbsoluteFill>
  );
};

export const visuals: VisualMap = {
  "pizza.versus": Versus,
  "pizza.ruler": Ruler,
  "pizza.area": Area,
  "pizza.gap": Gap,
  "pizza.double": Double,
  "pizza.tip": Tip,
};
