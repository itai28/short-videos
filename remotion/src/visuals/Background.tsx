import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme } from "../theme";
import { Timeline } from "../types";
import { rand } from "./util";

// Slow gradient, faint grid and drifting coins. The voice level brightens it a touch.
export const Background: React.FC<{ theme: Theme; timeline: Timeline }> = ({ theme, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const level = timeline.mouth[Math.min(frame, timeline.mouth.length - 1)] ?? 0;
  const angle = 160 + 10 * Math.sin(t * 0.4);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, ${theme.bg1} 0%, ${theme.bg2} 100%)` }} />
      <AbsoluteFill
        style={{
          opacity: 0.12 + 0.05 * level,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.25) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.25) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(t * 30) % 90}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
        }}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = rand(i) * 1080;
        const speed = 40 + rand(i + 50) * 60;
        const y = 1920 - ((t * speed + rand(i + 99) * 1920) % 2100);
        const r = 10 + rand(i + 7) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: theme.accent,
              opacity: 0.08 + rand(i + 3) * 0.08,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
