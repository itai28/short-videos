import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Centy, the channel's own coin mascot, as SVG. Size is the coin diameter in px.
 * mouth: 0..1 voice level for lip-sync (pass timeline.mouth[absoluteFrame]).
 * expr: talk | smug | shocked | worried | hype | deadpan.
 * look: -1..1 pupils left/right. ink: draw as a flat ink doodle instead of shaded gold.
 */
export type CentyProps = {
  size?: number;
  mouth?: number;
  expr?: "talk" | "smug" | "shocked" | "worried" | "hype" | "deadpan";
  look?: number;
  headset?: boolean;
  ink?: string; // e.g. "#1E2A4A" for a doodle version
  gold?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode; // extra SVG drawn on top in a 200x200 box (hats, gloves...)
};

export const Centy: React.FC<CentyProps> = ({
  size = 260,
  mouth = 0,
  expr = "talk",
  look = 0,
  headset = true,
  ink,
  gold = "#FFCC33",
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const blink = (t % 3.3) < 0.1 && expr !== "shocked" && expr !== "hype";
  const stroke = ink ?? "#2b1a05";
  const lx = 72 + look * 6;
  const rx = 128 + look * 6;
  const eyeR = expr === "shocked" ? 17 : 14;
  const open = Math.max(0, Math.min(1, mouth));
  const lid = expr === "smug" || expr === "deadpan";
  const mouthPath = (() => {
    if (expr === "hype") return `M70 128 Q100 ${158 + open * 10} 130 128 Z`;
    if (expr === "shocked") return "";
    if (expr === "worried") return `M78 ${140 - open * 4} Q100 ${128 - open * 6} 122 ${140 - open * 4}`;
    if (expr === "deadpan") return "M80 136 L120 136";
    if (expr === "smug") return `M78 132 Q104 ${146 + open * 6} 124 126`;
    return "";
  })();
  return (
    <svg width={size} height={size} viewBox="-10 -10 220 220" style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="centyFace" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="45%" stopColor={gold} />
          <stop offset="100%" stopColor="#C98A00" />
        </radialGradient>
      </defs>
      {headset && (
        <g stroke={ink ?? "#1d1d28"} fill={ink ? "none" : "#1d1d28"} strokeWidth={ink ? 5 : 0}>
          <path d="M20 96 Q100 -12 180 96" fill="none" strokeWidth={14} stroke={ink ?? "#1d1d28"} />
          <rect x={4} y={78} width={30} height={52} rx={14} />
          <rect x={166} y={78} width={30} height={52} rx={14} />
          <path d="M20 128 Q24 172 64 170" fill="none" strokeWidth={6} stroke={ink ?? "#1d1d28"} />
          <circle cx={66} cy={170} r={8} />
        </g>
      )}
      <circle cx={100} cy={100} r={92} fill={ink ? "none" : "url(#centyFace)"} stroke={stroke} strokeWidth={ink ? 6 : 5} />
      <circle cx={100} cy={100} r={80} fill="none" stroke={ink ? stroke : "#E0A200"} strokeWidth={ink ? 3 : 4} strokeDasharray={ink ? "6 8" : undefined} />
      {!ink && <path d="M44 62 Q60 36 92 30" stroke="rgba(255,255,255,0.7)" strokeWidth={8} strokeLinecap="round" fill="none" />}
      {/* eyes */}
      {[lx, rx].map((x, i) =>
        blink ? (
          <path key={i} d={`M${x - 14} 86 L${x + 14} 86`} stroke={stroke} strokeWidth={6} strokeLinecap="round" />
        ) : expr === "hype" ? (
          <path key={i} d={`M${x - 14} 90 Q${x} 70 ${x + 14} 90`} stroke={stroke} strokeWidth={7} fill="none" strokeLinecap="round" />
        ) : (
          <g key={i}>
            <ellipse cx={x} cy={86} rx={eyeR + 4} ry={eyeR + 8} fill={ink ? "none" : "#fff"} stroke={stroke} strokeWidth={ink ? 4 : 3} />
            <circle cx={x + look * 4} cy={90} r={expr === "shocked" ? 7 : 9} fill={stroke} />
            {lid && <path d={`M${x - eyeR - 5} 80 L${x + eyeR + 5} 80 L${x + eyeR + 5} 66 L${x - eyeR - 5} 66 Z`} fill={ink ? "none" : gold} stroke={stroke} strokeWidth={4} />}
          </g>
        ),
      )}
      {/* brows */}
      {expr === "worried" && (
        <g stroke={stroke} strokeWidth={6} strokeLinecap="round">
          <path d="M56 60 L84 52" />
          <path d="M144 60 L116 52" />
        </g>
      )}
      {expr === "shocked" && (
        <g stroke={stroke} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M56 50 Q72 40 88 50" />
          <path d="M112 50 Q128 40 144 50" />
        </g>
      )}
      {/* mouth */}
      {expr === "talk" && (
        <ellipse cx={100} cy={136} rx={16 + open * 6} ry={4 + open * 16} fill={ink ? "none" : "#5a1d12"} stroke={stroke} strokeWidth={4} />
      )}
      {expr === "shocked" && <ellipse cx={100} cy={142} rx={14} ry={20} fill={ink ? "none" : "#5a1d12"} stroke={stroke} strokeWidth={4} />}
      {mouthPath && <path d={mouthPath} stroke={stroke} strokeWidth={6} strokeLinecap="round" fill={expr === "hype" && !ink ? "#5a1d12" : "none"} />}
      {expr === "worried" && <path d="M150 64 Q156 78 150 84 Q144 78 150 64 Z" fill="#7fd3ff" stroke={stroke} strokeWidth={2} />}
      {children}
    </svg>
  );
};

/** Voice level for the current absolute frame, for lip-sync. */
export const useMouth = (mouthCurve: number[], sceneStartSeconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = Math.round(sceneStartSeconds * fps) + frame;
  return mouthCurve[Math.min(Math.max(abs, 0), mouthCurve.length - 1)] ?? 0;
};
