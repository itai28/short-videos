import type React from "react";

// Gallery palette for cents_012_penny_museum. Gold = money/counts, red = loss (channel rule).
export const NAVY = "#0E1A2E";
export const NAVY_DEEP = "#08111F";
export const SPOT = "#FFE7B0";
export const COPPER = "#C8743C";
export const NICKEL = "#C9CED6";
export const RED = "#FF4D4D";
export const GOLD = "#FFCC33";
export const CREAM = "#F6EBD2";
export const INK = "#2A1A08"; // engraved text on brass
export const OXBLOOD = "#6B1C2A";
export const BRASS_HI = "#F5DFA4";
export const BRASS = "#D1A85A";
export const BRASS_LO = "#8A6224";

export const CX = 480; // centre of the safe stage (x 70..890)

/** Lining figures keep Playfair numbers the same height. */
export const LINING: React.CSSProperties = { fontVariantNumeric: "lining-nums", fontFeatureSettings: '"lnum" 1' };

/** Positive modulo, so motion driven by negative time (outro) wraps the same way as positive time (hook). */
export const pmod = (x: number, m: number) => ((x % m) + m) % m;
