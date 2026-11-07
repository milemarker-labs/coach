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

/** Dark tooltip surface shared by every chart. `render` turns the hovered datum into text rows. */
export function ChartTooltip<T>({ active, payload, render }: RechartsTooltipProps<T>) {
  const datum = payload?.[0]?.payload as T | undefined;
  if (!active || datum === undefined) return null;
  const content = render(datum);
  if (!content) return null;
  return (
    <div className="min-w-40 rounded-lg border border-border-hover bg-surface-2 px-3 py-2.5 text-xs shadow-xl shadow-black/40">
      <p className="font-semibold text-foreground">{content.title}</p>
      {content.subtitle ? <p className="mt-0.5 max-w-56 truncate text-muted-foreground">{content.subtitle}</p> : null}
      <dl className="mt-2 space-y-1">
        {content.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              {row.color ? <span className="size-2 rounded-full" style={{ background: row.color }} /> : null}
              {row.label}
            </dt>
            <dd className="num font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      {content.footer ? <div className="mt-2 border-t border-border pt-2 text-muted-foreground">{content.footer}</div> : null}
    </div>
  );
}
