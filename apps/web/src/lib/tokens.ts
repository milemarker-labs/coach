/** Chart colors, resolved from the CSS variables declared in index.css. */
export const chartColors = {
  /** Primary series: brand. */
  primary: "var(--brand)",
  /** Secondary series: pulse. */
  secondary: "var(--pulse)",
  /** Third series: flow. */
  tertiary: "var(--flow)",
  positive: "var(--success)",
  negative: "var(--danger)",
  warning: "var(--warning)",
  grid: "var(--grid)",
  tick: "var(--text-muted)",
  cursor: "rgb(var(--line-rgb)/0.35)",
  surface: "var(--surface)",
} as const;

export const chartAxis = {
  tick: { fill: chartColors.tick, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Charts draw in once, quickly, and never for reduced-motion users. */
export const chartMotion = {
  isAnimationActive: !reducedMotion,
  animationDuration: 900,
  animationEasing: "ease-out",
} as const;
