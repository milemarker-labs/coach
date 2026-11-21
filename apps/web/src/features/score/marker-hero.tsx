import type { MarkerScore } from "@coach/shared";
import { ArrowDownRight, ArrowUpRight, Minus, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { DirectionsList } from "./directions-list.tsx";
import { MarkerBreakdown } from "./marker-breakdown.tsx";
import { MarkerExplainer } from "./marker-explainer.tsx";
import { MarkerRing } from "./marker-ring.tsx";
import { MarkerTrend } from "./marker-trend.tsx";
import { TodayCallCard } from "./today-call.tsx";

export function WeekChange({ delta, className }: { delta: number | null; className?: string }) {
  if (delta == null) return null;
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "num mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        delta > 0 ? "bg-success/12 text-success" : delta < 0 ? "bg-danger/12 text-danger" : "bg-surface-2 text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {delta > 0 ? "+" : delta < 0 ? "−" : ""}
      {Math.abs(delta)} this week
    </span>
  );
}

const confidenceCopy = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence: needs more history",
} as const;

/** The score, its parts, and its trend in one panel. Used on the dashboard and the training page. */
export function MarkerPanel({ marker, detailed = false, className }: { marker: MarkerScore; detailed?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border bg-card/70 p-5 sm:p-6", className)}>
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-40 mask-radial" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-pulse/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <h2 className="font-display text-base font-semibold whitespace-nowrap">Your {marker.name}</h2>
          <Badge tone={marker.confidence === "high" ? "success" : marker.confidence === "medium" ? "neutral" : "warning"} className="gap-1">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {confidenceCopy[marker.confidence]}
          </Badge>
        </div>
        <MarkerExplainer />
      </div>

      <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)] items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="mx-auto">
          <MarkerRing value={marker.value} label={marker.band.label} caption="Fitness" size={216}>
            <WeekChange delta={marker.delta7} />
          </MarkerRing>
        </div>
        <MarkerBreakdown components={marker.components} compact={!detailed} />
      </div>

      <div className="relative mt-5 border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Last {marker.trend.length} days</span>
          <span className="num">
            {marker.trend[0]?.value ?? "—"} → <span className="font-semibold text-foreground">{marker.value}</span>
          </span>
        </div>
        <MarkerTrend points={marker.trend} height={72} />
      </div>
    </div>
  );
}

/** Dashboard opener: the number on the left, what to do about it on the right. */
export function MarkerHero({ marker, loading, className }: { marker: MarkerScore | null; loading: boolean; className?: string }) {
  if (loading || !marker) {
    return (
      <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]", className)} role="status" aria-label="Loading your score">
        <Skeleton className="h-[25rem] rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]", className)}>
      <MarkerPanel marker={marker} />
      <div className="flex flex-col gap-4">
        <TodayCallCard call={marker.call} />
        <motion.div
          className="rounded-2xl border border-border bg-card/70 p-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Directions</p>
          <DirectionsList directions={marker.directions} />
        </motion.div>
      </div>
    </div>
  );
}
