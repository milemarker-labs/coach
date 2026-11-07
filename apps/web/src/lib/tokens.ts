/** Chart colors, resolved from the CSS variables declared in index.css. */
export const chartColors = {
  /** Primary series: champagne bronze. */
  primary: "var(--bronze)",
  /** Secondary series: titanium. */
  secondary: "var(--titanium)",
  /** Third series: muted steel blue. */
  tertiary: "var(--info)",
  positive: "var(--success)",
  negative: "var(--danger)",
  warning: "var(--warning)",
  grid: "var(--grid)",
  tick: "var(--text-muted)",
  cursor: "rgba(182, 191, 194, 0.35)",
  surface: "var(--surface)",
} as const;

export const chartAxis = {
  tick: { fill: chartColors.tick, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;
