import type { ReactNode } from "react";

export interface TooltipRow {
  label: string;
  value: string;
  /** Color swatch for the series. */
  color?: string;
}

export interface TooltipContent {
  title: string;
  subtitle?: string;
  rows: TooltipRow[];
  footer?: ReactNode;
}

interface RechartsTooltipProps<T> {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  render: (datum: T) => TooltipContent | null;
}

/** Frosted tooltip shared by every chart. `render` turns the hovered datum into text rows. */
export function ChartTooltip<T>({ active, payload, render }: RechartsTooltipProps<T>) {
  const datum = payload?.[0]?.payload as T | undefined;
  if (!active || datum === undefined) return null;
  const content = render(datum);
  if (!content) return null;
  return (
    <div className="glass min-w-44 rounded-xl border border-border-hover px-3.5 py-3 text-xs shadow-2xl shadow-shade/50">
      <p className="font-display text-[13px] font-semibold text-foreground">{content.title}</p>
      {content.subtitle ? <p className="mt-0.5 max-w-56 truncate text-muted-foreground">{content.subtitle}</p> : null}
      <dl className="mt-2.5 space-y-1.5">
        {content.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              {row.color ? <span className="size-2 rounded-full" style={{ background: row.color, boxShadow: `0 0 8px ${row.color}` }} /> : null}
              {row.label}
            </dt>
            <dd className="num font-display font-semibold text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      {content.footer ? <div className="mt-2.5 border-t border-border pt-2 text-muted-foreground">{content.footer}</div> : null}
    </div>
  );
}
