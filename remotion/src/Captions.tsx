import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { DISPLAY } from "./fonts";
import { Scene } from "./types";

const NUMBERISH = /[$\d%¢]/;
const MAX_CHARS = 13;

// Group words into short chunks that never cross a sentence end.
const chunk = (words: Scene["words"]) => {
  const chunks: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  words.forEach(({ w }, i) => {
    const wl = w.length * (NUMBERISH.test(w) ? 1.2 : 1);
    if (cur.length && len + 1 + wl > MAX_CHARS) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(i);
    len += wl + (len ? 1 : 0);
    if (/[.,?!…]$/.test(w)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

export const Captions: React.FC<{ scene: Scene; y: number; accent: string }> = ({ scene, y, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scene.words;
  if (!words.length || t < words[0].t - 0.05) return null;
  let current = 0;
  words.forEach((w, i) => {
    if (w.t <= t + 0.05) current = i;
  });
  const chunks = chunk(words);
  const group = chunks.find((c) => c.includes(current)) ?? [];
  const appear = words[group[0]]?.t ?? 0;
  const pop = interpolate(t - appear, [0, 0.12], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 190,
        top: y,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 22px",
        scale: String(pop),
        fontFamily: DISPLAY,
        fontSize: 92,
        lineHeight: 1.05,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {group.map((i) => {
        const w = words[i].w;
        const active = i === current;
        const numeric = NUMBERISH.test(w);
        return (
          <span
            key={i}
            style={{
              color: active || numeric ? accent : "#ffffff",
              fontSize: numeric ? 108 : 92,
              WebkitTextStroke: "14px #000",
              paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.55)",
              opacity: words[i].t <= t + 0.05 ? 1 : 0.0,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
