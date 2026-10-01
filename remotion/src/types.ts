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
