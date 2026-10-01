import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useMouth } from "../../shared/Centy";
import { VisualMap, VisualProps } from "../../types";
import { clamp01, useT } from "../../visuals/util";
import { CommentScene, DamageScene } from "./Extras";
import { GalleryView, Iris } from "./Gallery";
import { pmod } from "./palette";
import { PressScene } from "./Press";
import { ScaleScene } from "./Scale";

// Visuals for cents_012_penny_museum. Keys are the `visual.kind` values used in scripts/cents_012_penny_museum.py.

/** The gallery. hook: frame 0 fully built. nickel: iris in, penny case slides left, nickel case slides in. outro: iris in, push to the exact frame-0 framing. */
const Gallery: React.FC<VisualProps> = ({ scene, timeline }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mouth = useMouth(timeline.mouth, scene.start);
  const mode = scene.visual.mode as string;
  const iris = interpolate(t, [0, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  if (mode === "hook") {
    const lost = scene.words.find((w) => /^lost$/i.test(w.w))?.t ?? 0.6;
    const underline = interpolate(t, [lost, lost + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return <GalleryView tt={t} mouth={mouth} underline={underline} />;
  }
  if (mode === "outro") {
    // Loop phase is keyed to the composition's last frame (timeline.frames), not scene.dur: the script stretches
    // this scene's dur over the exporter's 0.1 s tail, and the frame after the last one must be frame 0 of the hook.
    const endF = timeline.frames - Math.round(scene.start * fps);
    const end = endF / fps;
    const tt = t - end;
    const push = interpolate(t, [0, Math.max(0.6, end - 0.3)], [1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    return (
      <Iris r={iris >= 1 ? 9999 : 40 + 1400 * iris} y={640}>
        <AbsoluteFill style={{ scale: String(push), transformOrigin: "480px 700px" }}>
          <GalleryView tt={tt} mouth={mouth} centyShift={pmod(59 - (endF - 1), 198)} />
        </AbsoluteFill>
      </Iris>
    );
  }
  // nickel
  const p = interpolate(t, [0.25, 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const nIn = spring({ frame: frame - Math.round(0.35 * fps), fps, config: { damping: 14, stiffness: 110 } });
  const say = scene.words.find((w) => /13\.78/.test(w.w))?.t ?? 0.86;
  const bump = clamp01((t - say) / 0.4);
  const pop = 1 + 0.16 * Math.sin(Math.PI * bump);
  // the source note sits at y 160 in this scene, so the wall sign hangs lower than in the hook (no note there)
  const signY = 240;
  // slow push after the cases settle, so the hold on "13.78¢" never freezes
  const push = interpolate(t, [0.9, scene.dur], [1, 1.045], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <Iris r={iris >= 1 ? 9999 : 40 + 1400 * iris} y={640}>
      <AbsoluteFill style={{ scale: String(push), transformOrigin: "480px 420px" }}>
        <GalleryView tt={t + 2} mouth={mouth} p={p} nickelIn={nIn} nickelPop={pop} centyOut={p} signY={signY} />
      </AbsoluteFill>
    </Iris>
  );
};

export const visuals: VisualMap = {
  "penny.gallery": Gallery,
  "penny.press": PressScene,
  "penny.scale": ScaleScene,
  "penny.damage": DamageScene,
  "penny.comment": CommentScene,
};
