import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
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
  className?: string;
}

export function MetricCard({ label, value, unit, icon: Icon, delta, hint, loading, unavailableHint = "No data yet", aside, className }: MetricCardProps) {
  return (
    <Card className={cn("flex min-w-0 flex-col gap-2 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {Icon ? <Icon className="size-3.5 shrink-0 text-titanium" aria-hidden="true" /> : null}
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
            <span className={cn("num text-[28px] leading-9 font-bold tracking-tight", value == null && "text-faint")}>{value ?? "—"}</span>
            {value != null && unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
            {value != null && delta ? <Delta delta={delta} className="ml-1" /> : null}
          </div>
          <p className="min-h-4 truncate text-xs text-muted-foreground">{value == null ? unavailableHint : hint}</p>
        </>
      )}
    </Card>
  );
}
