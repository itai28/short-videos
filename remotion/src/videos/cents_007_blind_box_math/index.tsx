import React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { Centy } from "../../shared/Centy";
import { Scene, VisualMap, VisualProps } from "../../types";
import { at, clamp01, useT } from "../../visuals/util";
import { BAL, Burst, C, cubby, KraftBox, Num, Odo, Pill, Room, Shelf, ShelfGeo, Toy, ToyKind } from "./Toys";

// Visuals for cents_007_blind_box_math. Keys are the `visual.kind` values used in scripts/cents_007_blind_box_math.py.

const FPS = 60;
const CX = 475; // centre of the safe stage (x 70..880)

type SpringCfg = { damping?: number; mass?: number; stiffness?: number };
/** Spring that starts at `start` seconds; 0 before (and when start is not a finite number). */
const sp = (t: number, start: number, cfg: SpringCfg = {}) =>
  Number.isFinite(start) && t >= start
    ? spring({ frame: Math.round((t - start) * FPS), fps: FPS, config: { damping: 11, mass: 0.6, ...cfg } })
    : 0;
const ramp = (t: number, a: number, b: number, ease: (x: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
/** When the first caption word matching `re` is spoken (punctuation stripped). */
const wordT = (scene: Scene, re: RegExp, fallback: number) => {
  const w = scene.words.find((x) => re.test(x.w.replace(/[.,?!…:]+$/, "")));
  return w ? w.t : fallback;
};

const Label: React.FC<{ x: number; y: number; size?: number; color?: string; align?: "left" | "center" | "right"; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  y,
  size = 46,
  color = C.ink,
  align = "left",
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: align === "center" ? "-50% -50%" : align === "right" ? "-100% -50%" : "0 -50%",
      fontFamily: BAL,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.05,
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ================================================================== 1 / 2 / 8: the shelf */

const HOOK: ShelfGeo = { x: 100, y: 520, cols: 3, rows: 2, cw: 229, ch: 220, f: 18 };
const FIG_W = 158;

/** Mint tub of grey duplicates. */
const DupesBin: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 290, height: 150 }}>
    {[
      { k: 1 as ToyKind, dx: 12, dy: -18, r: -14 },
      { k: 4 as ToyKind, dx: 150, dy: -24, r: 12 },
      { k: 0 as ToyKind, dx: 84, dy: -40, r: -4 },
      { k: 2 as ToyKind, dx: 196, dy: 0, r: 22 },
    ].map((d, i) => (
      <div key={i} style={{ position: "absolute", left: d.dx, top: d.dy, rotate: `${d.r}deg` }}>
        <Toy kind={d.k} w={84} dupe base={false} />
      </div>
    ))}
    <svg width={290} height={110} viewBox="0 0 290 110" style={{ position: "absolute", left: 0, top: 44, overflow: "visible", filter: "drop-shadow(0 10px 10px rgba(59,42,90,0.25))" }}>
      <path d="M4 8 L286 8 L262 104 Q260 108 254 108 L36 108 Q30 108 28 104 Z" fill={C.mint} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <rect x={0} y={0} width={290} height={20} rx={10} fill="#A8F0DC" stroke={C.ink} strokeWidth={5} />
      <text x={145} y={82} textAnchor="middle" fontFamily={BAL} fontWeight={800} fontSize={48} fill="#fff" stroke={C.ink} strokeWidth={8} paintOrder="stroke fill">
        DUPES
      </text>
    </svg>
  </div>
);

/** "6 boxes?" - the naive guess, which gets stamped. */
const SixBoxes: React.FC<{ x: number; y: number; stamp: number }> = ({ x, y, stamp }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 400, height: 150 }}>
    <Label x={200} y={16} size={52} align="center">
      6 boxes?
    </Label>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{ position: "absolute", left: i * 64, top: 40 }}>
        <KraftBox w={92} />
      </div>
    ))}
    {stamp > 0.01 && (
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 104,
          translate: "-50% -50%",
          scale: String(1 + 0.9 * (1 - stamp)),
          opacity: clamp01(stamp * 3),
          rotate: "-12deg",
          border: `9px solid ${C.red}`,
          borderRadius: 20,
          padding: "0px 26px",
          fontFamily: BAL,
          fontWeight: 800,
          fontSize: 80,
          lineHeight: 1.15,
          color: C.red,
          background: "rgba(255,244,230,0.86)",
          boxShadow: "0 8px 0 rgba(59,42,90,0.2)",
        }}
      >
        NOPE
      </div>
    )}
  </div>
);

/** Shelf of 6 cubbies. Modes: hook (frame 0) | reset (figures out, mystery checklist) | outro (rebuilds into frame 0). */
const ShelfScene: React.FC<VisualProps> = ({ scene, timeline }) => {
  const t = useT();
  const mode = scene.visual.mode as string;
  const hook = mode === "hook";
  const reset = mode === "reset";
  const outro = mode === "outro";
  // idle motion runs on loop phase: the video's last frame is one frame before frame 0 of the hook.
  // Keyed to the composition end (timeline.frames), not scene.dur, because the outro covers the 0.1 s tail too.
  const loopEnd = (timeline.frames - Math.round(scene.start * FPS)) / FPS;
  const tt = outro ? t - loopEnd : t;

  const tNot = hook ? wordT(scene, /^not$/i, 1.2) : Infinity;
  const tAvg = reset ? wordT(scene, /^average$/i, 0.6) : Infinity;
  const tSix = reset ? wordT(scene, /^6$/, 1.2) : Infinity;
  const tMys = reset ? wordT(scene, /^mystery$/i, 1.4) : Infinity;
  const tBec = outro ? wordT(scene, /^because$/i, 1.3) : Infinity;

  // per-figure presence (1 = standing in its cubby) and the faint "mystery" ghost
  const figs = [0, 1, 2, 3, 4].map((i) => {
    if (reset) {
      const q = ramp(t, 0.12 + i * 0.07, 0.42 + i * 0.07, Easing.in(Easing.cubic));
      return { s: 1 - q, dy: -150 * Math.sin(q * Math.PI * 0.6) };
    }
    if (outro) {
      const s = sp(t, tBec + 0.05 + i * 0.1, { damping: 10 });
      return { s, dy: -60 * (1 - clamp01(s)) };
    }
    return { s: 1, dy: 0 };
  });
  const ghost = (i: number) => {
    if (reset) return ramp(t, 0.3 + i * 0.07, 0.55 + i * 0.07);
    if (outro) return i < 5 ? 1 - ramp(t, tBec + 0.05 + i * 0.1, tBec + 0.2 + i * 0.1) : 1 - ramp(t, tBec + 0.5, tBec + 0.7);
    return 0;
  };
  const dark6 = reset ? 1 - ramp(t, 0.4, 0.6) : outro ? ramp(t, tBec + 0.5, tBec + 0.7) : 1;
  const badge = (i: number) => (reset ? sp(t, tSix - 0.05 + i * 0.07, { damping: 9 }) : outro ? 1 - ramp(t, tBec - 0.1, tBec + 0.15) : 0);
  const bottom = reset ? ramp(t, 0.05, 0.4, Easing.in(Easing.cubic)) : outro ? 1 - ramp(t, tBec + 0.2, tBec + 0.75) : 0;
  const centyDown = reset ? ramp(t, 0.0, 0.3) : outro ? 1 - ramp(t, tBec + 0.4, tBec + 0.8) : 0;
  const chip = reset ? sp(t, 0.05, { damping: 13 }) : 0;
  const shift = reset ? 70 * ramp(t, 0.05, 0.4) : 0;
  const card = outro ? clamp01(ramp(t, 0, 0.32) - ramp(t, tBec - 0.12, tBec + 0.18, Easing.in(Easing.cubic))) : 0;
  const counterVal = outro ? 14.7 * ramp(t, tBec, tBec + 0.9, Easing.inOut(Easing.cubic)) : 14.7;
  const counterOn = outro ? ramp(t, tBec - 0.05, tBec + 0.15) : 1;
  const jiggle = hook ? Math.sin(t * 40) * Math.exp(-t * 6) * clamp01(t * 10) * 4 : 0;
  const stamp = sp(t, tNot, { damping: 12, mass: 0.5 });
  const qPulse = 1 + 0.08 * (0.5 - 0.5 * Math.cos((tt / 1.2) * Math.PI * 2));
  const hl = reset ? ramp(t, tAvg - 0.05, tAvg + 0.3) : 0;

  return (
    <AbsoluteFill>
      <Room t={tt} />
      {/* Centy peeks over the right end of the shelf (drawn behind it) */}
      <div style={{ position: "absolute", left: 692, top: 402 + 4 * Math.sin(tt * 2.6) + 150 * centyDown }}>
        <Centy size={168} expr="shocked" look={-0.6} headset={false} />
      </div>
      <Shelf g={HOOK} id="hook" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const b = cubby(HOOK, i);
        const kind = i as ToyKind;
        const bob = 3 * Math.sin(tt * 2.2 + i * 1.3);
        const f = i < 5 ? figs[i] : null;
        return (
          <React.Fragment key={i}>
            {ghost(i) > 0.01 && (
              <div style={{ position: "absolute", left: b.cx - FIG_W / 2, top: b.floor - FIG_W * 1.18, opacity: ghost(i), scale: String(0.7 + 0.3 * ghost(i)) }}>
                <Toy kind={kind} w={FIG_W} style={{ filter: "brightness(0) invert(1) opacity(0.32)" }} />
                <Label x={FIG_W / 2} y={FIG_W * 0.62} size={86} align="center" color="#fff" style={{ WebkitTextStroke: `9px ${C.ink}`, paintOrder: "stroke fill", scale: String(i === 5 ? qPulse : 1) }}>
                  ?
                </Label>
              </div>
            )}
            {f && f.s > 0.01 && (
              <div style={{ position: "absolute", left: b.cx - FIG_W / 2, top: b.floor - FIG_W * 1.18 + f.dy + bob, scale: String(Math.max(0, f.s)), transformOrigin: "50% 100%" }}>
                <Toy kind={kind} w={FIG_W} />
              </div>
            )}
            {i === 5 && dark6 > 0.01 && (
              <div style={{ position: "absolute", left: b.cx - FIG_W / 2, top: b.floor - FIG_W * 1.18, opacity: dark6 }}>
                <Toy kind={5} w={FIG_W} silhouette />
                <Num size={120} style={{ position: "absolute", left: FIG_W / 2, top: FIG_W * 0.6, translate: "-50% -50%", scale: String(qPulse) }}>
                  ?
                </Num>
              </div>
            )}
            {badge(i) > 0.01 && (
              <div
                style={{
                  position: "absolute",
                  left: b.x + 34,
                  top: b.y + 34,
                  translate: "-50% -50%",
                  scale: String(badge(i)),
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: C.gum,
                  border: `5px solid ${C.ink}`,
                  color: "#fff",
                  fontFamily: BAL,
                  fontWeight: 800,
                  fontSize: 44,
                  lineHeight: "60px",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* the counter */}
      <div style={{ position: "absolute", left: 100, top: 160 + shift, opacity: counterOn, rotate: `${jiggle}deg` }}>
        <Odo value={counterVal} decimals={1} size={206} minInt={2} hideLead />
      </div>
      <div style={{ position: "absolute", left: 556, top: 196 + shift, opacity: counterOn }}>
        <div style={{ fontFamily: BAL, fontWeight: 800, fontSize: 104, lineHeight: 1, color: C.ink }}>BOXES</div>
        <div style={{ position: "relative", marginTop: 12, display: "inline-block" }}>
          <div style={{ position: "absolute", left: -10, right: -10, top: 10, bottom: 2, background: C.mint, borderRadius: 12, scale: `${hl} 1`, transformOrigin: "0 50%" }} />
          <div style={{ position: "relative", fontFamily: BAL, fontWeight: 800, fontSize: 50, lineHeight: 1.2, color: C.ink, opacity: 0.85 }}>(on average)</div>
        </div>
      </div>

      {reset && (
        <div style={{ position: "absolute", left: CX, top: 1105, translate: "-50% -50%", display: "flex", alignItems: "center", gap: 18, scale: String(sp(t, tMys - 0.1, { damping: 10 })) }}>
          <KraftBox w={124} />
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 54, color: C.ink, whiteSpace: "nowrap" }}>= 1 random figure</span>
        </div>
      )}
      {chip > 0.01 && (
        <Pill x={CX} y={-60 + 262 * chip} size={42} bg="#fff" color={C.ink}>
          assumes 6 designs · equal odds
        </Pill>
      )}

      {/* bottom row: dupes bin + the naive "6 boxes?" guess */}
      <div style={{ position: "absolute", inset: 0, translate: `0 ${110 * bottom}px`, opacity: clamp01(1 - 1.6 * bottom) }}>
        <DupesBin x={100} y={1032} />
        <SixBoxes x={452} y={1030} stamp={stamp} />
      </div>

      {/* outro prompt card */}
      {card > 0.01 && (
        <div style={{ position: "absolute", left: 110, top: 168, width: 740, height: 260, perspective: 900 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `rotateX(${(1 - card) * 88}deg)`,
              transformOrigin: "50% 0%",
              background: "#FFFDF8",
              border: `6px solid ${C.ink}`,
              borderRadius: 34,
              boxShadow: "0 16px 0 rgba(59,42,90,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 26,
            }}
          >
            <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 92, color: C.ink }}>MY DUPES:</span>
            <span style={{ width: 190, height: 96, borderBottom: `9px solid ${C.gum}` }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== 3: the staircase */

const STEPS = [1, 1.2, 1.5, 2, 3, 6];
const U = 84;
const BASE = 1150;
const colX = (i: number) => 160 + i * 128;
const BAR_W = 100;

const StairsArt: React.FC<{ t: number; scene: Scene }> = ({ t, scene }) => {
  const tLast = wordT(scene, /^last$/i, 1.8);
  const tAlone = wordT(scene, /^alone$/i, 2.4);
  const tSix = wordT(scene, /^6$/, 3.2);
  const starts = [0.1, 0.34, 0.58, 0.82, 1.06, tLast];
  const g = starts.map((s, i) => sp(t, s, i === 5 ? { damping: 8, mass: 0.7, stiffness: 150 } : { damping: 12, mass: 0.6 }));
  const gc = starts.map((s) => ramp(t, s, s + 0.4)); // monotone, so the odometers never tick back down
  const count = STEPS.reduce((a, st, i) => a + st * gc[i], 0);
  const dupes = STEPS.reduce((a, st, i) => a + Math.max(0, st * gc[i] - 1), 0);
  // the video's one punch-in, on the 6 bar
  const punch = t >= tLast ? ramp(t, tLast, tLast + 0.14) * (1 - ramp(t, tSix + 0.35, tSix + 0.75, Easing.inOut(Easing.cubic))) : 0;
  const k = Math.round((t - tLast) * FPS);
  const shake = k >= 0 && k < 3 ? [12, -9, 5][k] : 0;
  const lid = 115 * sp(t, tAlone, { damping: 10, mass: 0.5 });
  const rise = sp(t, tAlone + 0.08, { damping: 9, mass: 0.6 });
  const six = sp(t, tSix - 0.05, { damping: 8 });
  const head = 0.9 + 0.1 * sp(t, 0, { damping: 9 });
  return (
    <AbsoluteFill>
      <Room t={t} />
      <AbsoluteFill style={{ scale: String(1 + 0.06 * punch), transformOrigin: "735px 700px", translate: `${shake}px 0px` }}>
        {/* counters */}
        {[
          { x: 100, label: "BOXES OPENED", v: count, color: C.gold },
          { x: 492, label: "DUPLICATES", v: dupes, color: "#D9D3E6" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: 158,
              width: 360,
              height: 190,
              background: "#FFFDF8",
              border: `5px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: "0 10px 0 rgba(59,42,90,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              scale: String(head),
            }}
          >
            <div style={{ fontFamily: BAL, fontWeight: 800, fontSize: 40, color: C.ink, marginTop: 10, opacity: 0.85 }}>{c.label}</div>
            <div style={{ marginTop: -10 }}>
              <Odo value={c.v} decimals={1} size={112} color={c.color} minInt={2} hideLead />
            </div>
          </div>
        ))}
        <Label x={CX} y={392} size={42} align="center" style={{ opacity: 0.8 * head }}>
          avg boxes to find each <span style={{ color: C.gumDark }}>NEW</span> figure
        </Label>
        {/* base plank */}
        <div style={{ position: "absolute", left: 88, top: BASE, width: 776, height: 30, background: "linear-gradient(#D9CCFF, #A991F5)", border: `4px solid ${C.ink}`, borderRadius: 10 }} />
        {STEPS.map((st, i) => {
          const h = st * U * Math.max(0, g[i]);
          const top = BASE - h;
          const x = colX(i) - BAR_W / 2;
          const fig = i < 5 ? sp(t, starts[i] + 0.12, { damping: 9 }) : 0;
          return (
            <React.Fragment key={i}>
              {h > 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top,
                    width: BAR_W,
                    height: h + 4,
                    background: "linear-gradient(90deg, #FFE27D, #FFCC33 45%, #F0B000)",
                    border: `4px solid ${C.ink}`,
                    borderBottom: "none",
                    borderRadius: "16px 16px 0 0",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: C.goldDark }} />
                  {Array.from({ length: Math.ceil(st) - 1 }).map((_, k2) => (
                    <div key={k2} style={{ position: "absolute", left: 8, right: 8, bottom: (k2 + 1) * U - 2, height: 4, borderRadius: 2, background: "rgba(59,42,90,0.2)" }} />
                  ))}
                  {i < 5 ? (
                    <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center", fontFamily: BAL, fontWeight: 800, fontSize: 50, lineHeight: 1, color: C.ink }}>{st}</div>
                  ) : (
                    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", scale: String(six), opacity: six > 0.01 ? 1 : 0 }}>
                      <div style={{ fontFamily: BAL, fontWeight: 800, fontSize: 168, lineHeight: 1, color: C.ink }}>6</div>
                    </div>
                  )}
                </div>
              )}
              {i < 5 && fig > 0.01 && (
                <div style={{ position: "absolute", left: colX(i) - 52, top: top - 120, scale: String(fig), transformOrigin: "50% 100%" }}>
                  <Toy kind={i as ToyKind} w={104} />
                </div>
              )}
              {i < 5 && <Burst x={colX(i)} y={top - 60} p={ramp(t, starts[i] + 0.1, starts[i] + 0.6, Easing.linear)} r={80} n={8} seed={i + 3} />}
            </React.Fragment>
          );
        })}
        {/* the last figure arrives in its own box on top of the tall bar */}
        {g[5] > 0.01 && (
          <div style={{ position: "absolute", left: colX(5) - 0.4 * 172, top: BASE - 6 * U * g[5] - 0.9 * 215 + 4 }}>
            <KraftBox w={172} lid={lid} figure={5} rise={rise} />
          </div>
        )}
        <Burst x={colX(5)} y={BASE - 6 * U - 150} p={ramp(t, tAlone + 0.05, tAlone + 0.75, Easing.linear)} r={130} n={12} seed={41} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Stairs: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  return <StairsArt t={t} scene={scene} />;
};

/* ================================================================== 4: the equation */

const Equation: React.FC<VisualProps> = ({ scene, timeline, index }) => {
  const t = useT();
  const prev = timeline.scenes[index - 1];
  const wipe = ramp(t, 0, 0.42, Easing.inOut(Easing.cubic));
  const t147 = wordT(scene, /^14\.7$/, 0.9);
  const tCoupon = wordT(scene, /^coupon$/i, 2.3);
  const gap = Math.max(0.07, (t147 - 0.5) / 6);
  const termAt = (i: number) => 0.3 + i * gap;
  const total = sp(t, t147 - 0.04, { damping: 9 });
  const stamp = sp(t, tCoupon - 0.05, { damping: 12, mass: 0.5 });
  const formula = ramp(t, tCoupon + 0.5, tCoupon + 0.9);
  const Term: React.FC<{ i: number }> = ({ i }) => {
    const p = sp(t, termAt(i), { damping: 10 });
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", scale: String(p), rotate: `${(1 - clamp01(p)) * -14}deg`, opacity: p > 0.01 ? 1 : 0 }}>
        <Toy kind={i as ToyKind} w={74} base={false} style={{ translate: `0 ${4 * Math.sin(t * 4.2 + i * 1.1)}px` }} />
        <Num size={112} style={{ marginTop: -4 }}>
          {STEPS[i]}
        </Num>
      </div>
    );
  };
  const Plus: React.FC<{ i: number }> = ({ i }) => (
    <div style={{ fontFamily: BAL, fontWeight: 800, fontSize: 84, color: C.ink, opacity: ramp(t, termAt(i) - 0.05, termAt(i) + 0.05), paddingBottom: 18 }}>+</div>
  );
  return (
    <AbsoluteFill>
      {wipe < 1 && prev ? <StairsArt t={prev.dur} scene={prev} /> : null}
      <AbsoluteFill
        style={{
          WebkitMaskImage: wipe < 1 ? `conic-gradient(from 0deg at 50% 40%, #000 ${wipe * 360}deg, transparent ${wipe * 360}deg)` : undefined,
        }}
      >
        <Room t={t} />
        <div
          style={{
            position: "absolute",
            left: 92,
            top: 172,
            width: 766,
            height: 996,
            background: "#FFFDF8",
            backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 70px, rgba(185,163,255,0.35) 70px, rgba(185,163,255,0.35) 73px)",
            border: `6px solid ${C.ink}`,
            borderRadius: 40,
            boxShadow: "0 18px 0 rgba(59,42,90,0.18), 0 30px 50px rgba(59,42,90,0.18)",
          }}
        >
          <div style={{ position: "absolute", left: 70, top: 0, bottom: 0, width: 4, background: "rgba(255,143,177,0.5)" }} />
        </div>
        <Label x={CX} y={238} size={46} align="center">
          AVERAGE BOXES FOR ALL 6
        </Label>
        <div style={{ position: "absolute", left: 92, width: 766, top: 300, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 18 }}>
          <Term i={0} />
          <Plus i={1} />
          <Term i={1} />
          <Plus i={2} />
          <Term i={2} />
        </div>
        <div style={{ position: "absolute", left: 92, width: 766, top: 530, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 18 }}>
          <Plus i={3} />
          <Term i={3} />
          <Plus i={4} />
          <Term i={4} />
          <Plus i={5} />
          <Term i={5} />
        </div>
        <div style={{ position: "absolute", left: CX, top: 862, translate: "-50% -50%", display: "flex", alignItems: "baseline", gap: 22, scale: String(total), opacity: total > 0.01 ? 1 : 0 }}>
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 150, color: C.ink }}>=</span>
          <Num size={200}>14.7</Num>
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 64, color: C.ink }}>boxes</span>
        </div>
        <Pill x={CX} y={1014} size={44} bg={C.gum} s={1 + 0.6 * (1 - stamp)} rot={-3} style={{ opacity: clamp01(stamp * 3), textShadow: `0 3px 0 ${C.gumDark}` }}>
          COUPON COLLECTOR&apos;S PROBLEM
        </Pill>
        <Label x={CX} y={1108} size={42} align="center" style={{ opacity: 0.75 * formula }}>
          = 6 × (1 + 1/2 + 1/3 + … + 1/6)
        </Label>
      </AbsoluteFill>
      {wipe > 0 && wipe < 1 && (
        <div style={{ position: "absolute", left: 540, top: 768, width: 8, height: 1400, background: C.gold, borderRadius: 4, transformOrigin: "50% 0%", rotate: `${180 + wipe * 360}deg`, translate: "-4px 0", boxShadow: "0 0 18px rgba(255,204,51,0.9)" }} />
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== 5: the price */

const MiniBoxes: React.FC<{ n: number; x: number; y: number; step: number; w: number; t0: number; t: number; gap?: number }> = ({ n, x, y, step, w, t0, t, gap = 0.045 }) => (
  <>
    {Array.from({ length: Math.ceil(n) }).map((_, i) => {
      const part = Math.min(1, n - i);
      const p = sp(t, t0 + i * gap, { damping: 11, mass: 0.6 });
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + i * step,
            top: y - 46 * (1 - clamp01(p)),
            opacity: clamp01(p * 2.5),
            clipPath: part < 1 ? `inset(-40% ${(1 - part) * 100 + 8}% -10% -10%)` : undefined,
          }}
        >
          <KraftBox w={w} />
        </div>
      );
    })}
  </>
);

const PriceArt: React.FC<{ t: number; scene: Scene }> = ({ t, scene }) => {
  const t15 = wordT(scene, /^\$15$/, 1.1);
  const tThats = wordT(scene, /^that's$/i, 2.0);
  const t220 = wordT(scene, /^\$220$/, 2.9);
  const tNot = wordT(scene, /^not$/i, 3.35);
  const t90 = wordT(scene, /^\$90$/, 3.7);
  const drop = sp(t, 0, { damping: 13 });
  const swing = 24 * Math.exp(-2.2 * t) * Math.cos(6.5 * t);
  // the tag hangs big and centred while the price is read, then shrinks up to make room for the two rows
  const shrink = ramp(t, t15 + 0.12, t15 + 0.42, Easing.inOut(Easing.cubic));
  const tagS = 1.6 - 0.6 * shrink;
  const tagY = 150 + 80 * (1 - shrink);
  const rowA = ramp(t, t15 + 0.3, t15 + 0.5);
  const rowB = ramp(t, tThats - 0.05, tThats + 0.15);
  const roll = 90 + 130.5 * ramp(t, tThats, t220 + 0.25, Easing.inOut(Easing.cubic));
  const strike = ramp(t, tNot, tNot + 0.25);
  const chip = sp(t, t90 - 0.05, { damping: 9 });
  return (
    <AbsoluteFill>
      <Room t={t} />
      {/* hanging price tag */}
      <div style={{ position: "absolute", left: CX, top: tagY, rotate: `${swing}deg`, scale: String(tagS), transformOrigin: "0 0", translate: `0 ${-420 * (1 - drop)}px` }}>
        <div style={{ position: "absolute", left: -3, top: 0, width: 6, height: 52, background: C.ink, borderRadius: 3 }} />
        <svg width={320} height={220} viewBox="0 0 320 220" style={{ position: "absolute", left: -160, top: 30, overflow: "visible", filter: "drop-shadow(0 12px 10px rgba(59,42,90,0.28))" }}>
          <path d="M70 6 L250 6 L314 62 L314 202 Q314 214 302 214 L18 214 Q6 214 6 202 L6 62 Z" fill="#FFFDF6" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
          <path d="M76 20 L244 20 L298 68 L298 198 L22 198 L22 68 Z" fill="none" stroke={C.gum} strokeWidth={4} strokeDasharray="12 9" strokeLinejoin="round" />
          <circle cx={160} cy={30} r={11} fill={C.cream} stroke={C.ink} strokeWidth={5} />
        </svg>
        <Num size={112} style={{ position: "absolute", left: 0, top: 134, translate: "-50% -50%" }}>
          $15
        </Num>
        <Label x={0} y={199} size={42} align="center">
          a box
        </Label>
      </div>
      <Label
        x={CX + 250 * shrink}
        y={720 - 428 * shrink}
        size={40}
        align="center"
        color="#6E5F8C"
        style={{ rotate: `${6 * shrink}deg`, textAlign: "center", opacity: clamp01(drop * 1.5) }}
      >
        example
        <br />
        price
      </Label>

      {/* row A: what you'd expect */}
      <div style={{ opacity: rowA * (1 - 0.45 * strike) }}>
        <Label x={100} y={478} size={52}>
          6 boxes
        </Label>
      </div>
      <MiniBoxes n={6} x={92} y={488} step={66} w={86} t0={t15 + 0.3} t={t} />
      <div style={{ position: "absolute", left: 850, top: 540, translate: "-100% -50%", opacity: rowA * (1 - 0.45 * strike) }}>
        <Num size={116}>$90</Num>
        <div style={{ position: "absolute", left: -12, right: -12, top: "50%", height: 14, marginTop: -7, background: C.red, borderRadius: 7, border: `3px solid ${C.ink}`, scale: `${strike} 1`, transformOrigin: "0 50%", rotate: "-8deg" }} />
      </div>

      <div style={{ position: "absolute", left: 100, right: 210, top: 640, borderTop: `5px dashed rgba(59,42,90,0.25)`, opacity: rowB }} />

      {/* row B: the real average */}
      <div style={{ opacity: rowB }}>
        <Label x={100} y={712} size={52}>
          <span style={{ color: C.ink }}>14.7 boxes</span>
          <span style={{ fontSize: 40, opacity: 0.7 }}> (average)</span>
        </Label>
      </div>
      <MiniBoxes n={8} x={92} y={722} step={66} w={86} t0={tThats - 0.05} t={t} gap={0.035} />
      <MiniBoxes n={6.7} x={92} y={776} step={66} w={86} t0={tThats + 0.22} t={t} gap={0.035} />
      <div style={{ position: "absolute", left: 850, top: 960, translate: "-100% -50%", opacity: rowB, display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 96, color: C.ink }}>=</span>
        <Odo value={roll} decimals={2} size={150} prefix="$" minInt={2} />
      </div>
      <Pill x={CX + 160} y={1108} size={56} bg={C.red} s={chip} rot={-4}>
        +$130.50 more
      </Pill>
    </AbsoluteFill>
  );
};

const Price: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  return <PriceArt t={t} scene={scene} />;
};

/* ================================================================== 6: the 1-in-72 secret */

const SPACING = 236;
const BELT_Y = 900;

const Secret: React.FC<VisualProps> = ({ scene, timeline, index }) => {
  const t = useT();
  const prev = timeline.scenes[index - 1];
  const reveal = at(scene, "reveal", 2.2);
  const tBoxes = wordT(scene, /^boxes$/i, reveal + 0.4);
  const tAvg = wordT(scene, /^average$/i, reveal + 1.5);
  const slide = ramp(t, 0, 0.38, Easing.inOut(Easing.cubic));
  const T0 = 0.3;
  const T1 = Math.max(T0 + 0.6, reveal - 0.3);
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const sOf = (tt: number) => 71 * SPACING * ease(clamp01((tt - T0) / (T1 - T0)));
  const s = sOf(t);
  const v = Math.abs(sOf(t + 1 / FPS) - s) * FPS; // px per second
  const idx = Math.min(72, Math.round(s / SPACING) + 1);
  const lid = 118 * sp(t, reveal, { damping: 10, mass: 0.5 });
  const rise = sp(t, reveal + 0.06, { damping: 10, mass: 0.7 });
  const rays = sp(t, reveal, { damping: 20 });
  const ping = sp(t, reveal, { damping: 7 });
  const chip1 = sp(t, tBoxes - 0.1, { damping: 10 });
  const chip2 = sp(t, tAvg - 0.35, { damping: 12 });
  const first = Math.max(1, Math.floor((s - 700) / SPACING));
  const blur = Math.min(16, v / 1100);
  const boxes: number[] = [];
  for (let k = first; k <= Math.min(72, first + 9); k++) boxes.push(k);
  return (
    <AbsoluteFill>
      {slide < 1 && prev ? (
        <AbsoluteFill style={{ translate: `${-1080 * slide}px 0px` }}>
          <PriceArt t={prev.dur} scene={prev} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ translate: `${1080 * (1 - slide)}px 0px` }}>
        <Room t={t} />
        {/* glow rays behind the secret */}
        {rays > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: CX - 420,
              top: 640 - 420,
              width: 840,
              height: 840,
              borderRadius: "50%",
              opacity: 0.9 * clamp01(rays),
              scale: String(0.4 + 0.6 * rays),
              background: `repeating-conic-gradient(from ${t * 30}deg, rgba(255,204,51,0.55) 0deg 10deg, rgba(255,244,230,0) 10deg 22deg)`,
              WebkitMaskImage: "radial-gradient(circle, #000 25%, transparent 70%)",
            }}
          />
        )}
        <Pill x={CX} y={202} size={44} bg="#EDE6FF" color={C.ink}>
          if the odds are 1 in 72
        </Pill>
        <div style={{ position: "absolute", left: CX, top: 352, translate: "-50% -50%", display: "flex", alignItems: "center", gap: 20, scale: String(1 + 0.15 * ping * Math.exp(-(t - reveal) * 3) * (t > reveal ? 1 : 0)) }}>
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 84, color: C.ink }}>BOX #</span>
          <Odo value={idx} size={170} minInt={2} />
        </div>

        {/* conveyor */}
        <div style={{ position: "absolute", left: -40, right: -40, top: BELT_Y, height: 46, background: "#2E2448", borderRadius: 23, border: `5px solid ${C.ink}`, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 18px, transparent 18px, transparent 60px)", backgroundPosition: `${-s % 60}px 0px` }} />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: -20 + i * 124, top: BELT_Y + 40, width: 52, height: 52, borderRadius: 26, background: C.lilac, border: `5px solid ${C.ink}`, rotate: `${(-s / 26) * 57.3}deg` }}>
            <div style={{ position: "absolute", left: 21, top: 2, width: 6, height: 20, background: C.ink, borderRadius: 3 }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 18, top: BELT_Y + 88, width: 26, height: 200, background: "#9C86EC", border: `5px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 930, top: BELT_Y + 88, width: 26, height: 200, background: "#9C86EC", border: `5px solid ${C.ink}` }} />

        {/* the secret rises out of box 72 (drawn behind the box so it emerges from inside) */}
        {rise > 0.01 && (
          <div style={{ position: "absolute", left: CX - 130, top: BELT_Y - 330 - 185 * rise, scale: String(0.5 + 0.5 * rise), transformOrigin: "50% 100%" }}>
            <Toy kind={6} w={260} glow="#FFE27D" base={false} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
          {boxes.map((k) => {
            const x = CX + (k - 1) * SPACING - s;
            if (x < -260 || x > 1340) return null;
            return (
              <div key={k} style={{ position: "absolute", left: x - 0.39 * 200, top: BELT_Y - 0.9 * 250 + 6, scale: blur > 0.5 ? `${1 + blur * 0.02} 1` : undefined }}>
                <KraftBox w={200} lid={k === 72 ? lid : 0} sticker />
              </div>
            );
          })}
        </div>
        {rise > 0.01 && (
          <div style={{ position: "absolute", left: CX - 130, top: BELT_Y - 330 - 185 * rise, scale: String(0.5 + 0.5 * rise), transformOrigin: "50% 100%", opacity: clamp01((rise - 0.35) * 4) }}>
            <Toy kind={6} w={260} glow="#FFE27D" base={false} />
          </div>
        )}
        <Burst x={CX} y={BELT_Y - 260} p={ramp(t, reveal, reveal + 0.8, Easing.linear)} r={200} n={14} seed={72} />

        <div
          style={{
            position: "absolute",
            left: 92,
            top: 998,
            width: 766,
            height: 186,
            background: "#FFFDF8",
            border: `5px solid ${C.ink}`,
            borderRadius: 30,
            boxShadow: "0 10px 0 rgba(59,42,90,0.2)",
            scale: String(chip1),
            opacity: chip1 > 0.01 ? 1 : 0,
          }}
        />
        <div style={{ position: "absolute", left: CX, top: 1062, translate: "-50% -50%", scale: String(chip1), opacity: chip1 > 0.01 ? 1 : 0, display: "flex", alignItems: "center", gap: 18, whiteSpace: "nowrap" }}>
          <Num size={100}>≈ $1,080</Num>
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 46, color: C.ink, lineHeight: 1 }}>at $15 a box</span>
        </div>
        <Label x={CX} y={1140} size={42} align="center" style={{ opacity: chip2, color: "#6E5F8C" }}>
          about half need 50+ boxes to find it
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== 7: trade + buy */

const YOU: ShelfGeo = { x: 105, y: 300, cols: 6, rows: 1, cw: 108, ch: 140, f: 14 };
const FRIEND: ShelfGeo = { x: 105, y: 682, cols: 6, rows: 1, cw: 108, ch: 140, f: 14 };
const TW = 88;

const Trade: React.FC<VisualProps> = ({ scene }) => {
  const t = useT();
  const tTrade = wordT(scene, /^trade$/i, 0.65);
  const tFriend = wordT(scene, /^friend$/i, 1.65);
  const tBuy = wordT(scene, /^buy$/i, 2.3);
  const tSend = wordT(scene, /^Send$/i, 3.55);
  const tBuddy = wordT(scene, /^buddy$/i, tSend + 1.1);
  const head = sp(t, 0, { damping: 10 });
  // keep the share beat alive: the pill pulses on "buddy" and its arrow keeps nudging
  const pulse = t > tBuddy - 0.05 ? Math.sin(clamp01((t - tBuddy + 0.05) / 0.4) * Math.PI) : 0;
  const nudge = t > tSend ? 10 * Math.max(0, Math.sin((t - tSend) * 8)) : 0;
  const sendP = sp(t, tSend - 0.1, { damping: 12 });
  const arrows = sp(t, tTrade - 0.1, { damping: 12 });
  const done = sp(t, tFriend, { damping: 9 });
  const card = sp(t, tBuy - 0.12, { damping: 14, mass: 0.7 });
  const stamp = sp(t, tBuy + 0.45, { damping: 12, mass: 0.5 });
  const youHas: ToyKind[] = [0, 1, 2, 4];
  const friendHas: ToyKind[] = [1, 3, 4, 5];
  // dupes: [kind, from shelf, tray slot]
  const flights = [
    { k: 0 as ToyKind, from: YOU, to: FRIEND, slot: 0, j: 0 },
    { k: 2 as ToyKind, from: YOU, to: FRIEND, slot: 1, j: 1 },
    { k: 3 as ToyKind, from: FRIEND, to: YOU, slot: 0, j: 2 },
    { k: 5 as ToyKind, from: FRIEND, to: YOU, slot: 1, j: 3 },
  ];
  const trayPos = (g: ShelfGeo, slot: number) => ({ x: g.x + 30 + slot * 100, y: g.y + 168 + 6 });
  const Fig: React.FC<{ g: ShelfGeo; i: number; k: ToyKind }> = ({ g, i, k }) => {
    const b = cubby(g, i);
    return (
      <div style={{ position: "absolute", left: b.cx - TW / 2, top: b.floor - TW * 1.18 + 4 }}>
        <Toy kind={k} w={TW} />
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Room t={t} />
      {/* header: CHEAT CODE, then the share line */}
      <div style={{ position: "absolute", left: CX, top: 200, translate: "-50% -50%", perspective: 800, scale: String(1 + 0.14 * pulse) }}>
        <div style={{ transform: `rotateX(${sendP * 180}deg)`, transformStyle: "preserve-3d", position: "relative" }}>
          <Pill x={0} y={0} size={60} bg={C.gum} s={head} style={{ backfaceVisibility: "hidden", textShadow: `0 4px 0 ${C.gumDark}` }}>
            CHEAT CODE
          </Pill>
          <Pill x={0} y={0} size={46} bg={C.mint} color={C.ink} style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
            send to your trading buddy <span style={{ display: "inline-block", translate: `${nudge}px 0px` }}>➜</span>
          </Pill>
        </div>
      </div>

      <Shelf g={YOU} id="you" />
      <Shelf g={FRIEND} id="fr" />
      <Pill x={170} y={282} size={40} bg={C.lilac} color={C.ink}>
        YOU
      </Pill>
      <Pill x={196} y={FRIEND.y - 18} size={40} bg={C.lilac} color={C.ink}>
        FRIEND
      </Pill>
      {youHas.map((k) => (
        <Fig key={`y${k}`} g={YOU} i={k} k={k} />
      ))}
      {friendHas.map((k) => (
        <Fig key={`f${k}`} g={FRIEND} i={k} k={k} />
      ))}
      {/* empty-slot question marks until the trade fills them */}
      {[
        { g: YOU, i: 3, f: 2 },
        { g: YOU, i: 5, f: 3 },
        { g: FRIEND, i: 0, f: 0 },
        { g: FRIEND, i: 2, f: 1 },
      ].map(({ g, i, f }) => {
        const b = cubby(g, i);
        const land = ramp(t, tTrade + f * 0.12 + 0.45, tTrade + f * 0.12 + 0.55);
        return (
          <Label key={`${g.y}${i}`} x={b.cx} y={b.y + b.h / 2} size={80} align="center" color="rgba(255,255,255,0.7)" style={{ opacity: 1 - land }}>
            ?
          </Label>
        );
      })}
      {/* trays */}
      {[YOU, FRIEND].map((g) => (
        <div
          key={g.y}
          style={{
            position: "absolute",
            left: g.x + 6,
            top: g.y + 272,
            width: 240,
            height: 48,
            opacity: 1 - 0.5 * ramp(t, tTrade + 0.9, tTrade + 1.2),
            background: "linear-gradient(#E4DAFF, #C2AFFF)",
            border: `4px solid ${C.ink}`,
            borderRadius: 14,
            boxShadow: "0 8px 0 rgba(59,42,90,0.18)",
            fontFamily: BAL,
            fontWeight: 800,
            fontSize: 40,
            lineHeight: "44px",
            textAlign: "center",
            color: C.ink,
            letterSpacing: 2,
          }}
        >
          DUPES
        </div>
      ))}
      {flights.map((f) => {
        const p = ramp(t, tTrade + f.j * 0.12, tTrade + f.j * 0.12 + 0.55, Easing.inOut(Easing.cubic));
        const a = trayPos(f.from, f.slot);
        const dest = cubby(f.to, f.k);
        const b = { x: dest.cx - TW / 2, y: dest.floor - TW * 1.18 + 4 };
        const ctrl = { x: (a.x + b.x) / 2 + (f.from === YOU ? 260 : -40), y: (a.y + b.y) / 2 + (f.from === YOU ? -40 : 40) };
        const x = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * ctrl.x + p * p * b.x;
        const y = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * ctrl.y + p * p * b.y;
        return (
          <div key={f.j} style={{ position: "absolute", left: x, top: y, rotate: `${Math.sin(p * Math.PI) * (f.from === YOU ? 25 : -25)}deg` }}>
            <Toy kind={f.k} w={TW} dupe={p < 0.92} />
          </div>
        );
      })}
      {/* Centy holding the trade arrows */}
      <div style={{ position: "absolute", left: 470, top: 482, width: 170, height: 170, scale: String(arrows * 1.3), opacity: arrows > 0.01 ? 1 : 0 }}>
        <svg width={170} height={170} viewBox="0 0 170 170" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d="M40 30 Q-6 85 40 140" stroke={C.gum} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M22 122 L42 146 L58 118" stroke={C.gum} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M130 140 Q176 85 130 30" stroke={C.mintDark} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M148 48 L128 24 L112 52" stroke={C.mintDark} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", left: 30, top: 28 + 4 * Math.sin(t * 5) }}>
          <Centy size={112} expr="hype" headset={false} />
        </div>
      </div>
      {[YOU, FRIEND].map((g, i) => (
        <Pill key={i} x={770} y={g.y - 18} size={40} bg={C.mint} color={C.ink} s={done}>
          SET ✓
        </Pill>
      ))}
      {/* the payoff */}
      <div style={{ position: "absolute", left: CX, top: 1094, translate: "-50% -50%", scale: String(done), opacity: done > 0.01 ? 1 : 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, whiteSpace: "nowrap" }}>
          <Num size={104}>≈ 12.1</Num>
          <span style={{ fontFamily: BAL, fontWeight: 800, fontSize: 52, color: C.ink }}>boxes each</span>
        </div>
        <div style={{ fontFamily: BAL, fontWeight: 800, fontSize: 42, color: "#6E5F8C", marginTop: -4, whiteSpace: "nowrap" }}>
          trading dupes · vs <span style={{ color: C.goldDark }}>14.7</span> solo
        </div>
      </div>

      {/* or: just buy the one you want */}
      {card > 0.01 && <div style={{ position: "absolute", left: 0, right: 0, top: 236, height: 762, background: C.cream, opacity: 0.8 * clamp01(card) }} />}
      {card > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 130,
            top: 268,
            width: 690,
            height: 716,
            translate: `${(1 - card) * 900}px 0px`,
            rotate: `${(1 - card) * 8}deg`,
            background: "#FFFDF8",
            border: `6px solid ${C.ink}`,
            borderRadius: 40,
            boxShadow: "0 18px 0 rgba(59,42,90,0.2), 0 30px 60px rgba(59,42,90,0.25)",
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 34, textAlign: "center", fontFamily: BAL, fontWeight: 800, fontSize: 54, lineHeight: 1.05, color: C.ink }}>
            OR JUST BUY
            <br />
            THE ONE YOU WANT
          </div>
          <div style={{ position: "absolute", left: 345 - 130, top: 196 + 5 * Math.sin(t * 3) }}>
            <Toy kind={5} w={260} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 345,
              top: 610,
              translate: "-50% -50%",
              scale: String(1 + 0.8 * (1 - stamp)),
              opacity: clamp01(stamp * 3),
              rotate: "-5deg",
              border: `8px solid ${C.mintDark}`,
              borderRadius: 18,
              padding: "0 26px",
              fontFamily: BAL,
              fontWeight: 800,
              fontSize: 66,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: C.mintDark,
              background: "rgba(255,253,248,0.9)",
            }}
          >
            NO GAMBLE
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const visuals: VisualMap = {
  "box.shelf": ShelfScene,
  "box.stairs": Stairs,
  "box.equation": Equation,
  "box.price": Price,
  "box.secret": Secret,
  "box.trade": Trade,
};

