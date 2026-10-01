import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { DISPLAY, MONO, PLAYFAIR } from "../../fonts";
import { useMouth } from "../../shared/Centy";
import { VisualProps } from "../../types";
import { clamp01, popIn, rand, useT } from "../../visuals/util";
import { Coin, CoinKind, Curator, GalleryRoom } from "./Museum";
import { BRASS, BRASS_HI, BRASS_LO, COPPER, CREAM, GOLD, LINING, RED } from "./palette";

const wordAt = (scene: VisualProps["scene"], re: RegExp, nth = 0, fallback = 0) => {
  const hits = scene.words.filter((w) => re.test(w.w));
  return hits[nth]?.t ?? fallback;
};

type Side = { kind: CoinKind; name: string; cost: string; worth: string; loss: string; frac: number; count: string };

const DMG: Record<"coin" | "dollar", { penny: Side; nickel: Side }> = {
  coin: {
    penny: { kind: "penny", name: "PENNY", cost: "COST 3.69¢", worth: "WORTH 1¢", loss: "-2.69¢", frac: 2.69 / 8.78, count: "×1" },
    nickel: { kind: "nickel", name: "NICKEL", cost: "COST 13.78¢", worth: "WORTH 5¢", loss: "-8.78¢", frac: 1, count: "×1" },
  },
  dollar: {
    penny: { kind: "penny", name: "100 PENNIES", cost: "COST $3.69", worth: "WORTH $1", loss: "-$2.69", frac: 1, count: "×100" },
    nickel: { kind: "nickel", name: "20 NICKELS", cost: "COST $2.76", worth: "WORTH $1", loss: "-$1.76", frac: 1.756 / 2.69, count: "×20" },
  },
};

/** Coin art for a damage card: one coin, or a small stack with a count badge. */
const CoinArt: React.FC<{ kind: CoinKind; stack: boolean; count: string; shake: number }> = ({ kind, stack, count, shake }) => (
  <div style={{ position: "relative", width: 300, height: 220, translate: `${shake}px 0` }}>
    {stack ? (
      <>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: 30 + k * 52, top: 34 - k * 6 + (k === 1 ? -10 : 0) }}>
            <Coin d={150} kind={kind} turn={-18 + k * 14} />
          </div>
        ))}
        <div style={{ position: "absolute", right: -8, bottom: 6, background: GOLD, color: "#1A1205", fontFamily: MONO, fontWeight: 700, fontSize: 52, padding: "2px 16px", borderRadius: 16, boxShadow: "0 6px 0 rgba(0,0,0,0.4)" }}>{count}</div>
      </>
    ) : (
      <div style={{ position: "absolute", left: 45, top: 4 }}>
        <Coin d={210} kind={kind} turn={-12} />
      </div>
    )}
  </div>
);

const DamageCard: React.FC<{ x: number; side: Side; t: number; hitAt: number; hotAt: number; flip: number; stack: boolean; phaseStart: number }> = ({ x, side, t, hitAt, hotAt, flip, stack, phaseStart }) => {
  const age = t - hitAt;
  const s = age >= 0 ? popIn(t, hitAt, 0.2) : 0;
  const rise = 120 * (1 - Easing.out(Easing.cubic)(clamp01(age / 0.55)));
  const shake = age >= 0 && age < 0.3 ? Math.sin(age * 90) * 10 * (1 - age / 0.3) : 0;
  const hot = t >= hotAt ? popIn(t, hotAt, 0.25) : 0;
  const bar = interpolate(t, [hitAt, hitAt + 0.45], [0, side.frac], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const enter = popIn(t, phaseStart, 0.3);
  const sx = Math.max(0.02, Math.abs(Math.cos(flip * Math.PI)));
  return (
    <div
      style={{
        position: "absolute",
        left: x - 180,
        top: 360,
        width: 360,
        height: 690,
        scale: `${sx * (0.92 + 0.08 * enter)} ${0.92 + 0.08 * enter}`,
        borderRadius: 30,
        background: "linear-gradient(180deg, #1B2B46 0%, #0B1423 100%)",
        border: `4px solid ${hot > 0 ? RED : BRASS}`,
        boxShadow: `0 20px 36px rgba(0,0,0,0.6)${hot > 0 ? `, 0 0 ${50 * hot}px rgba(255,77,77,${0.75 * hot})` : ""}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 34,
        boxSizing: "border-box",
        color: CREAM,
      }}
    >
      {hot > 0 ? (
        <div style={{ position: "absolute", top: -30, left: "50%", translate: "-50% 0", scale: String(hot), background: RED, color: "#fff", fontFamily: MONO, fontWeight: 700, fontSize: 40, padding: "6px 22px", borderRadius: 12, whiteSpace: "nowrap", boxShadow: "0 8px 16px rgba(0,0,0,0.5)" }}>
          BIGGER LOSS
        </div>
      ) : null}
      <CoinArt kind={side.kind} stack={stack} count={side.count} shake={shake} />
      <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: side.name.length > 8 ? 48 : 58, marginTop: 14, whiteSpace: "nowrap", ...LINING }}>{side.name}</div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, lineHeight: 1.2, marginTop: 10, color: "#C7D2E2", textAlign: "center" }}>
        {side.cost}
        <br />
        {side.worth}
      </div>
      <div style={{ position: "relative", width: 290, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.1)", marginTop: 22, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 290 * bar, background: `linear-gradient(90deg, #B32626, ${RED})`, borderRadius: 13 }} />
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: DISPLAY,
          fontSize: 92,
          lineHeight: 1,
          color: RED,
          WebkitTextStroke: "11px #1A0505",
          paintOrder: "stroke fill",
          whiteSpace: "nowrap",
          translate: `0 ${rise}px`,
          scale: String(s),
          opacity: s > 0 ? 1 : 0,
          textShadow: "0 6px 0 rgba(0,0,0,0.45)",
        }}
      >
        {side.loss}
      </div>
    </div>
  );
};

/** RPG-style loss readouts: per coin (nickel loses more), then per $1 made (penny loses more). */
export const DamageScene: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const flipAt = wordAt(scene, /^The$/, 1, 1.85);
  const more1 = wordAt(scene, /^more$/i, 0, 0.88);
  const more2 = wordAt(scene, /^more$/i, 1, 2.67);
  const flip = clamp01((t - (flipAt - 0.2)) / 0.32);
  const phase: "coin" | "dollar" = flip < 0.5 ? "coin" : "dollar";
  const B = phase === "dollar";
  const d = DMG[phase];
  const titleS = Math.max(0.02, Math.abs(Math.cos(flip * Math.PI)));
  return (
    <AbsoluteFill>
      <GalleryRoom
        spots={[
          { x: 270, w: 230, a: 0.75 },
          { x: 680, w: 230, a: 0.75 },
        ]}
        tt={scene.start + t}
        motes={0.6}
      />
      <div style={{ position: "absolute", left: 70, width: 820, top: 222, textAlign: "center", scale: `1 ${titleS}` }}>
        <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 70, color: CREAM, textShadow: "0 6px 16px rgba(0,0,0,0.6)", whiteSpace: "nowrap", ...LINING }}>
          {B ? (
            <>
              LOSS PER <span style={{ color: GOLD }}>$1</span> MADE
            </>
          ) : (
            "LOSS PER COIN"
          )}
        </div>
      </div>
      {/* slow push so the holds after each verdict never freeze */}
      <AbsoluteFill style={{ scale: String(interpolate(t, [0, scene.dur], [1, 1.03])), transformOrigin: "480px 700px" }}>
        <DamageCard x={270} side={d.penny} t={t} hitAt={B ? flipAt + 0.15 : 0.5} hotAt={B ? more2 - 0.05 : 99} flip={flip} stack={B} phaseStart={B ? flipAt : 0} />
        <DamageCard x={680} side={d.nickel} t={t} hitAt={B ? flipAt + 0.35 : 0.2} hotAt={B ? 99 : more1 - 0.05} flip={flip} stack={B} phaseStart={B ? flipAt : 0} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Glass penny jar. */
const Jar: React.FC = () => (
  <svg width={250} height={290} viewBox="0 0 250 290" style={{ overflow: "visible" }}>
    <defs>
      <clipPath id="pmJarClip">
        <path d="M 30 70 Q 18 80 18 110 L 18 250 Q 18 280 50 280 L 200 280 Q 232 280 232 250 L 232 110 Q 232 80 220 70 Z" />
      </clipPath>
      <linearGradient id="pmJarLid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={BRASS_HI} />
        <stop offset="1" stopColor={BRASS_LO} />
      </linearGradient>
    </defs>
    <ellipse cx={125} cy={286} rx={120} ry={12} fill="#000" opacity={0.5} />
    <g clipPath="url(#pmJarClip)">
      <rect x={0} y={0} width={250} height={290} fill="rgba(170,200,230,0.12)" />
      {Array.from({ length: 64 }).map((_, i) => {
        const row = Math.floor(i / 8);
        const x = 30 + (i % 8) * 27 + (row % 2) * 13 + (rand(i * 7) - 0.5) * 8;
        const y = 270 - row * 17 + (rand(i * 3) - 0.5) * 6;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y + 3} rx={15} ry={6} fill="#6A3112" />
            <ellipse cx={x} cy={y} rx={15} ry={6} fill={rand(i * 11) > 0.3 ? COPPER : "#E39A63"} stroke="#6A3112" strokeWidth={1} />
          </g>
        );
      })}
    </g>
    <path d="M 30 70 Q 18 80 18 110 L 18 250 Q 18 280 50 280 L 200 280 Q 232 280 232 250 L 232 110 Q 232 80 220 70 Z" fill="none" stroke="rgba(235,245,255,0.55)" strokeWidth={5} />
    <path d="M 40 110 L 40 250" stroke="#fff" strokeOpacity={0.4} strokeWidth={8} strokeLinecap="round" />
    <rect x={26} y={34} width={198} height={40} rx={10} fill="url(#pmJarLid)" stroke={BRASS_LO} strokeWidth={3} />
    {[50, 80, 110, 140, 170, 200].map((x) => (
      <line key={x} x1={x} y1={38} x2={x} y2={70} stroke={BRASS_LO} strokeWidth={2} opacity={0.6} />
    ))}
  </svg>
);

/** Comment prompt: "Nickel next?" visitor poll (no fake counts), share line, penny jar. */
export const CommentScene: React.FC<VisualProps> = ({ scene, timeline }) => {
  const t = useT();
  const mouth = useMouth(timeline.mouth, scene.start);
  const yesAt = wordAt(scene, /^yes$/i, 0, 1.5) - 0.12;
  const noAt = wordAt(scene, /^no/i, 0, 2.0) - 0.12;
  const chipAt = wordAt(scene, /^Comment$/i, 0, 1.1);
  const card = popIn(t, 0, 0.32);
  const Btn: React.FC<{ label: string; s: number }> = ({ label, s }) => (
    <div
      style={{
        width: 270,
        height: 118,
        borderRadius: 26,
        background: "linear-gradient(180deg, #F8EFD9 0%, #E6D4AE 100%)",
        border: `4px solid ${BRASS_LO}`,
        boxShadow: "0 10px 0 rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        scale: String(s),
        color: "#2A1A08",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 64,
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, border: "5px solid #2A1A08", boxSizing: "border-box" }} />
      {label}
    </div>
  );
  return (
    <AbsoluteFill>
      <GalleryRoom spots={[{ x: 480, w: 400, a: 0.9 }]} tt={scene.start + t} motes={0.8} />
      <div style={{ position: "absolute", left: 70, width: 820, top: 196, textAlign: "center", fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 54, lineHeight: 1.12, color: CREAM, scale: String(popIn(t, 0.05)), textShadow: "0 6px 16px rgba(0,0,0,0.6)" }}>
        Send this to whoever
        <br />
        has a <span style={{ color: "#F0A97C" }}>penny jar</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 370,
          width: 760,
          height: 440,
          scale: String(0.85 + 0.15 * card),
          opacity: card,
          borderRadius: 34,
          background: "linear-gradient(180deg, #1C2D49 0%, #0B1424 100%)",
          border: `5px solid ${BRASS}`,
          boxShadow: "inset 0 2px 0 rgba(255,231,176,0.2), 0 24px 40px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 30,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: "#9FB2CC" }}>VISITOR POLL</div>
        <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 96, color: CREAM, marginTop: 6, whiteSpace: "nowrap" }}>Nickel next?</div>
        <div style={{ display: "flex", gap: 44, marginTop: 34 }}>
          <Btn label="YES" s={popIn(t, yesAt, 0.3)} />
          <Btn label="NO" s={popIn(t, noAt, 0.3)} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 480,
          top: 838,
          translate: "-50% 0",
          scale: String(popIn(t, chipAt)),
          background: "rgba(8,17,31,0.92)",
          border: `3px solid ${COPPER}`,
          color: CREAM,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 40,
          padding: "10px 28px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}
      >
        YOUR PENNY JAR STILL SPENDS
      </div>
      <div style={{ position: "absolute", left: 140, top: 952, scale: String(popIn(t, 0.2, 0.4)), rotate: `${-4 + 3 * Math.sin(t * 2)}deg` }}>
        <Curator size={210} mouth={mouth} wave={Math.sin(t * 7)} look={0.4} />
      </div>
      <div style={{ position: "absolute", left: 560, top: 900, scale: String(popIn(t, 0.35, 0.4)) }}>
        <Jar />
      </div>
    </AbsoluteFill>
  );
};
