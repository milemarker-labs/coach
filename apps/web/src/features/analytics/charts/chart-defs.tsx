import { useId } from "react";

/** Unique ids for one chart's SVG defs, so two charts on a page never share a gradient. */
export function useChartIds() {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return {
    area: `${base}-area`,
    bar: `${base}-bar`,
    barMuted: `${base}-bar-muted`,
    glow: `${base}-glow`,
    line: `${base}-line`,
  };
}

/**
 * Gradients and a glow filter shared by the charts. Render inside a Recharts chart:
 * Recharts passes `<defs>` straight through to the SVG.
 */
export function ChartDefs({ ids, color = "var(--brand)", mutedColor = "var(--brand)" }: { ids: ReturnType<typeof useChartIds>; color?: string; mutedColor?: string }) {
  return (
    <defs>
      <linearGradient id={ids.area} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.22} />
        <stop offset="65%" stopColor={color} stopOpacity={0.03} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
      <linearGradient id={ids.bar} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={color} stopOpacity={0.55} />
      </linearGradient>
      <linearGradient id={ids.barMuted} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={mutedColor} stopOpacity={0.38} />
        <stop offset="100%" stopColor={mutedColor} stopOpacity={0.1} />
      </linearGradient>
      <linearGradient id={ids.line} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--pulse)" />
        <stop offset="55%" stopColor="var(--flow)" />
        <stop offset="100%" stopColor="var(--brand)" />
      </linearGradient>
      <filter id={ids.glow} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Active dot with a soft halo. */
export function haloDot(color: string, r = 5) {
  return { r, fill: color, stroke: "var(--bg)", strokeWidth: 2.5, style: { filter: `drop-shadow(0 0 6px ${color})` } };
}
