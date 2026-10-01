import React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { BUNGEE } from "../../fonts";
import { Scene, VisualMap, VisualProps } from "../../types";
import { at, clamp01, popIn } from "../../visuals/util";
import { useMouth } from "../../shared/Centy";
import { ArcadeBG, AssumeTab, Badge, CRT, Dissolve, Gems, Panel, PauseGlyph, PText, RollNum, Sticker, useClock } from "./arcade";
import {
  C,
  CROWN,
  CROWN_PAL,
  GemIcon,
  GemPile,
  HOODIE,
  HOODIE_PAL,
  LOCK,
  LOCK_PAL,
  mod,
  PixelCenty,
  Sprite,
  TROPHY,
  TROPHY_PAL,
  VAULT,
  VAULT_PAL,
} from "./sprites";

// ---------- shop data (all numbers checked in scripts/cents_010_gem_gap.py) ----------

const PACKS = [
  { k: "A", gems: "500", price: "$4.99", rate: "$9.98" },
  { k: "B", gems: "1,100", price: "$9.99", rate: "$9.08" },
  { k: "C", gems: "2,400", price: "$19.99", rate: "$8.33" },
  { k: "D", gems: "6,500", price: "$49.99", rate: "$7.69" },
];
const TW = 385;
const TH = 290;
const TILE: [number, number][] = [
  [70, 568],
  [475, 568],
  [70, 878],
  [475, 878],
];
const SEL_ORDER = [0, 1, 3, 2]; // A, B, D, C: clockwise
/** Selector moves every 20 frames (3 Hz); frames -10..9 around the loop point sit on B. */
const selectorAt = (F: number) => SEL_ORDER[mod(1 + Math.floor((F + 10) / 20), 4)];

const wordT = (scene: Scene, re: RegExp, fallback: number) => scene.words.find((w) => re.test(w.w))?.t ?? fallback;
const clampI = (t: number, a: number, b: number, from: number, to: number, ease = true) =>
  interpolate(t, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease ? Easing.out(Easing.cubic) : undefined,
  });
const sp = (frame: number, atSec: number, fps: number, damping = 12, stiffness = 170) =>
  Number.isFinite(atSec) ? spring({ frame: frame - Math.round(atSec * fps), fps, config: { damping, stiffness } }) : 0;
/** Deterministic 3-frame shake starting at frame f0. */
const shake = (frame: number, f0: number, amp = 10): [number, number] => {
  const k = frame - f0;
  if (k === 0) return [-amp, amp * 0.5];
  if (k === 1) return [amp * 0.8, -amp * 0.7];
  if (k === 2) return [-amp * 0.4, amp * 0.3];
  return [0, 0];
};
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Shared frame: arcade backdrop, content, scanlines, pixel dissolve in/out. */
const Stage: React.FC<{ scene: Scene; props: VisualProps; loop?: boolean; children: React.ReactNode }> = ({ scene, props, loop, children }) => {
  const { frame, durF, loopT } = useClock(scene, props.timeline, loop);
  const prev = props.timeline.scenes[props.index - 1];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <ArcadeBG T={loopT} />
      {children}
      <CRT />
      <Dissolve enter={!!prev?.visual.out} exit={!!scene.visual.out} frame={frame} durF={durF} />
    </AbsoluteFill>
  );
};

// ---------- shop (hook, guess, paused, outro) ----------

const Tile: React.FC<{
  i: number;
  T: number;
  rateP?: number;
  best?: number;
  red?: number;
  pulse?: number;
  dim?: number;
  sticker?: number;
}> = ({ i, T, rateP = 0, best = 0, red = 0, pulse = 1, dim = 0, sticker = 1 }) => {
  const [x, y] = TILE[i];
  const p = PACKS[i];
  const pileW = [96, 144, 192, 240][i];
  const pileH = [60, 84, 108, 132][i];
  const pileX = i === 3 ? 18 : (TW - pileW) / 2;
  return (
    <Panel x={x} y={y} w={TW} h={TH} border={best > 0.5 ? C.green : C.edge} fill={C.panel} glow={best > 0.5 ? "rgba(108,255,108,0.45)" : undefined} style={{ opacity: 1 - dim }}>
      <Badge letter={p.k} size={56} style={{ position: "absolute", left: 18, top: 18 }} />
      <div style={{ position: "absolute", right: 18, top: 23 }}>
        <Gems n={p.gems} size={48} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 212, width: TW - 40, height: 6, background: "#2A2A58" }} />
      <div style={{ position: "absolute", left: pileX - 8, top: 206, width: pileW + 16, height: 10, background: "rgba(46,242,255,0.18)", filter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: pileX, top: 212 - pileH, opacity: 1 - 0.75 * clamp01(rateP * 2) }}>
        <GemPile pack={i} px={4} t={T + i * 0.37} />
      </div>
      {i === 3 && sticker > 0 ? (
        <div style={{ position: "absolute", left: 214, top: 90, rotate: "8deg", scale: String(sticker), opacity: sticker }}>
          <div
            style={{
              fontFamily: BUNGEE,
              fontSize: 40,
              lineHeight: 1.0,
              color: C.ink,
              background: C.gold,
              padding: "10px 12px 6px",
              textAlign: "center",
              boxShadow: `0 6px 0 ${C.ink}, 0 0 22px rgba(255,204,51,0.5)`,
            }}
          >
            BEST
            <br />
            VALUE
          </div>
        </div>
      ) : null}
      {rateP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 96,
            width: TW - 52,
            height: 100,
            background: "rgba(11,11,18,0.92)",
            border: `5px solid ${best > 0.5 ? C.green : "#8A8AD0"}`,
            boxShadow: best > 0.5 ? "0 0 26px rgba(108,255,108,0.6)" : "0 6px 0 rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(popIn(rateP, 0, 0.35)),
          }}
        >
          <RollNum text={p.rate} size={58} p={rateP} color={best > 0.5 ? C.green : C.white} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 12, top: 224, width: TW - 24, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PText size={52} color={red > 0.5 ? C.red : C.gold} glow={red > 0.5 ? "rgba(255,65,54,0.9)" : undefined} style={{ scale: String(pulse), marginLeft: 6 }}>
          {p.price}
        </PText>
      </div>
    </Panel>
  );
};

const Selector: React.FC<{ i: number; color?: string }> = ({ i, color = C.white }) => {
  const [x, y] = TILE[i];
  return (
    <div
      style={{
        position: "absolute",
        left: x - 13,
        top: y - 13,
        width: TW + 26,
        height: TH + 26,
        border: `6px solid ${color}`,
        boxShadow: `0 0 18px rgba(46,242,255,0.55), inset 0 0 0 3px ${C.ink}`,
      }}
    />
  );
};

const TimerBar: React.FC<{ lit: number; flash?: boolean }> = ({ lit, flash }) => {
  const n = 20;
  const segW = (790 - 16 - (n - 1) * 4) / n;
  return (
    <div style={{ position: "absolute", left: 70, top: 1194, width: 790, height: 38, background: C.ink, border: `4px solid ${flash ? C.green : "#3B3B7A"}`, boxShadow: "0 6px 0 rgba(0,0,0,0.5)" }}>
      {Array.from({ length: n }).map((_, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: 4 + k * (segW + 4),
            top: 4,
            width: segW,
            height: 22,
            background: k < lit ? (lit <= 6 ? C.magenta : C.cyan) : "#1C1C38",
            boxShadow: k < lit ? "inset 0 -5px 0 rgba(0,0,0,0.25), inset 0 4px 0 rgba(255,255,255,0.35)" : undefined,
          }}
        />
      ))}
    </div>
  );
};

const Hoodie: React.FC<{ px: number; T: number }> = ({ px, T }) => {
  const bob = mod(Math.floor(T * 2 + 0.5), 2) * Math.round(px / 2); // toggles mid-cycle, never at the loop point
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 2 * px, top: 16 * px + px, width: 12 * px, height: 2 * px, background: "rgba(46,242,255,0.45)", filter: `blur(${px}px)` }} />
      <div style={{ translate: `0 ${-bob}px`, filter: `drop-shadow(0 ${px}px 0 ${C.ink})` }}>
        <Sprite map={HOODIE} pal={HOODIE_PAL} px={px} />
      </div>
    </div>
  );
};

const Shop: React.FC<VisualProps> = (props) => {
  const { scene, timeline } = props;
  const mode = scene.visual.mode as "hook" | "guess" | "paused" | "outro";
  const { frame, fps, t, loopF, loopT } = useClock(scene, timeline, mode === "outro");
  const hold = (scene.hold as number) ?? 0;
  const holdStart = scene.dur - hold;

  // timer
  const goT = mode === "guess" ? wordT(scene, /^Go/, holdStart - 0.4) : Infinity;
  let lit = 20;
  if (mode === "guess" && t >= goT) lit = Math.ceil(20 * clamp01((scene.dur - t) / Math.max(0.1, scene.dur - goT)));
  if (mode === "paused") lit = 0;
  const count = mode === "guess" && t >= holdStart ? Math.max(1, Math.ceil(3 * clamp01((scene.dur - t) / Math.max(0.1, hold)))) : 0;

  // 1,200 pulse on "1,200"
  const tPrice = mode === "guess" ? wordT(scene, /1,200/, 1.1) : Infinity;
  const pricePulse = sp(frame, tPrice - 0.05, fps, 8, 220);
  const priceScale = 1 + 0.14 * pricePulse * Math.max(0, 1 - (t - tPrice) / 1.2);

  // paused beat
  const R = mode === "paused" ? at(scene, "reveal", 0.5) : Infinity;
  const slam = mode === "paused" ? sp(frame, 0, fps, 13, 260) : 0;
  const tuck = mode === "paused" ? sp(frame, R + 0.1, fps, 16, 140) : 0;
  const tBest = mode === "paused" ? wordT(scene, /^best/, 1.3) : Infinity;
  const tRed = mode === "paused" ? wordT(scene, /^almost/, 3.3) - 0.05 : Infinity;
  const crown = sp(frame, tBest - 0.1, fps, 9, 160);
  const isBest = t >= tBest - 0.1 ? 1 : 0;
  const redOn = t >= tRed ? 1 : 0;
  const pulse = t >= tRed && t < tRed + 1 ? 1 + 0.14 * Math.max(0, Math.sin(2 * Math.PI * 2 * (t - tRed))) : 1;

  // selector
  const startF = Math.round(scene.start * fps); // absolute frame of the scene start
  let sel = selectorAt(loopF);
  if (mode === "paused") sel = t >= tBest - 0.1 ? 3 : selectorAt(startF);

  const T = loopT;
  const paused = mode === "paused" && t >= R;
  const [shx, shy] = mode === "paused" ? shake(frame, 9, 12) : [0, 0];

  return (
    <Stage scene={scene} props={props} loop={mode === "outro"}>
      <AssumeTab />
      {/* item card */}
      <Panel x={70} y={240} w={790} h={305} border={C.magenta} fill={C.night} glow="rgba(255,46,136,0.35)">
        <div style={{ position: "absolute", left: 30, top: 40 }}>
          <Hoodie px={12} T={T} />
        </div>
        {!paused ? (
          <>
            <PText size={40} color="#D8D8FF" style={{ position: "absolute", left: 244, top: 46 }}>
              SKIN COSTS
            </PText>
            <div style={{ position: "absolute", left: 244, top: 104, scale: String(priceScale), transformOrigin: "left center" }}>
              <Gems n="1,200" size={90} glow={pricePulse > 0.05 && t < tPrice + 1.2 ? "rgba(46,242,255,0.9)" : "rgba(46,242,255,0.35)"} />
            </div>
            <PText
              size={40}
              color={mod(Math.floor(T * 1.5 + 0.5), 2) === 0 ? C.magenta : "#FF7FB6"}
              style={{ position: "absolute", left: 244, top: 228 }}
            >
              CHEAPEST WAY?
            </PText>
          </>
        ) : (
          <>
            <PText size={52} color={C.white} style={{ position: "absolute", left: 244, top: 52 }}>
              COST PER
            </PText>
            <PText size={52} color={C.cyan} glow="rgba(46,242,255,0.5)" style={{ position: "absolute", left: 244, top: 132 }}>
              1,000 GEMS
            </PText>
            <PText size={40} color="#D8D8FF" style={{ position: "absolute", left: 244, top: 222 }}>
              EACH PACK ↓
            </PText>
          </>
        )}
        {count > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 682,
              top: 18,
              width: 84,
              height: 84,
              background: C.ink,
              border: `5px solid ${C.green}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(108,255,108,0.6)",
            }}
          >
            <PText size={52} color={C.green} style={{ marginLeft: 6 }}>
              {count}
            </PText>
          </div>
        ) : null}
      </Panel>

      {/* pack grid */}
      {PACKS.map((_, i) => {
        const rateP = paused ? clamp01((t - (R + 0.12 + i * 0.12)) / 0.55) : 0;
        return (
          <Tile
            key={i}
            i={i}
            T={T}
            rateP={rateP}
            best={i === 3 ? isBest : 0}
            red={i === 3 ? redOn : 0}
            pulse={i === 3 ? pulse : 1}
            dim={mode === "paused" && i !== 3 && t >= tRed ? 0.45 : 0}
            sticker={i === 3 ? (paused ? 1 - clamp01((t - R) / 0.15) : 1) : 0}
          />
        );
      })}
      <Selector i={sel} color={mode === "paused" && isBest ? C.green : C.white} />

      {/* crown on D */}
      {mode === "paused" && crown > 0.001 ? (
        <div style={{ position: "absolute", left: TILE[3][0] + 18 + 28 - 33, top: interpolate(crown, [0, 1], [700, 850]), opacity: clamp01(crown * 4), rotate: "-8deg" }}>
          <div style={{ filter: "drop-shadow(0 5px 0 #0B0B12) drop-shadow(0 0 16px rgba(255,204,51,0.7))" }}>
            <Sprite map={CROWN} pal={CROWN_PAL} px={6} />
          </div>
        </div>
      ) : null}

      <TimerBar lit={lit} flash={mode === "guess" && t >= goT && t < goT + 0.33} />

      {/* PAUSE slam, then tuck into the corner */}
      {mode === "paused" ? (
        <>
          <AbsoluteFill style={{ background: C.ink, opacity: 0.74 * (1 - tuck) * clamp01(frame / 2) }} />
          <div
            style={{
              position: "absolute",
              left: interpolate(tuck, [0, 1], [465, 106]) + shx,
              top: interpolate(tuck, [0, 1], [740, 196]) + shy,
              translate: "-50% -50%",
              scale: String(interpolate(tuck, [0, 1], [2 - slam, 0.22])),
            }}
          >
            <PauseGlyph h={260} />
          </div>
          <PText
            size={64}
            color={C.magenta}
            style={{ position: "absolute", left: 465, top: 920, translate: "-50% 0", opacity: 1 - clamp01(tuck * 3), scale: String(slam) }}
          >
            PAUSED
          </PText>
        </>
      ) : null}
    </Stage>
  );
};

// ---------- bars: B is 100 short, C overshoots ----------

const X0 = 100;
const XW = 740;

const BarRow: React.FC<{
  y: number;
  letter: string;
  price: string;
  priceSize: number;
  priceScale?: number;
  v: number;
  axis: number;
  gap?: number;
  ghost?: boolean;
  dim?: number;
  shakeX?: number;
  countSize?: number;
}> = ({ y, letter, price, priceSize, priceScale = 1, v, axis, gap = 0, ghost, dim = 0, shakeX = 0, countSize = 90 }) => {
  const X = (g: number) => X0 + (g / axis) * XW;
  const barY = y + 95;
  const H = 130;
  const fillEnd = X(Math.min(v, 1200));
  const over = v > 1200 ? X(v) - X(1200) : 0;
  return (
    <div style={{ position: "absolute", left: shakeX, top: 0, width: 1080, height: 1920, opacity: 1 - dim }}>
      <Badge letter={letter} size={64} color={ghost ? "#3B3B7A" : C.magenta} style={{ position: "absolute", left: 90, top: y + 6 }} />
      {ghost ? (
        <PText size={64} color="#5A5A9A" style={{ position: "absolute", left: 180, top: y + 6 }}>
          ?
        </PText>
      ) : (
        <PText size={priceSize} color={C.gold} glow={priceScale > 1.02 ? "rgba(255,204,51,0.8)" : undefined} style={{ position: "absolute", left: 180, top: y + 6 + (64 - priceSize) / 2, scale: String(priceScale), transformOrigin: "left center" }}>
          {price}
        </PText>
      )}
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: X0 - 8,
          top: barY - 8,
          width: XW + 16,
          height: H + 16,
          background: ghost ? "transparent" : "#0E0E22",
          border: ghost ? "5px dashed #3B3B7A" : "5px solid #3B3B7A",
          boxShadow: ghost ? undefined : "0 8px 0 rgba(0,0,0,0.5)",
        }}
      />
      {!ghost && v > 0 ? (
        <div style={{ position: "absolute", left: X0, top: barY, width: fillEnd - X0, height: H, background: C.cyan, boxShadow: "inset 0 14px 0 rgba(255,255,255,0.45), inset 0 -16px 0 rgba(0,0,0,0.22), 0 0 24px rgba(46,242,255,0.4)" }} />
      ) : null}
      {over > 0 ? (
        <div
          style={{
            position: "absolute",
            left: X(1200),
            top: barY,
            width: over,
            height: H,
            background: `repeating-linear-gradient(135deg, ${C.red} 0 18px, ${C.redDk} 18px 36px)`,
            boxShadow: "inset 0 14px 0 rgba(255,255,255,0.3), 0 0 30px rgba(255,65,54,0.75)",
          }}
        />
      ) : null}
      {gap > 0 ? (
        <div
          style={{
            position: "absolute",
            left: X(Math.min(v, 1200)),
            top: barY - 6,
            width: X(1200) - X(Math.min(v, 1200)),
            height: H + 12,
            border: `5px solid ${C.red}`,
            background: `repeating-linear-gradient(135deg, rgba(255,65,54,0.55) 0 10px, rgba(255,65,54,0.12) 10px 20px)`,
            boxShadow: "0 0 26px rgba(255,65,54,0.8)",
            opacity: gap,
          }}
        />
      ) : null}
      {/* goal marker across the bar */}
      <div style={{ position: "absolute", left: X(1200) - 4, top: barY - 16, width: 8, height: H + 32, background: ghost ? "rgba(255,255,255,0.35)" : C.white, boxShadow: `0 0 0 3px ${C.ink}, 0 0 14px rgba(255,255,255,0.6)` }} />
      {!ghost && v > 0 ? (
        <div style={{ position: "absolute", left: X0 + 16, top: barY + (H - countSize) / 2 + 2, filter: `drop-shadow(3px 0 0 ${C.ink}) drop-shadow(-3px 0 0 ${C.ink}) drop-shadow(0 -3px 0 ${C.ink})` }}>
          <Gems n={fmt(Math.round(v / 50) * 50)} size={countSize} color={C.white} />
        </div>
      ) : null}
    </div>
  );
};

const Bars: React.FC<VisualProps> = (props) => {
  const { scene, timeline } = props;
  const mode = scene.visual.mode as "b" | "c";
  const { frame, fps, t, loopT } = useClock(scene, timeline);
  const isC = mode === "c";

  const tB = isC ? -10 : wordT(scene, /^B\?/, 0.45);
  const vB = isC ? 1100 : clampI(t, tB - 0.05, tB + 1.0, 0, 1100);
  const t100 = isC ? -10 : wordT(scene, /^100$/, 2.45) - 0.08;
  const gapIn = isC ? 1 : popIn(t, t100, 0.25);
  const tShort = isC ? Infinity : wordT(scene, /^short/, 2.85);
  const shakeB = isC ? 0 : shake(frame, Math.round(tShort * fps), 12)[0];

  const tW = isC ? wordT(scene, /^works/, 0.5) : Infinity;
  const vC = isC ? clampI(t, tW - 0.1, tW + 0.75, 0, 2400) : 0;
  const axis = isC ? clampI(t, tW + 0.05, tW + 0.8, 1400, 2600) : 1400;
  const tPrice = isC ? wordT(scene, /19\.99/, 1.47) : Infinity;
  const pPulse = sp(frame, tPrice - 0.05, fps, 8, 220);
  const priceScale = 1 + 0.18 * pPulse * Math.max(0, 1 - (t - tPrice) / 1.0);
  const overIn = isC ? popIn(t, tW + 0.7, 0.3) : 0;
  const worksIn = isC ? popIn(t, tW + 0.25, 0.3) : 0;
  // C's row stays where scene B left it (ghost) and lights up on the word "C".
  const tC = isC ? wordT(scene, /^C$/, 0.35) - 0.06 : Infinity;
  const cLive = isC && t >= tC;
  const cPop = isC ? popIn(t, tC, 0.25) : 0;

  const X = (g: number) => X0 + (g / axis) * XW;
  const goalX = X(1200);
  const zoomK = (axis - 1400) / 1200; // 0 in scene B, 1 once C has zoomed the axis out
  const minusRight = goalX - 22;
  const minusScale = 1 - 0.4 * zoomK;

  return (
    <Stage scene={scene} props={props}>
      {/* goal header */}
      <div style={{ position: "absolute", left: 92, top: 194 }}>
        <Hoodie px={7} T={loopT} />
      </div>
      <PText size={40} color="#D8D8FF" style={{ position: "absolute", left: 228, top: 196 }}>
        THE SKIN
      </PText>
      <div style={{ position: "absolute", left: 228, top: 250 }}>
        <Gems n="1,200" size={72} />
      </div>

      {/* goal line */}
      <div style={{ position: "absolute", left: goalX - 3, top: 404, width: 6, height: 96, background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.45) 0 14px, transparent 14px 26px)" }} />
      <div style={{ position: "absolute", left: goalX, top: 352, translate: "-50% 0", background: C.white, padding: "8px 12px 6px", boxShadow: `0 6px 0 ${C.ink}` }}>
        <PText size={40} color={C.ink} shadow="transparent" style={{ marginLeft: 4 }}>
          GOAL
        </PText>
      </div>

      <BarRow y={420} letter="B" price="$9.99" priceSize={64} v={vB} axis={axis} gap={gapIn} dim={isC ? 0.45 : 0} shakeX={shakeB} countSize={zoomK > 0 ? Math.round(90 - 30 * zoomK) : 90} />
      {gapIn > 0 ? (
        <div style={{ position: "absolute", left: minusRight, top: 668, translate: "-100% 0", scale: String(gapIn * minusScale), transformOrigin: "right top", opacity: isC ? 0.55 : 1 }}>
          <Gems n="-100" size={90} color={C.red} glow="rgba(255,65,54,0.8)" />
        </div>
      ) : null}

      <BarRow y={790} letter="C" price="$19.99" priceSize={72} priceScale={priceScale * (cLive ? cPop : 1)} v={vC} axis={axis} ghost={!cLive} countSize={60} />
      {isC ? (
        <>
          <PText size={40} color={C.green} glow="rgba(108,255,108,0.6)" style={{ position: "absolute", left: 100, top: 1046, scale: String(worksIn), transformOrigin: "left center" }}>
            WORKS!
          </PText>
          <div style={{ position: "absolute", left: 840, top: 1034, translate: "-100% 0", scale: String(overIn), transformOrigin: "right top" }}>
            <Gems n="+1,200" size={64} color={C.red} glow="rgba(255,65,54,0.8)" />
          </div>
          <PText size={40} color={C.red} style={{ position: "absolute", left: 840, top: 1118, translate: "-100% 0", opacity: overIn > 0.5 ? 1 : 0 }}>
            LEFT OVER
          </PText>
        </>
      ) : null}
    </Stage>
  );
};

// ---------- answer: arcade leaderboard ----------

const RUNNERS = [
  { combo: "A+B", price: "$14.98", left: "+400" },
  { combo: "C", price: "$19.99", left: "+1,200" },
  { combo: "D", price: "$49.99", left: "+5,300", red: true },
];

const Answer: React.FC<VisualProps> = (props) => {
  const { scene, timeline } = props;
  const { frame, fps, t, loopT } = useClock(scene, timeline);
  const R = at(scene, "reveal", 0.5);
  const hero = sp(frame, R, fps, 11, 180);
  const trophy = sp(frame, R + 0.15, fps, 8, 150);
  const centy = sp(frame, R + 0.05, fps, 15, 200);
  const t300 = wordT(scene, /^300$/, 3.4);
  const fly = clamp01((t - (t300 - 0.1)) / 0.55);
  const vaultIn = sp(frame, t300 - 0.15, fps, 12, 200);
  // the price finishes rolling as the voice says it, then pulses
  const tPrice = wordT(scene, /14\.97/, 1.8);
  const rollP = clamp01((t - R) / Math.max(0.6, tPrice + 0.05 - R));
  const pricePulse = sp(frame, tPrice + 0.05, fps, 8, 220);
  const priceK = pricePulse * Math.max(0, 1 - (t - tPrice - 0.05) / 0.9);
  const priceScale = 1 + 0.05 * priceK;
  // A+B is one cent more: flag it while the voice is still on "fourteen ninety-seven"
  const chipIn = popIn(t, Math.min(tPrice + 0.75, t300 - 0.5), 0.3);
  const T = loopT;
  const rowY = [700, 884, 1006];
  const rowH = [166, 104, 104];

  return (
    <Stage scene={scene} props={props}>
      <PText size={48} color={C.white} shadow={C.magentaDk} style={{ position: "absolute", left: 90, top: 184 }}>
        LOWEST TOTAL
      </PText>

      <Panel x={70} y={256} w={790} h={304} border={hero > 0.5 ? C.gold : C.edge} fill={C.night} glow={hero > 0.5 ? "rgba(255,204,51,0.45)" : undefined}>
        {/* Centy holds up a W sign */}
        <div style={{ position: "absolute", left: 30, top: 18, width: 200, height: 280, scale: String(centy), transformOrigin: "50% 100%" }}>
          <div style={{ position: "absolute", left: 128, top: 60, width: 10, height: 70, background: "#8A5A24", boxShadow: `0 0 0 3px ${C.ink}` }} />
          <div
            style={{
              position: "absolute",
              left: 84,
              top: 0,
              width: 100,
              height: 80,
              background: C.ink,
              border: `5px solid ${C.green}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 18px rgba(108,255,108,0.6), 0 6px 0 #0B0B12",
              rotate: `${mod(Math.floor(T * 2), 2) === 0 ? -4 : 4}deg`,
            }}
          >
            <PText size={56} color={C.green} style={{ marginLeft: 6 }}>
              W
            </PText>
          </div>
          <div style={{ position: "absolute", left: 0, top: 86 }}>
            <PixelCenty px={6} expr="happy" t={T} />
          </div>
        </div>
        {/* 3 x A = $14.97 */}
        <div style={{ position: "absolute", left: 250, top: 30, display: "flex", alignItems: "center", gap: 14, opacity: hero > 0.02 ? 1 : 0.25 }}>
          <PText size={64} color={C.white}>
            3×
          </PText>
          {[0, 1, 2].map((k) => (
            <Badge key={k} letter="A" size={64} style={{ scale: String(sp(frame, R + 0.1 + k * 0.12, fps, 9, 220)) }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 250, top: 128, opacity: hero > 0.02 ? 1 : 0, scale: String(priceScale), transformOrigin: "264px 50%" }}>
          <RollNum text="$14.97" size={96} p={rollP} color={C.gold} glow={priceK > 0.3 ? "rgba(255,230,120,0.95)" : "rgba(255,204,51,0.55)"} />
        </div>
        <div style={{ position: "absolute", left: 250, top: 246, display: "flex", alignItems: "center", gap: 14, opacity: popIn(t, R + 0.4) }}>
          <PText size={40} color="#D8D8FF">
            =
          </PText>
          <Gems n="1,500" size={40} />
          <PText size={40} color="#D8D8FF">
            TOTAL
          </PText>
        </div>
      </Panel>

      {/* trophy lands on the winning row */}
      <div style={{ position: "absolute", left: 742, top: interpolate(trophy, [0, 1], [-160, 168]), filter: "drop-shadow(0 8px 0 #0B0B12) drop-shadow(0 0 20px rgba(255,204,51,0.6))" }}>
        <Sprite map={TROPHY} pal={TROPHY_PAL} px={8} />
      </div>

      {/* leftover gems fly into the vault */}
      <div style={{ position: "absolute", left: 92, top: 580, scale: String(0.6 + 0.4 * vaultIn), opacity: clamp01(vaultIn * 3), transformOrigin: "50% 50%" }}>
        <Sprite map={VAULT} pal={VAULT_PAL} px={7} style={{ filter: "drop-shadow(0 6px 0 #0B0B12)" }} />
        <div style={{ position: "absolute", left: 70, top: -14 }}>
          <Sprite map={LOCK} pal={LOCK_PAL} px={5} />
        </div>
      </div>
      {fly > 0 && fly < 1
        ? [0, 1, 2, 3, 4].map((k) => {
            const f = clamp01(fly * 1.4 - k * 0.1);
            const x = interpolate(f, [0, 1], [420 + k * 44, 120]);
            const y = interpolate(f, [0, 1], [520, 610]) - Math.sin(f * Math.PI) * 90;
            return f > 0 && f < 1 ? (
              <div key={k} style={{ position: "absolute", left: x, top: y }}>
                <GemIcon size={44} k={k} />
              </div>
            ) : null;
          })
        : null}
      <div style={{ position: "absolute", left: 216, top: 584, opacity: vaultIn > 0.05 ? 1 : 0, scale: String(0.7 + 0.3 * vaultIn), transformOrigin: "left center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Gems n="+300" size={48} />
          <PText size={48} color={C.cyan}>
            LEFT
          </PText>
        </div>
        <PText size={40} color={C.gold} style={{ marginTop: 16 }}>
          WORTH ~$2.99
        </PText>
      </div>

      {/* runners-up */}
      {RUNNERS.map((r, k) => {
        const y = rowY[k];
        const slide = clampI(Math.floor(t * 30) / 30, R + 0.35 + k * 0.15, R + 0.65 + k * 0.15, 1, 0);
        return slide > 0.999 ? null : (
          <div key={k} style={{ position: "absolute", left: 0, top: 0, translate: `${slide * 1100}px 0` }}>
            <Panel x={70} y={y} w={790} h={rowH[k]} border={C.edge} fill={C.panel}>
              <div style={{ position: "absolute", left: 24, top: 40, width: 18, height: 18, background: "#8A8AD0" }} />
              <PText size={44} color={C.white} style={{ position: "absolute", left: 62, top: 30 }}>
                {r.combo}
              </PText>
              <PText size={44} color={r.red ? C.red : C.gold} style={{ position: "absolute", left: 236, top: 30 }}>
                {r.price}
              </PText>
              <div style={{ position: "absolute", right: 22, top: 30 }}>
                <Gems n={r.left} size={40} />
              </div>
            </Panel>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 465, top: 788, translate: "-50% 0", scale: String(chipIn) }}>
        <Sticker text="+1¢ = +100 GEMS, YOUR CALL" size={40} bg={C.cyan} />
      </div>
    </Stage>
  );
};

// ---------- lesson card + comment prompt ----------

const NotEqual: React.FC<{ s: number }> = ({ s }) => (
  <svg width={14 * s} height={12 * s} viewBox="0 0 14 12" shapeRendering="crispEdges">
    <rect x={1} y={3} width={12} height={2} fill={C.magenta} />
    <rect x={1} y={7} width={12} height={2} fill={C.magenta} />
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <rect key={k} x={9 - k * 1.2} y={k * 2} width={2} height={2} fill={C.white} />
    ))}
  </svg>
);

const Lesson: React.FC<VisualProps> = (props) => {
  const { scene, timeline } = props;
  const { frame, fps, t, loopT } = useClock(scene, timeline);
  const mouth = useMouth(timeline.mouth, scene.start);
  const tNe = wordT(scene, /^isn/, 0.9);
  const tYou = wordT(scene, /^you,/, 1.8);
  const tFor = wordT(scene, /^for$/, 1.6);
  const tSkin = wordT(scene, /^skin$/, 2.55);
  const tWhich = wordT(scene, /^Which/, 3.8);
  const ne = sp(frame, tNe - 0.05, fps, 9, 220);
  const [nx, ny] = shake(frame, Math.round((tNe + 0.12) * fps), 8);
  const words = [
    { text: "CHEAPEST", color: C.white, y: 236, at: 0 },
    { text: "PER GEM", color: C.cyan, y: 330, at: 0.35 },
    { text: "CHEAPEST", color: C.white, y: 578, at: tFor - 0.45 },
    { text: "FOR YOU", color: C.gold, y: 672, at: tFor - 0.05 },
  ];
  const hood = popIn(t, tSkin - 0.05, 0.3);
  const ask = sp(frame, tWhich - 0.1, fps, 10, 200);
  const shareIn = popIn(t, tYou + 0.3, 0.3);
  const lightK = t >= tWhich ? Math.floor((t - tWhich) * 2.5) % 4 : -1; // 2.5 Hz

  return (
    <Stage scene={scene} props={props}>
      <Panel x={70} y={196} w={790} h={584} border={C.cyan} fill={C.night} glow="rgba(46,242,255,0.3)">
        {null}
      </Panel>
      {words.map((w, i) => (
        <PText
          key={i}
          size={76}
          color={w.color}
          glow={i === 3 ? "rgba(255,204,51,0.6)" : i === 1 ? "rgba(46,242,255,0.5)" : undefined}
          style={{ position: "absolute", left: 465, top: w.y, translate: "-50% 0", scale: String(popIn(t, w.at, 0.28)) }}
        >
          {w.text}
        </PText>
      ))}
      <div style={{ position: "absolute", left: 465 + nx, top: 486 + ny, translate: "-50% -50%", scale: String(interpolate(ne, [0, 1], [2.2, 1])), opacity: clamp01(ne * 3) }}>
        <NotEqual s={11} />
      </div>
      <div style={{ position: "absolute", left: 742, top: 646, scale: String(hood), filter: "drop-shadow(0 0 12px rgba(255,46,136,0.6))" }}>
        <Hoodie px={6} T={loopT} />
      </div>

      {/* comment prompt with Centy */}
      <div style={{ position: "absolute", left: 92, top: 836, scale: String(ask), transformOrigin: "50% 100%" }}>
        <PixelCenty px={6} expr="talk" mouth={mouth} t={loopT} />
      </div>
      <div style={{ position: "absolute", left: 310, top: 826, opacity: clamp01(ask * 2), translate: `${(1 - ask) * 60}px 0` }}>
        <PText size={40} color={C.white} shadow={C.magentaDk}>
          COMMENT:
        </PText>
        <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
          {["A", "B", "C", "D"].map((k, i) => (
            <Badge key={k} letter={k} size={110} color={lightK === i ? C.green : C.magenta} style={{ translate: `0 ${lightK === i ? 6 : 0}px` }} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 465,
          top: 1062,
          translate: "-50% 0",
          scale: String(shareIn),
          fontFamily: BUNGEE,
          fontSize: 40,
          lineHeight: 1.15,
          color: C.white,
          textAlign: "center",
          whiteSpace: "nowrap",
          textShadow: `0 5px 0 ${C.ink}`,
        }}
      >
        TAG THE FRIEND WHO ALWAYS
        <br />
        <span style={{ color: C.gold }}>BUYS THE BIGGEST PACK</span>
      </div>
    </Stage>
  );
};

export const visuals: VisualMap = {
  "gem.shop": Shop,
  "gem.bars": Bars,
  "gem.answer": Answer,
  "gem.lesson": Lesson,
};
