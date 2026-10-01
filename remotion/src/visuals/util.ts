import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../types";

/** Seconds since the scene started. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

/** Overshooting pop-in: 0 before `at`, springs to 1 over `dur` seconds. */
export const popIn = (t: number, at = 0, dur = 0.32) =>
  interpolate(t - at, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

/** A time value in a visual: a number of seconds, or "reveal" for the scene's first ⏸ pause. */
export const at = (scene: Scene, v: unknown, fallback = 0): number => {
  if (v === "reveal") return scene.reveals[0] ?? fallback;
  if (typeof v === "string" && v.startsWith("word:")) {
    // "word:N" = when the Nth caption word is spoken
    const n = Number(v.slice(5));
    return scene.words[n]?.t ?? fallback;
  }
  return typeof v === "number" ? v : fallback;
};

export const money = (x: number, decimals = 0) =>
  `${x < 0 ? "-" : ""}$${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** Deterministic pseudo-random in [0,1) for a seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
