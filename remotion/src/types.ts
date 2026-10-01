export type Word = { w: string; t: number };

export type Scene = {
  start: number;
  dur: number;
  lead: number;
  reveals: number[];
  words: Word[];
  say: string;
  cap?: string;
  visual: { kind: string; [key: string]: unknown };
  note?: boolean | string;
  expr?: string;
  lean?: boolean;
  bg?: string;
  hold?: number;
  speed?: number;
};

export type Timeline = {
  slug: string;
  fps: number;
  total: number;
  frames: number;
  title: string;
  note?: string;
  style: Record<string, unknown>;
  hits: number[];
  scenes: Scene[];
  mouth: number[];
  shape: number[];
};

import type React from "react";
import type { Theme } from "./theme";

/** Props every scene visual receives. Visuals render inside a Sequence, so useCurrentFrame() is scene-relative. */
export type VisualProps = { scene: Scene; theme: Theme; timeline: Timeline; index: number };
export type VisualMap = Record<string, React.FC<VisualProps>>;
