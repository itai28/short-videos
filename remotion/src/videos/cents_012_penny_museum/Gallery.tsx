import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { CoinKind, Curator, Exhibit, GalleryRoom, Placard, PlateLabel, PlateNumber, Spot, Stanchions, WallSign } from "./Museum";
import { RED, SPOT } from "./palette";

type Geo = { cx: number; top: number; w: number; h: number; plinthW: number; coinD: number; plateW: number; plateY: number };
export const HOOK: Geo = { cx: 480, top: 400, w: 520, h: 440, plinthW: 620, coinD: 290, plateW: 560, plateY: 884 };
const LEFT: Geo = { cx: 258, top: 480, w: 330, h: 360, plinthW: 370, coinD: 200, plateW: 340, plateY: 880 };
const RIGHT: Geo = { ...LEFT, cx: 668 };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpGeo = (a: Geo, b: Geo, p: number): Geo => ({
  cx: lerp(a.cx, b.cx, p),
  top: lerp(a.top, b.top, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  plinthW: lerp(a.plinthW, b.plinthW, p),
  coinD: lerp(a.coinD, b.coinD, p),
  plateW: lerp(a.plateW, b.plateW, p),
  plateY: lerp(a.plateY, b.plateY, p),
});

/** Coin turn used by every gallery view; driven by tt so the outro (tt -> 0) lands exactly on frame 0. */
export const turnAt = (tt: number, amp = 13) => amp * Math.sin(tt * 1.7);

const SidePlate: React.FC<{ g: Geo; kind: CoinKind; cost: string; opacity: number; pop?: number; glow?: number }> = ({ g, kind, cost, opacity, pop = 1, glow = 0 }) => (
  <Placard x={g.cx} y={g.plateY} w={g.plateW} opacity={opacity}>
    <PlateLabel spacing={6}>{kind === "penny" ? "PENNY · 1¢" : "NICKEL · 5¢"}</PlateLabel>
    <div style={{ height: 2, background: "rgba(42,26,8,0.35)", margin: "8px 6px 6px" }} />
    <PlateLabel spacing={0}>COST TO MAKE</PlateLabel>
    <div style={{ filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(255,255,255,${0.9 * glow}))` : undefined }}>
      <PlateNumber size={96} s={pop}>
        {cost}
      </PlateNumber>
    </div>
  </Placard>
);

/**
 * The gallery: one penny vitrine (p = 0), or the penny and nickel side by side (p = 1, nickelIn = 1).
 * tt drives the idle motion (coin turn, dust, glare).
 */
export const GalleryView: React.FC<{
  tt: number;
  mouth: number;
  p?: number;
  nickelIn?: number;
  nickelPop?: number;
  underline?: number;
  centyOut?: number;
  centyShift?: number;
  signY?: number;
  signOpacity?: number;
}> = ({ tt, mouth, p = 0, nickelIn = 0, nickelPop = 1, underline = 0, centyOut = 0, centyShift = 60, signY, signOpacity = 1 }) => {
  const pg = lerpGeo(HOOK, LEFT, p);
  const ng: Geo = { ...RIGHT, cx: RIGHT.cx + (1 - nickelIn) * 560 };
  const spots: Spot[] = [{ x: pg.cx, w: lerp(330, 215, p), a: lerp(1, 0.55, p) }];
  if (nickelIn > 0) spots.push({ x: ng.cx, w: 215, a: nickelIn });
  const turn = turnAt(tt, lerp(13, 9, p));
  const hookPlate = Math.max(0, 1 - p * 2.2);
  const sidePlate = Math.max(0, p * 2.2 - 1.2);
  return (
    <AbsoluteFill>
      <GalleryRoom spots={spots} tt={tt} />
      <WallSign y={signY} opacity={signOpacity} />
      {/* Centy leans in from behind the penny case */}
      <div style={{ position: "absolute", left: 58 - centyOut * 320, top: 588, rotate: `${10 + Math.sin(tt * 1.3) * 2}deg` }}>
        {/* Centy blinks on his own clock; shift it so frame 0 (and the outro's last frame) never lands on a blink */}
        <Sequence from={-centyShift} layout="none">
          <Curator size={190} mouth={mouth} wave={Math.sin(tt * 2.2)} look={0.6} />
        </Sequence>
      </div>
      <Exhibit {...pg} kind="penny" turn={turn} tt={tt} light={lerp(1, 0.62, p)} />
      {nickelIn > 0 ? <Exhibit {...ng} kind="nickel" turn={turnAt(tt + 0.9, 10)} tt={tt + 0.4} light={0.6 + 0.4 * nickelIn} coinGlow={0.35 * nickelIn} /> : null}
      {hookPlate > 0 ? (
        <Placard x={pg.cx} y={pg.plateY} w={pg.plateW} opacity={hookPlate}>
          <PlateLabel spacing={3}>ONE CENT · RETIRED</PlateLabel>
          <div style={{ height: 2, background: "rgba(42,26,8,0.35)", margin: "8px 10px 6px" }} />
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
            <div style={{ flex: 0.8 }}>
              <PlateLabel>WORTH</PlateLabel>
              <PlateNumber>1¢</PlateNumber>
            </div>
            <div style={{ width: 2, alignSelf: "stretch", background: "rgba(42,26,8,0.3)", margin: "4px 0" }} />
            <div style={{ flex: 1.5, position: "relative" }}>
              <PlateLabel>COST TO MAKE</PlateLabel>
              <PlateNumber>3.69¢</PlateNumber>
              {underline > 0 ? (
                <svg width={300} height={30} style={{ position: "absolute", left: "50%", bottom: -12, translate: "-50% 0" }}>
                  <path d="M 10 18 Q 150 4 290 16" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" strokeDasharray={300} strokeDashoffset={300 * (1 - underline)} />
                </svg>
              ) : null}
            </div>
          </div>
        </Placard>
      ) : null}
      {sidePlate > 0 ? <SidePlate g={pg} kind="penny" cost="3.69¢" opacity={sidePlate} /> : null}
      {nickelIn > 0 ? <SidePlate g={ng} kind="nickel" cost="13.78¢" opacity={Math.min(1, nickelIn * 1.4)} pop={nickelPop} glow={Math.max(0, nickelPop - 1) * 6} /> : null}
      <Stanchions opacity={1 - Math.min(1, p * 2)} />
    </AbsoluteFill>
  );
};

/** Circular spotlight iris that opens over r (px) around (x, y). */
export const Iris: React.FC<{ r: number; x?: number; y?: number; children: React.ReactNode }> = ({ r, x = 480, y = 640, children }) => {
  if (r >= 2300) return <>{children}</>;
  return (
    <AbsoluteFill style={{ backgroundColor: "#03070E" }}>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>{children}</AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={x} cy={y} r={r} fill="none" stroke={SPOT} strokeWidth={10} opacity={0.55} />
        <circle cx={x} cy={y} r={r + 12} fill="none" stroke={SPOT} strokeWidth={18} opacity={0.12} />
      </svg>
    </AbsoluteFill>
  );
};

