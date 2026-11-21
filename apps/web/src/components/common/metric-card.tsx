import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AnimatedValue } from "@/components/motion/animated-number.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { Delta, type DeltaValue } from "./delta.tsx";

export interface MetricCardProps {
  label: string;
  /** Pre-formatted value. `null` means the metric is unavailable. */
  value: string | null;
  unit?: string;
  icon?: LucideIcon;
  delta?: DeltaValue | null;
  /** Small line below the value, e.g. what the delta compares against. */
  hint?: ReactNode;
  loading?: boolean;
  /** Shown instead of the hint when there is no value. */
  unavailableHint?: string;
  /** Right-aligned content next to the label, e.g. a status badge. */
  aside?: ReactNode;
  /** Accent for the icon chip and the hover glow. */
  accent?: "brand" | "pulse" | "flow" | "trail";
  className?: string;
}

const accents = {
  brand: "text-primary bg-primary-subtle",
  pulse: "text-pulse bg-pulse-subtle",
  flow: "text-flow bg-flow/10",
  trail: "text-trail bg-trail/10",
} as const;

export function MetricCard({ label, value, unit, icon: Icon, delta, hint, loading, unavailableHint = "No data yet", aside, accent = "brand", className }: MetricCardProps) {
  return (
    <Card className={cn("group/metric flex min-w-0 flex-col gap-2.5 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {Icon ? (
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-md transition-transform duration-300 group-hover/metric:scale-110 group-hover/metric:-rotate-6", accents[accent])}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </div>
        {aside}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            {value == null ? (
              <span className="font-display text-[30px] leading-9 font-semibold text-faint">—</span>
            ) : (
              <AnimatedValue text={value} className="font-display text-[30px] leading-9 font-semibold tracking-tight" />
            )}
            {value != null && unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
            {value != null && delta ? <Delta delta={delta} className="ml-1" /> : null}
          </div>
          <p className="min-h-4 truncate text-xs text-muted-foreground">{value == null ? unavailableHint : hint}</p>
        </>
      )}
    </Card>
  );
}
