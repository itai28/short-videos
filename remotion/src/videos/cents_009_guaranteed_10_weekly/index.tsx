import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAVEAT, DISPLAY, MARKER } from "../../fonts";
import { Centy } from "../../shared/Centy";
import { Scene, Timeline, VisualMap, VisualProps } from "../../types";
import { clamp01, useT } from "../../visuals/util";
import {
  BLUE,
  Desk,
  Highlight,
  InkPath,
  MarkerPen,
  NAVY,
  NotebookPage,
  Pencil,
  Pt,
  RED,
  Scraps,
  Write,
  boil,
  jitter,
  prog,
  roughEllipse,
  roughRect,
  smoothPath,
} from "./Ink";
import { ArrowDoodle, PhotoFrame } from "./Photo";

/* ------------------------------------------------------------------ */
/* The exponential curve (world coordinates; camera offset 0 = screen) */
/* ------------------------------------------------------------------ */
// Hand-drawn and NOT to scale (the real curve can't fit: each year is x142). Shape is a true exponential.
const X0 = 150;
const Y0 = 1150;
const XW = 2.5; // px per week
const HMAX = 1590; // px of rise at week 260
const TAU = 52.5;
const E260 = Math.exp(260 / TAU) - 1;
const cxW = (w: number) => X0 + XW * w;
const cyW = (w: number) => Y0 - (HMAX * (Math.exp(w / TAU) - 1)) / E260;
const TOP = -660; // top edge of the notebook page
const W_TOP = TAU * Math.log(1 + ((Y0 - TOP) / HMAX) * E260); // week where the line hits the page edge
const W_END = 276;
const CMAX = 870; // final camera lift (page edge lands at screen y ~210)
const CAM_TARGET = 350; // the camera keeps the drawing tip at about this screen y once it climbs (late enough that each label is read before it scrolls away)
const RIP_X = cxW(W_TOP);

type Label = { year: number; text: string; big: Pt; tag: Pt };
// big = centre of the big number while it is "current"; tag = where it shrinks to afterwards
const LABELS: Label[] = [
  { year: 1, text: "$14,204", big: [380, 985], tag: [292, 1066] },
  { year: 2, text: "$2.0M", big: [430, 955], tag: [392, 1013] },
  { year: 3, text: "$287M", big: [345, 895], tag: [446, 913] },
  { year: 4, text: "$40.7B", big: [400, 660], tag: [585, 600] }, // left of the steep part; scrolls down under the captions as the camera chases
  { year: 5, text: "$5.78T", big: [560, -432], tag: [560, -432] },
];

const sceneOf = (tl: Timeline, phase: string) => tl.scenes.find((s) => s.visual.kind === "scam.notebook" && s.visual.phase === phase) as Scene;
const wordAt = (s: Scene, re: RegExp, fb: number) => s.start + (s.words.find((w) => re.test(w.w))?.t ?? fb);

const keysOf = (tl: Timeline) => {
  const cut = sceneOf(tl, "cut");
  const curve = sceneOf(tl, "curve");
  const chase = sceneOf(tl, "chase");
  const torn = sceneOf(tl, "torn");
  const k = {
    cut: wordAt(cut, /^math/i, cut.dur - 0.55),
    curve: curve.start,
    w0: wordAt(curve, /^\$100/, 0.05),
    w52: wordAt(curve, /^1$/, 1.2),
    w104: wordAt(curve, /^2:$/, 3.3),
    w156: wordAt(chase, /^3:$/, 0.05),
    w208: wordAt(chase, /^4:$/, 2.1),
    w260: wordAt(chase, /^5:$/, 3.8),
    labels: [wordAt(curve, /^\$14/, 2.3), wordAt(curve, /^\$2$/, 3.5), wordAt(chase, /^\$287/, 0.4), wordAt(chase, /^\$40/, 2.7), wordAt(chase, /^\$5\.78/, 4.1)],
    rip: wordAt(chase, /^trillion/i, 4.7),
    circle: wordAt(torn, /^not$/i, 0.4),
    chip: wordAt(torn, /^investing/i, 0.6),
    reveal: torn.start + (torn.reveals[0] ?? 1.8),
  };
  return k;
};
type Keys = ReturnType<typeof keysOf>;

/** Week reached by the drawing tip at absolute time `now`. */
const weekAt = (k: Keys, now: number) => {
  const ts = [k.w0, k.w52, k.w104, k.w156, k.w208, k.w260, k.rip, k.rip + 0.4];
  const ws = [0, 52, 104, 156, 208, 260, W_TOP, W_END];
  for (let i = 1; i < ts.length; i++) ts[i] = Math.max(ts[i], ts[i - 1] + 0.05);
  if (now < ts[0]) return -1;
  return interpolate(now, ts, ws, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

const camAt = (k: Keys, now: number) => {
  // follow the tip once it climbs above CAM_TARGET, averaged over a short window so the chase eases in and out
  let acc = 0;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const w = weekAt(k, now + (i - (n - 1) / 2) * 0.06);
    const tipY = w < 0 ? Y0 : cyW(w);
    acc += Math.max(0, Math.min(CMAX, CAM_TARGET - tipY));
  }
  return acc / n;
};

const BigLabel: React.FC<{ l: Label; now: number; appear: number; header: number; shrink: number; step: number }> = ({ l, now, appear, header, shrink, step }) => {
  const pHead = prog(now, header, 0.3);
  const pNum = prog(now, appear, 0.32);
  const pHl = prog(now, appear + 0.18, 0.25);
  const k = prog(now, shrink, 0.42, Easing.inOut(Easing.cubic));
  if (pHead <= 0 && pNum <= 0) return null;
  const x = l.big[0] + (l.tag[0] - l.big[0]) * k;
  const y = l.big[1] + (l.tag[1] - l.big[1]) * k;
  const s = 1 - 0.56 * k;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, scale: String(s) }}>
      <Write p={pHead * (1 - k)} step={step} seed={`h${l.year}`} style={{ left: -90, top: -128, fontFamily: CAVEAT, fontSize: 50, color: NAVY, opacity: 1 - k }}>
        year {l.year}
      </Write>
      <Highlight x={-l.text.length * 25 - 14} y={-14} w={l.text.length * 50 + 28} h={64} p={pHl} />
      <Write p={pNum} step={step} seed={`n${l.year}`} style={{ left: 0, top: 0, translate: "-50% -54%", fontFamily: MARKER, fontSize: 104, color: RED, lineHeight: 1 }}>
        {l.text}
      </Write>
    </div>
  );
};

/** The notebook: equation, axes, the self-drawing curve, the camera chase and the rip. */
const NotebookWorld: React.FC<{ k: Keys; now: number; frameAbs: number }> = ({ k, now, frameAbs }) => {
  const step = boil(frameAbs);
  const w = weekAt(k, now);
  const cam = now >= k.rip ? CMAX : camAt(k, now);
  const rt = now - k.rip;
  const jolt = rt > 0 && rt < 0.25 ? 9 * Math.sin(rt * 80) * Math.exp(-rt * 14) : 0;
  const tear = prog(now, k.rip - 0.04, 0.16);
  const c0 = k.cut;
  // equation + axes timing
  const pEq1 = prog(now, c0 + 0.02, 0.45, Easing.inOut(Easing.quad));
  const pSup = prog(now, c0 + 0.45, 0.2);
  const pEq2 = prog(now, c0 + 0.5, 0.45, Easing.inOut(Easing.quad));
  const pEq3 = prog(now, Math.max(c0 + 0.9, k.w0 + 0.2), 0.4, Easing.inOut(Easing.quad));
  const pEqHl = prog(now, Math.max(c0 + 1.2, k.w0 + 0.5), 0.3);
  const pAxY = prog(now, c0 + 0.05, 0.45);
  const pAxX = prog(now, c0 + 0.2, 0.5);
  const pTicks = prog(now, c0 + 0.5, 0.4);
  const pStart = prog(now, k.w0, 0.3);
  // curve up to the tip
  const pts: Pt[] = [];
  if (w >= 0) {
    for (let x = 0; x < w; x += x < 150 ? 3 : 1) pts.push([cxW(x), cyW(x)]);
    pts.push([cxW(w), cyW(w)]);
  }
  const curve = smoothPath(jitter(pts, "cv", step, 1.5, (i) => (pts[i][0] - X0) * 0.05));
  const tip: Pt = w >= 0 ? [cxW(w), cyW(w)] : [X0, Y0];
  const penOn = w >= 0 && now < k.rip + 0.5;
  const shrinkAt = [k.w104, k.w156, k.w208, k.w260, Infinity];
  const headerAt = [k.w52, k.w104, k.w156, k.w208, k.w260];
  const yearPts = [52, 104, 156, 208, 260].map((x) => [cxW(x), cyW(x)] as Pt);
  // torn-page beat
  const pCircle = prog(now, k.circle, 0.5, Easing.inOut(Easing.quad));
  const pChip = prog(now, k.chip, 0.45, Easing.inOut(Easing.quad));
  const pCenty = prog(now, k.reveal, 0.35);
  const pFan = prog(now, k.reveal + 0.2, 0.4, Easing.inOut(Easing.quad));
  const pFanArrow = prog(now, k.reveal + 0.45, 0.3);
  const axisY: Pt[] = [
    [X0, Y0 + 8],
    [X0 - 1, 800],
    [X0 + 1, 470],
  ];
  const axisX: Pt[] = [
    [X0 - 8, Y0],
    [500, Y0 + 1],
    [850, Y0 - 1],
  ];
  return (
    <AbsoluteFill>
      <Desk />
      {/* paper layer */}
      <div style={{ position: "absolute", inset: 0, translate: `0px ${cam + jolt}px` }}>
        <NotebookPage top={TOP} height={2700} tear={tear} tearX={RIP_X} ruleStart={140} />
      </div>
      {/* ink layer: fades out above the caption band so captions always sit on clean paper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0px, #000 1212px, rgba(0,0,0,0) 1252px)",
          maskImage: "linear-gradient(to bottom, #000 0px, #000 1212px, rgba(0,0,0,0) 1252px)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, translate: `0px ${cam + jolt}px` }}>
          {/* equation */}
          <Write p={pEq1} step={step} seed="e1" style={{ left: 150, top: 168, fontFamily: MARKER, fontSize: 84, color: NAVY, lineHeight: "110px" }}>
            $100 × 1.10
          </Write>
          <div style={{ position: "absolute", left: 572, top: 150, fontFamily: MARKER, fontSize: 54, color: RED, scale: String(pSup), opacity: pSup > 0 ? 1 : 0 }}>52</div>
          <Write p={pEq2} step={step} seed="e2" style={{ left: 156, top: 284, fontFamily: CAVEAT, fontSize: 56, color: NAVY }}>
            +10% every single week
          </Write>
          <Highlight x={150} y={378} w={410} h={56} p={pEqHl} />
          <Write p={pEq3} step={step} seed="e3" style={{ left: 156, top: 360, fontFamily: CAVEAT, fontSize: 56, color: NAVY }}>
            52 weeks = 1 year
          </Write>
          {/* axes */}
          <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <InkPath d={smoothPath(jitter(axisY, "ay", step))} p={pAxY} width={6} />
            <InkPath d={smoothPath(jitter(axisX, "ax", step))} p={pAxX} width={6} />
            {pAxY >= 1 && <InkPath d={`M${X0 - 18} 494 L${X0} 466 L${X0 + 18} 494`} width={6} />}
            {pAxX >= 1 && <InkPath d={`M826 ${Y0 - 18} L854 ${Y0} L826 ${Y0 + 18}`} width={6} />}
            {[52, 104, 156, 208, 260].map((x, i) => (
              <InkPath key={i} d={`M${cxW(x)} ${Y0 - 12} L${cxW(x)} ${Y0 + 12}`} p={clamp01(pTicks * 5 - i)} width={5} />
            ))}
            {/* the curve */}
            {w >= 0 && <path d={curve} fill="none" stroke={NAVY} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />}
            {w >= 0 && <circle cx={X0} cy={Y0} r={11 * pStart} fill={NAVY} />}
            {yearPts.map(([x, y], i) => (w >= [52, 104, 156, 208, 260][i] ? <circle key={i} cx={x} cy={y} r={12} fill={RED} stroke={NAVY} strokeWidth={4} /> : null))}
          </svg>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <div key={n} style={{ position: "absolute", left: cxW(52 * n), top: Y0 + 14, translate: "-50% 0", fontFamily: CAVEAT, fontSize: 44, color: NAVY, opacity: clamp01(pTicks * 5 - i) }}>
              {n}
            </div>
          ))}
          <Write p={pTicks} style={{ left: 166, top: Y0 + 14, fontFamily: CAVEAT, fontSize: 44, color: NAVY }}>
            yr
          </Write>
          <Write p={pAxY} style={{ left: 176, top: 440, fontFamily: CAVEAT, fontSize: 44, color: NAVY, opacity: 0.85 }}>
            $ (not to scale)
          </Write>
          <Write p={pStart} step={step} seed="s0" style={{ left: 138, top: Y0 - 34, translate: "-100% -50%", fontFamily: CAVEAT, fontSize: 46, color: NAVY }}>
            $100
          </Write>
          {/* labels */}
          {LABELS.map((l, i) => (
            <BigLabel key={l.year} l={l} now={now} appear={k.labels[i]} header={headerAt[i]} shrink={shrinkAt[i]} step={step} />
          ))}
          {/* line keeps going through the torn edge */}
          {penOn && <MarkerPen x={tip[0]} y={tip[1]} angle={interpolate(w, [0, 110, 190], [78, 78, 148], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} scale={0.85} />}
          {/* torn-page beat: circle, yearly %, Centy doodle */}
          <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <InkPath d={smoothPath(jitter(roughEllipse(560, -456, 236, 126, 2), "ci", step, 2))} p={pCircle} color={RED} width={9} />
          </svg>
          <Write p={pChip} step={step} seed="ch" style={{ left: 250, top: -318, fontFamily: MARKER, fontSize: 64, color: NAVY }}>
            = 14,104% a year
          </Write>
          {pCenty > 0 && (
            <div
              style={{
                position: "absolute",
                left: 64,
                top: -170,
                clipPath: `circle(${pCenty * 75}% at 50% 50%)`,
                rotate: `${-6 + 3 * Math.sin(now * 3)}deg`,
              }}
            >
              <Centy size={220} ink={NAVY} expr="deadpan" />
            </div>
          )}
          <Write p={pFan} step={step} seed="ff" style={{ left: 300, top: -112, fontFamily: CAVEAT, fontSize: 108, color: RED, rotate: "-4deg", lineHeight: 1.1 }}>
            fan fiction.
          </Write>
          {pFanArrow > 0 && (
            <div style={{ position: "absolute", left: 540, top: -196, rotate: "-70deg", opacity: pFanArrow, scale: String(0.6 + 0.4 * pFanArrow) }}>
              <ArrowDoodle w={120} h={50} step={step} seed="fa" width={7} />
            </div>
          )}
        </div>
      </div>
      {/* scraps fly over everything, in world space; they fade out before "fan fiction" so the punchline sits on clean paper */}
      <div style={{ position: "absolute", inset: 0, translate: `0px ${cam}px`, opacity: 1 - prog(rt, 2.1, 0.7, Easing.inOut(Easing.quad)) }}>
        <Scraps x={RIP_X} y={TOP + 40} t={rt} />
      </div>
    </AbsoluteFill>
  );
};

/** Scenes 2-5: the photo until "math", then a hard cut to the notebook, which carries across scenes. */
const Notebook: React.FC<VisualProps> = ({ scene, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = keysOf(timeline);
  const now = scene.start + frame / fps;
  if (scene.visual.phase === "cut" && now < k.cut) {
    const t = frame / fps;
    const squint = Number.isFinite(scene.words[0]?.t) ? spring({ frame: frame - Math.round((scene.words[0]?.t ?? 0) * fps), fps, config: { damping: 14, stiffness: 140 } }) : 1;
    return <PhotoFrame u={scene.start + t} squint={squint} />;
  }
  return <NotebookWorld k={k} now={now} frameAbs={Math.round(now * fps)} />;
};

/* ------------------------------------------------------------------ */
/* Fresh pages                                                         */
/* ------------------------------------------------------------------ */
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <Desk />
    <NotebookPage top={96} height={2000} ruleStart={84} />
    {children}
  </AbsoluteFill>
);

// S&P 500 total return by calendar year, 2004-2013 (rounded %). Only 2008 is labelled on screen.
const BARS = [10.9, 4.9, 15.8, 5.5, -37.0, 26.5, 15.1, 2.1, 16.0, 32.4];

/** Real stocks: one average year turns $100 into about $110 (vs $14,204), and some years go down. */
const Real: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const step = boil(frame);
  const wt = (re: RegExp, fb: number) => scene.words.find((w) => re.test(w.w))?.t ?? fb;
  const tTen = wt(/^10%/, 1.9);
  const tYear = wt(/^year/, 2.3);
  const tBefore = wt(/^before/, 2.8);
  const tInfl = wt(/^inflation/, 3.1);
  const tDown = wt(/^down/, 4.07);
  const base = 888;
  const bw = 52;
  const gap = 20;
  const bx = (i: number) => 140 + i * (bw + gap);
  const sc = 4.2;
  return (
    <Page>
      <Write p={prog(t, 0, 0.35)} step={step} seed="rt" style={{ left: 150, top: 150, fontFamily: MARKER, fontSize: 66, color: NAVY }}>
        $100 after 1 year:
      </Write>
      <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <InkPath d={smoothPath(jitter(roughRect(100, 290, 290, 320, 3), "lb", step))} p={prog(t, 0.25, 0.5)} color={BLUE} width={6} />
        <InkPath d={smoothPath(jitter(roughRect(460, 290, 400, 320, 5), "rb", step))} p={prog(t, 0.05, 0.4)} color={RED} width={6} />
      </svg>
      <Write p={prog(t, 0.45, 0.4)} step={step} seed="l1" style={{ left: 245, top: 304, translate: "-50% 0", fontFamily: CAVEAT, fontSize: 48, color: BLUE, textAlign: "center", lineHeight: "52px" }}>
        stocks,
        <br />
        average year
      </Write>
      <Highlight x={128} y={474} w={236} h={70} p={prog(t, tTen + 0.2, 0.25)} color="#CFE3FF" />
      <Write p={prog(t, tTen - 0.1, 0.4)} step={step} seed="l2" style={{ left: 245, top: 512, translate: "-50% -50%", fontFamily: MARKER, fontSize: 112, color: BLUE, lineHeight: 1 }}>
        $110
      </Write>
      <Write p={prog(t, 0.15, 0.4)} step={step} seed="r1" style={{ left: 660, top: 304, translate: "-50% 0", fontFamily: CAVEAT, fontSize: 48, color: RED, textAlign: "center", lineHeight: "52px" }}>
        “guaranteed”
        <br />
        10% a week
      </Write>
      <Write p={prog(t, 0.3, 0.4)} step={step} seed="r2" style={{ left: 660, top: 512, translate: "-50% -50%", fontFamily: MARKER, fontSize: 100, color: RED, lineHeight: 1 }}>
        $14,204
      </Write>
      <Write p={prog(t, 0.9, 0.3)} step={step} seed="vs" style={{ left: 424, top: 452, translate: "-50% -50%", fontFamily: CAVEAT, fontSize: 64, color: NAVY }}>
        vs
      </Write>
      {/* yearly returns */}
      <Write p={prog(t, tYear - 0.3, 0.45)} step={step} seed="bt" style={{ left: 140, top: 664, fontFamily: CAVEAT, fontSize: 50, color: BLUE }}>
        US stocks each year, 2004–2013:
      </Write>
      <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <InkPath d={smoothPath(jitter([[124, base], [500, base + 1], [856, base]], "bl", step))} p={prog(t, tYear - 0.2, 0.4)} color={NAVY} width={5} />
        {BARS.map((v, i) => {
          const down = v < 0;
          const start = down ? tDown - 0.08 : tYear + i * 0.11;
          const p = down
            ? spring({ frame: frame - Math.round(start * 60), fps: 60, config: { damping: 11, stiffness: 160 } })
            : prog(t, start, 0.3, Easing.out(Easing.back(1.6)));
          if (p <= 0.001 || !Number.isFinite(p)) return null;
          const h = Math.abs(v) * sc * p;
          const y = down ? base : base - h;
          const col = down ? RED : BLUE;
          return (
            <g key={i}>
              <rect x={bx(i)} y={y} width={bw} height={Math.max(1, h)} fill={col} opacity={down ? 0.85 : 0.35} rx={3} />
              <path d={smoothPath(jitter(roughRect(bx(i), y, bw, Math.max(1, h), 9 + i), `b${i}`, step, 1.2))} fill="none" stroke={col} strokeWidth={4} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      <Write p={prog(t, tDown + 0.1, 0.4)} step={step} seed="08" style={{ left: 500, top: 900, fontFamily: MARKER, fontSize: 56, color: RED, lineHeight: "64px" }}>
        2008:
        <br />
        about −37%
      </Write>
      {/* fine print = the assumptions */}
      <Write p={prog(t, tBefore - 0.05, 0.5)} step={step} seed="f1" style={{ left: 120, top: 1082, fontFamily: CAVEAT, fontSize: 44, color: NAVY, opacity: 0.85 }}>
        S&P 500 average since 1926, before inflation
      </Write>
      <Write p={prog(t, tInfl + 0.1, 0.5)} step={step} seed="f2" style={{ left: 120, top: 1134, fontFamily: CAVEAT, fontSize: 44, color: NAVY, opacity: 0.85 }}>
        about 7% after inflation · never guaranteed
      </Write>
    </Page>
  );
};

/** "Guaranteed" + huge returns = RED FLAG stamp. */
const Flag: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = boil(frame);
  const wt = (re: RegExp, fb: number) => scene.words.find((w) => re.test(w.w))?.t ?? fb;
  const tPlus = wt(/^plus/, 0.8);
  const tIs = wt(/^is$/, 1.86);
  const tRed = wt(/^red$/, 3.0);
  const hitF = Math.round((tRed - 0.1) * fps);
  const sp = Number.isFinite(tRed) ? spring({ frame: frame - hitF, fps, config: { damping: 20, stiffness: 320, mass: 0.7 } }) : 0;
  const since = frame - hitF - 7; // landing frame ~ 7 frames after the spring starts
  const shake = since >= 0 && since < 3 ? [10, -8, 5][since] : 0; // one fixed 3-frame shake
  const on = frame >= hitF;
  const after = prog(t, tRed + 0.25, 0.4);
  return (
    <Page>
      <Write p={prog(t, 0.02, 0.55, Easing.inOut(Easing.quad))} step={step} seed="g1" style={{ left: 480, top: 220, translate: "-50% 0", fontFamily: MARKER, fontSize: 92, color: NAVY }}>
        “GUARANTEED”
      </Write>
      <Write p={prog(t, tPlus, 0.6, Easing.inOut(Easing.quad))} step={step} seed="g2" style={{ left: 480, top: 345, translate: "-50% 0", fontFamily: MARKER, fontSize: 80, color: NAVY }}>
        + HUGE RETURNS
      </Write>
      <Highlight x={300} y={392} w={470} h={60} p={prog(t, tPlus + 0.45, 0.3)} />
      <Write p={prog(t, tIs - 0.1, 0.25)} step={step} seed="g3" style={{ left: 480, top: 470, translate: "-50% 0", fontFamily: MARKER, fontSize: 100, color: NAVY }}>
        =
      </Write>
      {!on && (
        <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <InkPath d={smoothPath(jitter(roughRect(150, 620, 660, 200, 4), "ph", step))} p={prog(t, tIs, 0.5)} color={NAVY} width={4} opacity={0.4} />
        </svg>
      )}
      {on && (
        <div style={{ position: "absolute", left: 480 + shake, top: 722, width: 0, height: 0, rotate: "-8deg", scale: String(2.1 - 1.1 * sp), opacity: clamp01(sp * 3) }}>
          <svg width={760} height={240} viewBox="0 0 760 240" style={{ position: "absolute", left: -380, top: -120, overflow: "visible" }}>
            <defs>
              <filter id="grunge" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="4" result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05" result="m" />
                <feComposite in="SourceGraphic" in2="m" operator="in" />
              </filter>
            </defs>
            <g filter="url(#grunge)">
              <rect x={14} y={14} width={732} height={212} rx={26} fill="rgba(232,50,42,0.06)" stroke={RED} strokeWidth={14} />
              <rect x={34} y={34} width={692} height={172} rx={14} fill="none" stroke={RED} strokeWidth={5} />
              <text x={380} y={162} textAnchor="middle" fontFamily={DISPLAY} fontSize={118} fill={RED} letterSpacing={3}>
                RED FLAG
              </text>
            </g>
          </svg>
        </div>
      )}
      {on &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + 0.4;
          const d = 400 + 30 * Math.sin(i * 3);
          const p = clamp01(since / 10);
          return <div key={i} style={{ position: "absolute", left: 480 + Math.cos(a) * d * 0.95, top: 722 + Math.sin(a) * d * 0.33, width: 14 - i, height: 14 - i, borderRadius: "50%", background: RED, opacity: since >= 0 ? 0.7 * (1 - 0.3 * p) : 0 }} />;
        })}
      <div
        style={{
          position: "absolute",
          left: 480,
          top: 962,
          translate: "-50% -50%",
          rotate: "1.5deg",
          scale: String(0.85 + 0.15 * after),
          opacity: after,
          background: "#FFFDF6",
          padding: "8px 30px 12px",
          borderRadius: 8,
          boxShadow: "0 6px 12px rgba(70,45,15,0.22)",
          fontFamily: CAVEAT,
          fontSize: 48,
          color: NAVY,
          whiteSpace: "nowrap",
        }}
      >
        Fraud red flags: Investor.gov (SEC)
        <div style={{ position: "absolute", left: -18, top: -14, width: 70, height: 30, background: "rgba(255,242,122,0.75)", rotate: "-20deg" }} />
      </div>
      <div style={{ position: "absolute", left: 480, top: 1124, translate: "-50% 0", fontFamily: CAVEAT, fontSize: 44, color: NAVY, opacity: 0.8 * after, whiteSpace: "nowrap" }}>
        Education only, not financial advice.
      </div>
    </Page>
  );
};

/** Comment quiz: how many weeks until $100 hits $1,000,000? Countdown ticks across the hold. */
const Quiz: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const step = boil(frame);
  const wt = (re: RegExp, fb: number) => scene.words.find((w) => re.test(w.w))?.t ?? fb;
  const tHits = wt(/^hits/, 1.37);
  const tMil = wt(/^\$1$/, 1.62);
  const tComment = wt(/^Comment/, 2.43);
  const tGuess = wt(/^guess/, 3.03);
  const hold = (scene.hold as number) ?? 1.3;
  const holdStart = scene.dur - hold;
  const taps = [tComment, tGuess, holdStart, holdStart + hold / 3, holdStart + (2 * hold) / 3];
  let lift = 1;
  for (const tp of taps) {
    const d = t - tp;
    if (d >= -0.12 && d < 0.2) lift = Math.min(lift, d < 0 ? -d / 0.12 : d / 0.2);
  }
  const pencilIn = prog(t, tComment - 0.5, 0.35, Easing.out(Easing.back(1.4)));
  const inHold = t >= holdStart;
  const ringP = inHold ? clamp01((t - holdStart) / hold) : 0;
  const count = Math.max(1, 3 - Math.floor((t - holdStart) / (hold / 3)));
  return (
    <Page>
      <Write p={prog(t, 0, 0.35)} step={step} seed="pq" style={{ left: 150, top: 150, fontFamily: CAVEAT, fontSize: 66, color: NAVY }}>
        pop quiz:
      </Write>
      <svg width={1080} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <InkPath d={smoothPath(jitter([[150, 232], [270, 228], [380, 233]], "pu", step))} p={prog(t, 0.25, 0.3)} color={RED} width={6} />
        <InkPath d={smoothPath(jitter(roughRect(100, 280, 760, 530, 7), "qb", step))} p={prog(t, 0.05, 0.6)} color={NAVY} width={6} />
      </svg>
      <Write p={prog(t, 0.2, 0.35)} step={step} seed="q1" style={{ left: 480, top: 368, translate: "-50% -50%", fontFamily: MARKER, fontSize: 104, color: NAVY, lineHeight: 1 }}>
        $100
      </Write>
      {t > tHits - 0.2 && (
        <div style={{ position: "absolute", left: 455, top: 412, rotate: "90deg", transformOrigin: "0 0", opacity: prog(t, tHits - 0.2, 0.2) }}>
          <ArrowDoodle w={86} h={50} step={step} seed="qa" color={RED} width={8} />
        </div>
      )}
      <Write p={prog(t, tHits - 0.15, 0.35)} step={step} seed="q2" style={{ left: 520, top: 434, fontFamily: CAVEAT, fontSize: 48, color: RED }}>
        +10% every week
      </Write>
      <Highlight x={225} y={550} w={510} h={66} p={prog(t, tMil + 0.3, 0.3)} />
      <Write p={prog(t, tMil - 0.05, 0.45)} step={step} seed="q3" style={{ left: 480, top: 568, translate: "-50% -50%", fontFamily: MARKER, fontSize: 100, color: NAVY, lineHeight: 1 }}>
        $1,000,000
      </Write>
      <Write p={prog(t, wt(/^million/, 1.8) + 0.2, 0.45)} step={step} seed="q4" style={{ left: 480, top: 712, translate: "-50% -50%", fontFamily: MARKER, fontSize: 110, color: RED, lineHeight: 1 }}>
        ___ weeks?
      </Write>
      {pencilIn > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, translate: `${(1 - pencilIn) * -260}px ${-34 * lift + (1 - pencilIn) * -200}px` }}>
          <Pencil x={238} y={744} angle={-28} />
        </div>
      )}
      {inHold && (
        <div style={{ position: "absolute", left: 770, top: 372, translate: "-50% -50%", scale: String(0.9 + 0.1 * Math.sin(ringP * Math.PI * 6) ** 2) }}>
          <svg width={150} height={150} viewBox="0 0 150 150" style={{ overflow: "visible" }}>
            <circle cx={75} cy={75} r={60} fill="#FFFDF6" stroke="rgba(30,42,74,0.2)" strokeWidth={10} />
            <InkPath d={smoothPath(roughEllipse(75, 75, 60, 60, 1, 1.0, 40))} p={ringP} color={RED} width={10} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MARKER, fontSize: 76, color: NAVY }}>{count}</div>
        </div>
      )}
      <Write p={prog(t, tComment + 0.2, 0.5)} step={step} seed="s1" style={{ left: 120, top: 868, fontFamily: CAVEAT, fontSize: 56, color: NAVY, lineHeight: "62px" }}>
        Send this to the friend in
        <br />
        the “trading” group chat.
      </Write>
    </Page>
  );
};

/** Opening hook (frame 0) and the closing frame that loops back into it. */
const Photo: React.FC<VisualProps> = ({ scene, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // outro: count down to the composition's last frame (not the scene end), so the final frame is u = -1/fps and
  // frame 0 (u = 0) follows it seamlessly. The script stretches this scene's "dur" so it also covers the 0.1 s tail.
  const u = scene.visual.mode === "outro" ? (Math.round(scene.start * fps) + frame - timeline.frames) / fps : frame / fps;
  return <PhotoFrame u={u} />;
};

export const visuals: VisualMap = {
  "scam.photo": Photo,
  "scam.notebook": Notebook,
  "scam.real": Real,
  "scam.flag": Flag,
  "scam.quiz": Quiz,
};

