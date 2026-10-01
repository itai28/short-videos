import React from "react";
import { rand } from "../../visuals/util";

/** Original overhead pizza in SVG. d = diameter in px; seed varies the toppings. */
export const Pizza: React.FC<{
  d: number;
  seed?: number;
  slices?: number;
  glow?: string;
  dim?: number;
  style?: React.CSSProperties;
}> = ({ d, seed = 1, slices = 8, glow, dim = 0, style }) => {
  const r = 100;
  const toppings = Array.from({ length: 18 }).map((_, i) => {
    const a = rand(seed * 31 + i) * Math.PI * 2;
    const rr = Math.sqrt(rand(seed * 17 + i * 3)) * 66;
    return { x: 100 + Math.cos(a) * rr, y: 100 + Math.sin(a) * rr, k: rand(seed + i * 7) };
  });
  return (
    <svg width={d} height={d} viewBox="0 0 200 200" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 18px ${glow})` : "drop-shadow(0 10px 14px rgba(0,0,0,0.45))", ...style }}>
      <defs>
        <radialGradient id={`crust${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#F2B36B" />
          <stop offset="92%" stopColor="#D98B3F" />
          <stop offset="100%" stopColor="#B8692A" />
        </radialGradient>
        <radialGradient id={`cheese${seed}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFE9A3" />
          <stop offset="70%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F5B93F" />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={r} fill={`url(#crust${seed})`} />
      <circle cx={100} cy={100} r={84} fill="#D7432F" />
      <circle cx={100} cy={100} r={80} fill={`url(#cheese${seed})`} />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={`b${i}`} cx={100 + (rand(seed + i * 11) - 0.5) * 120} cy={100 + (rand(seed + i * 13) - 0.5) * 120} r={6 + rand(seed + i) * 8} fill="#FFF3C4" opacity={0.55} />
      ))}
      {toppings.map((p, i) =>
        p.k < 0.62 ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={9} fill="#B3261E" />
            <circle cx={p.x - 2} cy={p.y - 2} r={3} fill="#D9534A" />
          </g>
        ) : p.k < 0.82 ? (
          <ellipse key={i} cx={p.x} cy={p.y} rx={7} ry={4} fill="#3E8E41" transform={`rotate(${p.k * 360} ${p.x} ${p.y})`} />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="none" stroke="#2b2b2b" strokeWidth={3} />
        ),
      )}
      {Array.from({ length: slices }).map((_, i) => {
        const a = (i / slices) * Math.PI * 2;
        return <line key={`s${i}`} x1={100} y1={100} x2={100 + Math.cos(a) * 86} y2={100 + Math.sin(a) * 86} stroke="rgba(120,60,20,0.35)" strokeWidth={1.5} />;
      })}
      {dim > 0 && <circle cx={100} cy={100} r={r} fill="#000" opacity={dim} />}
    </svg>
  );
};

/** Overhead red-check tablecloth, full frame. */
export const Table: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: "#FFF3E3",
      backgroundImage:
        "linear-gradient(90deg, rgba(214,48,39,0.55) 50%, transparent 50%), linear-gradient(rgba(214,48,39,0.55) 50%, transparent 50%)",
      backgroundSize: "120px 120px",
      backgroundPosition: `${Math.sin(t * 0.3) * 6}px 0px`,
    }}
  >
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 48% 42%, rgba(0,0,0,0) 35%, rgba(40,10,5,0.55) 100%)" }} />
  </div>
);
