import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "./Captions";
import { fontsReady, MONO } from "./fonts";
import { Timeline } from "./types";
import { CAPTION_Y, Theme, themeOf } from "./theme";
import { VISUALS } from "./visuals";
import { Background } from "./visuals/Background";

export type ShortProps = { slug: string; timeline?: Timeline };

export const calculateShortMetadata: CalculateMetadataFunction<ShortProps> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`${props.slug}/timeline.json`), { signal: abortSignal });
  const timeline = (await res.json()) as Timeline;
  return {
    durationInFrames: timeline.frames,
    fps: timeline.fps,
    props: { ...props, timeline },
    defaultOutName: props.slug,
  };
};

const fontHandle = delayRender("fonts");
fontsReady.then(() => continueRender(fontHandle));

// Small push-in per scene, plus a punch on every hit (pop/ding/boom).
const useCamera = (timeline: Timeline, sceneStart: number, sceneDur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = sceneStart + frame / fps;
  if (timeline.style?.camera === "none") return { scale: 1, dx: 0, dy: 0 };
  const push = interpolate(now, [sceneStart, sceneStart + sceneDur], [1, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let punch = 0;
  let shake = 0;
  for (const h of timeline.hits) {
    const dt = now - h;
    if (dt >= 0 && dt < 0.5) {
      punch = Math.max(punch, 0.05 * Math.exp(-dt * 10));
      shake = Math.max(shake, 10 * Math.exp(-dt * 14));
    }
  }
  return { scale: push + punch, dx: Math.sin(now * 90) * shake, dy: Math.cos(now * 77) * shake };
};

const Flash: React.FC<{ timeline: Timeline; theme: Theme }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;
  const reveals = timeline.scenes.flatMap((s) => s.reveals.map((r) => s.start + r));
  const a = Math.max(0, ...reveals.map((r) => (now >= r && now < r + 0.35 ? 0.55 * (1 - (now - r) / 0.35) : 0)));
  return <AbsoluteFill style={{ backgroundColor: "white", opacity: a, pointerEvents: "none" }} />;
};

const Note: React.FC<{ text: string; theme: Theme }> = ({ text, theme }) => (
  <div
    style={{
      position: "absolute",
      top: 160,
      left: 70,
      right: 190,
      textAlign: "center",
      fontFamily: MONO,
      fontSize: 32,
      color: "rgba(255,255,255,0.82)",
      letterSpacing: 0.5,
    }}
  >
    <span style={{ background: "rgba(0,0,0,0.45)", padding: "8px 18px", borderRadius: 14, border: `2px solid ${theme.pop}55` }}>
      {text}
    </span>
  </div>
);

export const Short: React.FC<ShortProps> = ({ slug, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!timeline) return null;
  const theme = themeOf(timeline.style);
  const now = frame / fps;
  const idx = Math.max(0, timeline.scenes.findIndex((s) => now >= s.start && now < s.start + s.dur));
  const scene = timeline.scenes[idx] ?? timeline.scenes[timeline.scenes.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg1 }}>
      {timeline.style?.background === "none" ? null : <Background theme={theme} timeline={timeline} />}
      {timeline.scenes.map((s, i) => {
        const Visual = VISUALS[s.visual.kind];
        if (!Visual) throw new Error(`unknown visual kind ${s.visual.kind}`);
        return (
          <Sequence
            key={i}
            name={`${i + 1}. ${s.visual.kind}`}
            from={Math.round(s.start * fps)}
            durationInFrames={Math.max(1, Math.round(s.dur * fps))}
            layout="none"
          >
            <SceneFrame timeline={timeline} index={i}>
              <Visual scene={s} theme={theme} timeline={timeline} index={i} />
            </SceneFrame>
          </Sequence>
        );
      })}
      {timeline.style?.flash === false ? null : <Flash timeline={timeline} theme={theme} />}
      {scene.note ? <Note text={typeof scene.note === "string" ? scene.note : timeline.note ?? ""} theme={theme} /> : null}
      <Sequence from={Math.round(scene.start * fps)} layout="none" key={`cap-${idx}`}>
        <Captions scene={{ ...scene, words: scene.words.map((w) => ({ ...w })) }} y={(scene.visual.captionY as number) ?? (timeline.style?.captionY as number) ?? CAPTION_Y} accent={theme.accent} />
      </Sequence>
      <Audio src={staticFile(`${slug}/audio.wav`)} />
    </AbsoluteFill>
  );
};

const SceneFrame: React.FC<{ timeline: Timeline; index: number; children: React.ReactNode }> = ({ timeline, index, children }) => {
  const s = timeline.scenes[index];
  const cam = useCamera(timeline, s.start, s.dur);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [0, 0.18 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  if (timeline.style?.sceneEnter === "none") {
    return (
      <AbsoluteFill style={{ scale: String(cam.scale), translate: `${cam.dx}px ${cam.dy}px` }}>{children}</AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        scale: String(cam.scale * (index === 0 ? 1 : 0.96 + 0.04 * enter)),
        translate: `${cam.dx}px ${cam.dy}px`,
        opacity: index === 0 ? 1 : enter,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
