import type { ScoreTrendPoint } from "@coach/shared";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { formatDayShort } from "@/features/analytics/calculations/dates.ts";
import { cn } from "@/lib/utils.ts";

const WIDTH = 600;
const PAD_TOP = 10;
const PAD_BOTTOM = 4;

/** Smooth path through the points (monotone-ish cubic). */
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  let d = `M${points[0]![0].toFixed(1)} ${points[0]![1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const mid = (x0 + x1) / 2;
    d += ` C${mid.toFixed(1)} ${y0.toFixed(1)} ${mid.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

/** The Marker over time. Draws itself in, and reads out the value under the pointer. */
export function MarkerTrend({ points, height = 88, className }: { points: ScoreTrendPoint[]; height?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((p) => p.value);
    const min = Math.max(0, Math.min(...values) - 8);
    const max = Math.min(100, Math.max(...values) + 8);
    const span = Math.max(max - min, 10);
    const x = (i: number) => (i / (points.length - 1)) * WIDTH;
    const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * (height - PAD_TOP - PAD_BOTTOM);
    const coords = points.map((p, i) => [x(i), y(p.value)] as [number, number]);
    const line = smoothPath(coords);
    return { line, area: `${line} L${WIDTH} ${height} L0 ${height} Z`, coords };
  }, [points, height]);

  if (!geometry) {
    return <div className={cn("grid place-items-center text-xs text-muted-foreground", className)} style={{ height }}>A trend appears after a few days of history.</div>;
  }

  const active = hover != null ? points[hover] : null;
  const activeCoord = hover != null ? geometry.coords[hover] : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="block w-full touch-none"
        style={{ height }}
        role="img"
        aria-label={`Trend over ${points.length} days, from ${points[0]!.value} to ${points.at(-1)!.value}.`}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          setHover(Math.round(Math.min(Math.max(ratio, 0), 1) * (points.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--pulse)" />
            <stop offset="60%" stopColor="var(--flow)" />
            <stop offset="100%" stopColor="var(--brand)" />
          </linearGradient>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--flow)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--flow)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={geometry.area}
          fill={`url(#${id}-fill)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, delay: reduce ? 0 : 0.6 }}
        />
        <motion.path
          d={geometry.line}
          fill="none"
          stroke={`url(#${id}-stroke)`}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {activeCoord ? <line x1={activeCoord[0]} x2={activeCoord[0]} y1={0} y2={height} stroke="var(--border-hover)" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      {active && activeCoord ? (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border-hover bg-surface-2 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl shadow-shade/40"
          style={{ left: `${(activeCoord[0] / WIDTH) * 100}%` }}
        >
          <span className="num font-display text-sm font-semibold text-foreground">{active.value}</span>
          <span className="ml-1.5 text-muted-foreground">{formatDayShort(active.day)}</span>
        </div>
      ) : null}
      {activeCoord ? (
        <span
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-4 ring-primary/30"
          style={{ left: `${(activeCoord[0] / WIDTH) * 100}%`, top: activeCoord[1] }}
        />
      ) : null}
    </div>
  );
}
