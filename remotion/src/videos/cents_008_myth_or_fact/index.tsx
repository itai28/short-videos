import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, BUNGEE } from "../../fonts";
import { useMouth } from "../../shared/Centy";
import { VisualMap, VisualProps } from "../../types";
import { at, clamp01, popIn } from "../../visuals/util";
import { Answer1Face, Answer2Face, BossFace, BossState, CARD_H, CARD_H_BOSS, CARD_H_MID, FlipCard, KeyFace, QuestionFace } from "./Card";
import { Backdrop, BossSign, Burst, Buzzer, Host, Marquee, P, Ring, Scoreboard, rgba } from "./Set";

// Visuals for cents_008_myth_or_fact. One persistent game-show stage; each scene kind is a phase of it.
type Phase = "hook" | "question" | "answer" | "math" | "outro";
type FaceId = "Q1" | "Q2" | "Q3" | "A1" | "A2" | "A3" | "KEY";

const ROW_Y = 1168; // ring + buzzers row centre
const MYTH_X = 212;
const FACT_X = 748;
const RING_X = 480;
const ANSWERS: Record<number, "MYTH" | "FACT"> = { 1: "MYTH", 2: "FACT", 3: "MYTH" };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mod = (x: number, m: number) => ((x % m) + m) % m;

const Stage: React.FC<VisualProps> = ({ scene, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const mouth = useMouth(timeline.mouth, scene.start);
  const phase = scene.visual.kind.split(".")[1] as Phase;
  const round = (scene.visual.round as number) ?? 1;
  const dur = scene.dur;
  const endT = (Math.max(1, Math.round(dur * fps)) - 1) / fps;
  const abs = scene.start + t;
  const hold = (scene.hold as number) ?? 0;
  const holdStart = dur - hold;
  const inHold = phase === "question" && t >= holdStart;
  const reveal = phase === "answer" ? at(scene, "reveal", 0.5) : NaN;
  const revealed = Number.isFinite(reveal) && t >= reveal;
  const word = (re: RegExp, fb: number) => scene.words.find((w) => re.test(w.w))?.t ?? fb;
  const spr = (start: number, damping = 12, stiffness = 120) =>
    Number.isFinite(start) ? spring({ frame: frame - Math.round(start * fps), fps, config: { damping, stiffness } }) : 0;
  const ramp = (a: number, b: number) =>
    interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const bump = (a: number, len: number) => (t < a || t > a + len ? 0 : Math.sin((Math.PI * (t - a)) / len));
  const answer = ANSWERS[round];

  // ---- clocks: the outro winds every cycle back to its frame-0 phase so the loop is seamless
  const loopK = phase === "outro" ? ramp(0, 0.5) : 0;
  const vtLoop = t - endT;
  const vt = phase === "outro" ? vtLoop : abs;
  const beamOf = (x: number) => 12 * Math.sin(x * 3);
  const beam = lerp(beamOf(abs), beamOf(vtLoop), loopK);
  const halo = lerp(mod(abs * 6, 15), mod(vtLoop * 6, 15), loopK);
  const bobOf = (x: number) => -5 * Math.abs(Math.sin(Math.PI * 2 * x));
  const bob = lerp(bobOf(abs), bobOf(vtLoop), loopK);
  const chase = Math.floor(vt * 10);

  // ---- boss lighting + sign
  const boss = phase === "question" && round === 3 ? ramp(0.05, 0.5) : phase === "answer" && round === 3 ? 1 : phase === "math" ? 1 : phase === "outro" ? 1 - ramp(0, 0.45) : 0;
  let signY = -400;
  let swing = 0;
  if (phase === "question" && round === 3) {
    const d = spr(0.12, 8, 150);
    signY = lerp(-300, 150, d);
    swing = 2.2 * Math.sin((t - 0.4) * 9) * Math.exp(-Math.max(0, t - 0.4) * 2.6) * (t > 0.4 ? 1 : 0);
  } else if ((phase === "answer" && round === 3) || phase === "math") {
    signY = 150;
  } else if (phase === "outro") {
    signY = 150 - 520 * ramp(0, 0.42);
  }

  // ---- card faces + flip angle
  const flip = (a: number, b: number) => 180 * ramp(a, b);
  let A: FaceId = "Q1";
  let B: FaceId | undefined;
  let angle = 0;
  const tOnly = word(/^Only$/, 1.2);
  const outroMid = 1.2;
  if (phase === "question" && round > 1) {
    A = `A${round - 1}` as FaceId;
    B = `Q${round}` as FaceId;
    angle = flip(0, 0.36);
  } else if (phase === "question") {
    A = "Q1";
  } else if (phase === "answer") {
    A = `Q${round}` as FaceId;
    B = `A${round}` as FaceId;
    angle = flip(reveal - 0.3, reveal);
  } else if (phase === "math") {
    A = "A3";
  } else if (phase === "outro") {
    if (t < outroMid) {
      A = "A3";
      B = "KEY";
      angle = flip(0.02, 0.42);
    } else {
      A = "KEY";
      B = "Q1";
      angle = flip(endT - 0.55, endT - 0.1);
    }
  }
  const tRaise = word(/^\$1,000$/, 0.26);
  const dockK = phase === "answer" && round === 3 ? ramp(tOnly - 0.2, tOnly + 0.25) : 0;
  const growK = phase === "math" ? ramp(tRaise - 0.2, tRaise + 0.25) : 0;
  const cardH =
    phase === "answer" && round === 3
      ? lerp(CARD_H, CARD_H_MID, dockK)
      : phase === "math"
        ? lerp(CARD_H_MID, CARD_H_BOSS, growK)
        : phase === "outro"
          ? lerp(CARD_H_BOSS, CARD_H, ramp(0, 0.42))
          : CARD_H;
  // ring + buzzers step down while the bills appear, then leave when the boss chart needs the room
  const rowK = phase === "math" ? 1 - ramp(tRaise - 0.25, tRaise + 0.1) : phase === "outro" ? ramp(0.08, 0.45) : 1;
  const rowShift = phase === "answer" && round === 3 ? 26 * dockK : phase === "math" ? 26 : 0;

  // heartbeat on the boss card during the silent countdown
  const hbPhase = mod(t - holdStart, 0.72);
  const heart = inHold && round === 3 ? Math.exp(-Math.pow(hbPhase / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((hbPhase - 0.2) / 0.05, 2)) : 0;
  const readPulse = phase === "question" ? bump(word(/./, 0.05), 0.5) : 0;
  const cardScale = 1 + 0.03 * readPulse + 0.015 * heart;

  // stamps
  const stampS = revealed ? spr(reveal, 9, 160) : phase === "math" || (phase === "outro" && t < outroMid) ? 1 : 0;
  const prevStamp = phase === "question" && round > 1 ? 1 : 0;
  const rayRot = abs * 14;

  const bossState: BossState = (() => {
    const isMath = phase === "math" || phase === "outro";
    const tPast = word(/^over$/, 1.85);
    const tPay = word(/^pay$/, 2.6);
    const tYou = word(/^You$/, 1.6);
    const tKept = word(/^\$820$/, 2.3);
    if (isMath) {
      const m = phase === "math";
      return {
        stampS: 1,
        dock: 1,
        bills: Array(10).fill(1),
        cap22: 1,
        line: 1,
        chip12: 1,
        chip22: 1,
        stair: 1,
        axis: m ? popIn(t, tRaise) : 1,
        sweep: m ? interpolate(t, [tRaise, tRaise + 0.7], [-0.2, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 2,
        tax1: m ? popIn(t, tRaise + 0.62) : 1,
        tax2: m ? popIn(t, tRaise + 0.8) : 1,
        taxBox: m ? spr(tYou - 0.05, 11) + 0.1 * bump(word(/^tax\.?$/, 4.13) - 0.05, 0.5) : 1,
        kept: m ? spr(tKept - 0.04, 9, 170) : 1,
        rot: rayRot,
        low: scene.visual.low as number,
        high: scene.visual.high as number,
        extra: scene.visual.extra as number,
        keptV: scene.visual.kept as number,
      };
    }
    return {
      stampS,
      dock: ramp(tOnly - 0.2, tOnly + 0.25),
      bills: Array.from({ length: 10 }).map((_, i) => popIn(t, tOnly + 0.12 + i * 0.045, 0.28)),
      cap22: ramp(tPay - 0.1, tPay + 0.3),
      line: ramp(tPast - 0.05, tPast + 0.35),
      chip12: popIn(t, tOnly + 0.35),
      chip22: popIn(t, tPay),
      stair: ramp(tPay + 0.25, tPay + 0.75),
      axis: 0,
      sweep: -1,
      tax1: 0,
      tax2: 0,
      taxBox: 0,
      kept: 0,
      rot: rayRot,
      low: 48,
      high: 132,
      extra: 180,
      keptV: 820,
    };
  })();
  // Math scene always passes the script's numbers; the outro shows the same finished chart.
  if (phase === "outro") {
    bossState.low = 48;
    bossState.high = 132;
    bossState.extra = 180;
    bossState.keptV = 820;
  }

  const faceGlow = heart;
  // marker highlights on the question card sweep in as their words are spoken
  const sweep = (re: RegExp, fb: number) => {
    const w = word(re, fb);
    return interpolate(t, [w - 0.05, w + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  };
  const face = (id: FaceId | undefined) => {
    if (!id) return undefined;
    switch (id) {
      case "Q1":
        return <QuestionFace round={1} glow={0} hk={[phase === "question" ? sweep(/^lower$/, 1.6) : phase === "answer" ? 1 : 0]} />;
      case "Q2":
        return <QuestionFace round={2} glow={0} hk={[phase === "question" ? sweep(/^doesn't$/, 1.05) : 1]} />;
      case "Q3":
        return <QuestionFace round={3} glow={faceGlow} hk={phase === "question" ? [sweep(/^bracket$/, 0.8), sweep(/^lower$/, 1.67)] : [1, 1]} />;
      case "A1":
        return <Answer1Face s={phase === "answer" ? stampS : prevStamp} rot={rayRot} soft={phase === "answer" ? bump(word(/^soft$/, 1.6), 0.6) : 0} />;
      case "A2": {
        const live = phase === "answer";
        return (
          <Answer2Face
            s={live ? stampS : prevStamp}
            rot={rayRot}
            card={live ? popIn(t, reveal + 0.3, 0.35) : 1}
            x={live ? spr(word(/^isn't$/, 1.6), 9, 170) : 1}
            flow={live ? t * 2.2 : 0}
          />
        );
      }
      case "A3":
        return <BossFace st={bossState} />;
      case "KEY":
        return <KeyFace />;
      default:
        return undefined;
    }
  };

  // ---- ring
  let ringP = 1;
  let ringColor = round === 3 && phase !== "outro" && phase !== "hook" ? P.red : P.teal;
  let center = "?";
  let cs = 1 + 0.05 * Math.sin(vt * 5);
  if (phase === "question") {
    const target = round === 3 ? P.red : P.teal;
    const prevAns = ANSWERS[round - 1];
    // previous answer drains out fast, then the ring refills in this round's colour
    const swap = 0.16;
    ringColor = round > 1 && t < swap ? (prevAns === "MYTH" ? P.red : P.green) : target;
    ringP = inHold ? 1 - (t - holdStart) / hold : round > 1 ? (t < swap ? 1 - ramp(0, swap) : ramp(swap, 0.5)) : 1;
    if (inHold) {
      const k = Math.min(2, Math.floor((t - holdStart) / (hold / 3)));
      center = String(3 - k);
      cs = popIn(t, holdStart + (k * hold) / 3, 0.18);
    } else if (round > 1 && t < swap) {
      center = prevAns === "MYTH" ? "x" : "check";
      cs = 1 - ramp(0, swap);
    } else if (round > 1) {
      cs = popIn(t, swap, 0.28) * (1 + 0.05 * Math.sin(vt * 5));
    }
  } else if (phase === "answer") {
    if (!revealed) {
      ringP = 0;
      center = "?";
      cs = 0.85;
    } else {
      ringP = spr(reveal, 14, 140);
      ringColor = answer === "MYTH" ? P.red : P.green;
      center = answer === "MYTH" ? "x" : "check";
      cs = spr(reveal, 8, 180);
    }
  } else if (phase === "math") {
    ringColor = P.red;
    center = "x";
    cs = 1;
  }

  // ---- buzzers
  let mythL = 0.6;
  let factL = 0.6;
  let mythPress = 0;
  let factPress = 0;
  if (phase === "hook") {
    mythL += 0.4 * bump(word(/^Myth$/i, 0.05) - 0.02, 0.5);
    factL += 0.4 * bump(word(/^fact/i, 0.6) - 0.02, 0.6);
  } else if (phase === "question") {
    if (inHold) {
      const k = Math.floor((t - holdStart) / (hold / 3));
      const on = k % 2 === 0;
      mythL = on ? 1 : 0.42;
      factL = on ? 0.42 : 1;
    } else if (round > 1) {
      const back = ramp(0, 0.35);
      const prevMyth = ANSWERS[round - 1] === "MYTH";
      mythL = lerp(prevMyth ? 0.95 : 0.3, 0.6, back);
      factL = lerp(prevMyth ? 0.3 : 0.95, 0.6, back);
    }
  } else if (phase === "answer") {
    if (!revealed) {
      mythL = 0.5;
      factL = 0.5;
    } else {
      const flash = 0.95 + 0.05 * Math.sin((t - reveal) * 30) * Math.exp(-(t - reveal) * 3);
      const press = interpolate(t, [reveal - 0.06, reveal + 0.04, reveal + 0.32], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      if (answer === "MYTH") {
        mythL = flash;
        factL = 0.3;
        mythPress = press;
      } else {
        factL = flash;
        mythL = 0.3;
        factPress = press;
      }
    }
  } else if (phase === "math") {
    mythL = 0.95;
    factL = 0.3;
  } else if (phase === "outro") {
    mythL = 0.6;
    factL = 0.6;
  }

  // ---- Centy
  let expr: "talk" | "smug" | "shocked" | "worried" | "hype" = "talk";
  let look = -0.6;
  if (phase === "question" && inHold) {
    expr = "worried";
    look = Math.floor((t - holdStart) / (hold / 3)) % 2 === 0 ? -1 : 0.5;
  } else if (phase === "question" && round === 3) {
    expr = "worried";
  } else if (phase === "answer") {
    if (!revealed) expr = "worried";
    else if (t < reveal + 1.0) expr = answer === "FACT" ? "hype" : round === 3 ? "shocked" : "smug";
  } else if (phase === "math") {
    const tk = word(/^\$820$/, 2.3);
    if (t > tk && t < tk + 1.2) expr = "hype";
  } else if (phase === "outro") {
    if (t > 0.1 && t < endT - 0.6) expr = "hype";
  }

  // ---- reveal shake (boss reveal only, exactly 3 frames)
  let shakeX = 0;
  let shakeY = 0;
  if (phase === "answer" && round === 3 && Number.isFinite(reveal)) {
    const rf = frame - Math.round(reveal * fps);
    const S: [number, number][] = [
      [16, -10],
      [-13, 9],
      [8, -5],
    ];
    if (rf >= 0 && rf < 3) [shakeX, shakeY] = S[rf];
  }

  // ---- fine print row (y 1300-1470)
  const finePrint = (() => {
    const box: React.CSSProperties = {
      position: "absolute",
      left: 70,
      width: 820,
      top: 1306,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      textAlign: "center",
    };
    const line: React.CSSProperties = {
      fontFamily: BODY,
      fontWeight: 500,
      fontSize: 36,
      color: "rgba(255,255,255,0.9)",
      background: "rgba(10,2,25,0.6)",
      border: "2px solid rgba(255,255,255,0.18)",
      borderRadius: 16,
      padding: "6px 18px",
      whiteSpace: "nowrap",
    };
    if (phase === "answer" && round < 3) {
      const o = popIn(t, reveal + 0.7, 0.3);
      return (
        <div style={{ ...box, opacity: clamp01(o * 2), translate: `0 ${(1 - o) * 30}px` }}>
          {round === 2 && <div style={line}>Credit history comes from credit accounts.</div>}
          <div style={line}>
            Source: <b style={{ fontWeight: 800 }}>CFPB</b> (U.S. consumer agency)
          </div>
        </div>
      );
    }
    if ((phase === "answer" && round === 3) || phase === "math") {
      const o = phase === "math" ? 1 : popIn(t, tOnly + 0.3, 0.3);
      const hl = phase === "math" ? bump(word(/^federal$/, 3.1) - 0.1, 1.2) : 0;
      return (
        <div style={{ ...box, opacity: clamp01(o * 2) }}>
          <div style={line}>2026 federal brackets · single filer</div>
          <div style={{ ...line, border: `2px solid ${rgba(P.gold, 0.25 + 0.75 * hl)}`, scale: String(1 + 0.05 * hl) }}>
            taxable income · <b style={{ fontWeight: 800, color: P.gold }}>federal income tax only</b>
          </div>
        </div>
      );
    }
    if (phase === "outro") {
      const inK = popIn(t, word(/^ask$/, 1.3) - 0.1, 0.35);
      const out = 1 - ramp(endT - 0.5, endT - 0.2);
      const disc = ramp(0.1, 0.35) * out;
      return (
        <div style={{ ...box, gap: 16 }}>
          <div
            style={{
              fontFamily: BUNGEE,
              fontSize: 44,
              color: P.deep,
              background: P.teal,
              borderRadius: 20,
              padding: "8px 26px 10px",
              boxShadow: "0 8px 0 rgba(0,0,0,0.4), 0 0 30px rgba(30,214,196,0.6)",
              scale: String(inK * out),
              whiteSpace: "nowrap",
            }}
          >
            SEND THIS TO A PARENT
          </div>
          <div style={{ ...line, opacity: disc }}>Education only, not financial advice.</div>
        </div>
      );
    }
    return null;
  })();

  // ---- reveal wash + burst
  const washK = revealed ? clamp01(1 - (t - reveal) / 0.6) : 0;
  const ansX = answer === "MYTH" ? MYTH_X : FACT_X;
  const ansColor = answer === "MYTH" ? P.red : P.green;
  const tScore = word(/^score/, 0.6);
  const scoreEnv = phase === "outro" && t > tScore ? 1 - ramp(endT - 0.7, endT - 0.3) : 0;
  const scorePulse = scoreEnv * (0.55 + 0.45 * Math.sin((t - tScore) * 9 - Math.PI / 2 + Math.PI));

  return (
    <AbsoluteFill style={{ translate: `${shakeX}px ${shakeY}px`, scale: shakeX !== 0 ? "1.04" : "1" }}>
      <Backdrop beam={beam} halo={halo} vt={vt} boss={boss} />
      {washK > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${ansX}px ${ROW_Y}px, ${rgba(answer === "MYTH" ? P.red : P.green, 0.55 * washK)} 0%, transparent 70%)` }} />
      )}
      <Marquee vt={vt} chase={chase} />
      <BossSign y={signY} swing={swing} />
      <Scoreboard pulse={clamp01(scorePulse)} />
      {/* offset Centy's own clock so he is never mid-blink on frame 0 or on the loop frame */}
      <Sequence from={-60} layout="none">
        <Host mouth={mouth} expr={expr} look={look} bob={bob} />
      </Sequence>
      <FlipCard h={cardH} angle={angle} a={face(A)} b={face(B)} s={cardScale} />
      {rowK > 0.001 && (
        <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - rowK) * 160 + rowShift}px`, opacity: rowK }}>
          <Buzzer cx={MYTH_X} cy={ROW_Y} color={P.red} dark={P.redDark} label="MYTH" light={mythL} press={mythPress} id="mythBuzzM" />
          <Buzzer cx={FACT_X} cy={ROW_Y} color={P.green} dark={P.greenDark} label="FACT" light={factL} press={factPress} id="mythBuzzF" />
          <Ring cx={RING_X} cy={ROW_Y - 6} p={ringP} color={ringColor} center={center} cs={cs} />
        </div>
      )}
      {revealed && <Burst x={ansX} y={ROW_Y - 60} k={t - reveal} color={ansColor} seed={round * 17} />}
      {finePrint}
    </AbsoluteFill>
  );
};

export const visuals: VisualMap = {
  "myth.hook": Stage,
  "myth.question": Stage,
  "myth.answer": Stage,
  "myth.math": Stage,
  "myth.outro": Stage,
};
