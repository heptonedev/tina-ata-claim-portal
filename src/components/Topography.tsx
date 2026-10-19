import { useMemo } from "react";

// 지도 등고선. 매번 같은 모양이 나오도록 고정 시드로 만든 정적 SVG.
const HILLS = [
  { cx: 1120, cy: 180, rings: 9, step: 34, wobble: 0.18, seed: 1.7 },
  { cx: 180, cy: 760, rings: 11, step: 30, wobble: 0.22, seed: 4.2 },
  { cx: 760, cy: 980, rings: 7, step: 38, wobble: 0.15, seed: 2.9 },
];

function ringPath(cx: number, cy: number, r: number, wobble: number, seed: number): string {
  const points = 72;
  let d = "";
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const k = 1 + wobble * (0.55 * Math.sin(3 * t + seed) + 0.3 * Math.sin(5 * t + seed * 1.9) + 0.15 * Math.sin(9 * t + seed * 0.7));
    const x = cx + Math.cos(t) * r * k * 1.25;
    const y = cy + Math.sin(t) * r * k;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

export default function Topography() {
  const paths = useMemo(
    () =>
      HILLS.flatMap((h) =>
        Array.from({ length: h.rings }, (_, i) => ({
          d: ringPath(h.cx, h.cy, (i + 1) * h.step, h.wobble * (1 + i * 0.05), h.seed + i * 0.35),
          index: i,
        })),
      ),
    [],
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="var(--color-contour)"
          strokeWidth={p.index % 4 === 3 ? 1.4 : 0.8}
          opacity={p.index % 4 === 3 ? 0.7 : 0.45}
        />
      ))}
    </svg>
  );
}
