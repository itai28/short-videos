import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BUNGEE, MONO, PIXEL as PIXEL_NAME } from "../../fonts";
import { Scene, Timeline } from "../../types";
import { rand } from "../../visuals/util";
import { C, GemIcon, mod } from "./sprites";

// "Press Start 2P" must be quoted in CSS (an unquoted family name cannot contain "2P").
export const PIXEL = PIXEL_NAME; // already quoted in fonts.ts

/**
 * Time helpers. `loopF` is the absolute frame, except in the outro where it counts up to 0 at the
 * end of the video, so the last frame draws exactly what frame 0 draws.
 */
export const useClock = (scene: Scene, timeline: Timeline, loop = false) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = Math.round(scene.start * fps) + frame;
  const loopF = loop ? abs - timeline.frames : abs;
  return { frame, fps, t: frame / fps, abs, loopF, loopT: loopF / fps, durF: Math.max(1, Math.round(scene.dur * fps)) };
};

/** CRT arcade backdrop: night gradient, pixel stars, neon floor grid. Drawn full-bleed. */
export const ArcadeBG: React.FC<{ T: number }> = ({ T }) => {
  const stars = Array.from({ length: 46 }).map((_, i) => {
    const x = Math.floor(rand(i * 3.1 + 1) * 1080 / 6) * 6;
    const y = Math.floor(rand(i * 5.7 + 2) * 1150 / 6) * 6;
    const period = 1.6 + rand(i * 9.3) * 2.2; // slow twinkle, well under 3 Hz
    const on = mod(T + rand(i * 1.9) * period, period) < period * 0.72;
    const s = rand(i * 2.3) > 0.8 ? 8 : 4;
    return { x, y, on, s, c: i % 5 === 0 ? C.cyan : i % 7 === 0 ? C.magenta : "#C8C8FF" };
  });
  const horizon = 1210;
  const scroll = mod(T * 0.9, 1);
  const hLines = Array.from({ length: 14 }).map((_, i) => {
    const k = (i + scroll) / 14;
    return horizon + Math.pow(k, 2.2) * (1920 - horizon);
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg} 0%, #120A26 55%, #1E0A30 100%)` }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 45% at 50% 0%, rgba(255,46,136,0.16), transparent 70%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 30% at 45% 62%, rgba(46,242,255,0.07), transparent 70%)" }} />
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, background: s.c, opacity: s.on ? 0.7 : 0.15 }} />
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="gemFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.magenta} stopOpacity={0.0} />
            <stop offset="30%" stopColor={C.magenta} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.magenta} stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <rect x={0} y={horizon} width={1080} height={1920 - horizon} fill="url(#gemFloor)" opacity={0.25} />
        {hLines.map((y, i) => (
          <rect key={i} x={0} y={Math.round(y)} width={1080} height={3} fill={C.magenta} opacity={0.18 + 0.25 * ((y - horizon) / (1920 - horizon))} />
        ))}
        {Array.from({ length: 19 }).map((_, i) => {
          const x = -1080 + i * 180;
          return <line key={i} x1={480} y1={horizon} x2={x + 540} y2={1920} stroke={C.magenta} strokeWidth={3} opacity={0.22} />;
        })}
        <rect x={0} y={horizon - 2} width={1080} height={4} fill={C.cyan} opacity={0.35} />
      </svg>
    </AbsoluteFill>
  );
};

/** CRT scanlines (2 px) and a soft vignette, drawn over the scene. */
export const CRT: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, rgba(0,0,0,0.20) 0px, rgba(0,0,0,0.20) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 45% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
  </>
);

/** Stepped 12x20 pixel dissolve through black: in at the scene start, out at the end. */
export const Dissolve: React.FC<{ enter: boolean; exit: boolean; frame: number; durF: number }> = ({ enter, exit, frame, durF }) => {
  const N = 15; // frames
  let cover: (r: number) => boolean = () => false;
  if (enter && frame < N) {
    const p = Math.floor(frame / 3) / 5; // 0, .2 ... .8
    cover = (r) => r >= p;
  } else if (exit && frame >= durF - N) {
    const e = Math.ceil((frame - (durF - N) + 1) / 3) / 5; // .2 ... 1
    cover = (r) => r < e;
  } else return null;
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < 20; j++) {
    for (let i = 0; i < 12; i++) {
      const r = rand(i * 7.13 + j * 3.71 + 11);
      if (cover(r)) {
        cells.push(<rect key={`${i}-${j}`} x={i * 90} y={j * 96} width={90} height={96} fill={r > 0.86 ? C.night : C.bg} />);
      }
    }
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} shapeRendering="crispEdges">
      {cells}
    </svg>
  );
};

/** Pulls "," and "." in by a quarter em on each side so pixel numbers read as one number ("1,200"). */
export const tight = (s: React.ReactNode): React.ReactNode =>
  typeof s === "string"
    ? s.split(/([,.])/).map((part, i) =>
        part === "," || part === "." ? (
          <span key={i} style={{ marginLeft: "-0.22em", marginRight: "-0.28em" }}>
            {part}
          </span>
        ) : (
          part
        ),
      )
    : s;

/** Pixel text with a hard drop shadow. */
export const PText: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  shadow?: string;
  glow?: string;
  style?: React.CSSProperties;
}> = ({ children, size, color = C.white, shadow = C.ink, glow, style }) => (
  <div
    style={{
      fontFamily: PIXEL,
      fontSize: size,
      lineHeight: 1,
      color,
      whiteSpace: "nowrap",
      textShadow: `0 ${Math.max(4, Math.round(size * 0.09))}px 0 ${shadow}${glow ? `, 0 0 ${Math.round(size * 0.35)}px ${glow}` : ""}`,
      ...style,
    }}
  >
    {tight(children)}
  </div>
);

/** A pixel-bordered panel with notched corners and a drop shadow. */
export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  border?: string;
  fill?: string;
  b?: number;
  glow?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, border = C.edge, fill = C.panel, b = 6, glow, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>
    {/* drop shadow */}
    <div style={{ position: "absolute", left: b + 4, top: b + 10, width: w, height: h, background: "rgba(0,0,0,0.55)" }} />
    {/* border made of 2 crossing rects = notched pixel corners */}
    <div style={{ position: "absolute", left: 0, top: b, width: w, height: h - 2 * b, background: border, boxShadow: glow ? `0 0 34px ${glow}` : undefined }} />
    <div style={{ position: "absolute", left: b, top: 0, width: w - 2 * b, height: h, background: border }} />
    <div
      style={{
        position: "absolute",
        left: b,
        top: b,
        width: w - 2 * b,
        height: h - 2 * b,
        background: `linear-gradient(180deg, ${fill} 0%, ${C.ink} 160%)`,
        boxShadow: "inset 0 6px 0 rgba(255,255,255,0.06), inset 0 -8px 0 rgba(0,0,0,0.35)",
      }}
    />
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
  </div>
);

/** A square letter badge for a pack. */
export const Badge: React.FC<{ letter: string; size?: number; color?: string; style?: React.CSSProperties }> = ({ letter, size = 56, color = C.magenta, style }) => (
  <div
    style={{
      width: size,
      height: size,
      background: color,
      boxShadow: `inset -${size / 14}px -${size / 14}px 0 rgba(0,0,0,0.3), inset ${size / 14}px ${size / 14}px 0 rgba(255,255,255,0.35), 0 6px 0 ${C.ink}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: PIXEL,
      fontSize: Math.round(size * 0.66),
      color: C.white,
      textShadow: `0 4px 0 ${C.ink}`,
      ...style,
    }}
  >
    <span style={{ marginLeft: Math.round(size * 0.06) }}>{letter}</span>
  </div>
);

/** Gem amount: "1,200" + gem icon, in pixel font. */
export const Gems: React.FC<{ n: string; size: number; color?: string; glow?: string; style?: React.CSSProperties }> = ({ n, size, color = C.cyan, glow, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.14), ...style }}>
    <PText size={size} color={color} glow={glow}>
      {n}
    </PText>
    <GemIcon size={Math.round(size * 0.84)} style={{ marginTop: -Math.round(size * 0.08), filter: "drop-shadow(0 4px 0 #0B0B12)" }} />
  </div>
);

/** Rolling digit strips: each digit spins down into place as p goes 0 -> 1. */
export const RollNum: React.FC<{ text: string; size: number; p: number; color?: string; glow?: string }> = ({ text, size, p, color = C.white, glow }) => {
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  let di = 0;
  return (
    <div
      style={{
        display: "flex",
        fontFamily: PIXEL,
        fontSize: size,
        lineHeight: 1,
        color,
        textShadow: `0 ${Math.round(size * 0.09)}px 0 ${C.ink}`,
        filter: glow ? `drop-shadow(0 0 ${Math.round(size * 0.2)}px ${glow})` : undefined,
      }}
    >
      {text.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          const narrow = ch === "," || ch === ".";
          return (
            <span key={i} style={{ width: narrow ? size * 0.5 : size, display: "inline-block", overflow: "visible", textIndent: narrow ? -size * 0.22 : 0 }}>
              {ch}
            </span>
          );
        }
        const d = Number(ch);
        const spins = 10 + 6 * di++;
        const pos = 30 + d - spins * (1 - e);
        // Rows are taller than the mask (integer px), so the next digit never bleeds in as a thin line.
        const maskH = Math.round(size * 1.12);
        const rowH = Math.round(size * 1.4);
        return (
          <span key={i} style={{ width: size, height: maskH, overflow: "hidden", display: "inline-block", position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 0, translate: `0 ${-Math.round(pos * rowH)}px`, display: "flex", flexDirection: "column" }}>
              {Array.from({ length: 40 }).map((_, k) => (
                <span key={k} style={{ height: rowH, display: "block" }}>
                  {k % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Two white bars: the PAUSE glyph. */
export const PauseGlyph: React.FC<{ h: number; color?: string }> = ({ h, color = C.white }) => {
  const w = h * 0.3;
  const gap = h * 0.22;
  const bar = (x: number) => (
    <>
      <div style={{ position: "absolute", left: x + h * 0.06, top: h * 0.06, width: w, height: h, background: C.magenta }} />
      <div style={{ position: "absolute", left: x, top: 0, width: w, height: h, background: color, boxShadow: "inset -8px -8px 0 rgba(0,0,0,0.12)" }} />
    </>
  );
  return (
    <div style={{ position: "relative", width: 2 * w + gap + h * 0.06, height: h * 1.06 }}>
      {bar(0)}
      {bar(w + gap)}
    </div>
  );
};

/** A sticker label in Bungee (shop sticker, not game text). */
export const Sticker: React.FC<{ text: string; size?: number; bg?: string; color?: string; rotate?: number; style?: React.CSSProperties }> = ({
  text,
  size = 40,
  bg = C.gold,
  color = C.ink,
  rotate = 0,
  style,
}) => (
  <div
    style={{
      fontFamily: BUNGEE,
      fontSize: size,
      lineHeight: 1.05,
      color,
      background: bg,
      padding: `${Math.round(size * 0.2)}px ${Math.round(size * 0.35)}px ${Math.round(size * 0.12)}px`,
      whiteSpace: "nowrap",
      rotate: `${rotate}deg`,
      boxShadow: `0 6px 0 ${C.ink}, inset 0 -5px 0 rgba(0,0,0,0.18)`,
      textAlign: "center",
      ...style,
    }}
  >
    {text}
  </div>
);

/** The "made-up game · real math" assumption tab. */
export const AssumeTab: React.FC<{ y?: number; text?: string }> = ({ y = 170, text = "made-up game · real math" }) => (
  <div style={{ position: "absolute", left: 70, width: 790, top: y, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 40,
        color: "#E8E8FF",
        background: "rgba(26,11,46,0.9)",
        border: `3px solid ${C.cyan}`,
        padding: "4px 26px 8px",
        boxShadow: `0 6px 0 ${C.ink}`,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  </div>
);
