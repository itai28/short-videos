export type Theme = {
  bg1: string;
  bg2: string;
  accent: string; // money / numbers
  pop: string; // second colour
  danger: string;
  ink: string;
  panel: string;
};

export const DEFAULT_THEME: Theme = {
  bg1: "#0f0a24",
  bg2: "#2a1260",
  accent: "#ffcc33",
  pop: "#22d3ee",
  danger: "#ff4d6d",
  ink: "#ffffff",
  panel: "rgba(255,255,255,0.08)",
};

export const themeOf = (style: Record<string, unknown>): Theme => ({
  ...DEFAULT_THEME,
  ...((style?.theme as Partial<Theme>) ?? {}),
});

// Layout constants for 1080x1920 with TikTok/Shorts UI: keep text inside x 70..890 and above y 1500.
export const W = 1080;
export const H = 1920;
export const SAFE_L = 70;
export const SAFE_R = 890;
export const STAGE_TOP = 230;
export const STAGE_BOTTOM = 1180;
export const CAPTION_Y = 1240;
