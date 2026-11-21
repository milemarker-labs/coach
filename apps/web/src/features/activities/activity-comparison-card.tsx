import { formatEffort, type ActivitySummary } from "@coach/shared";
import { GitCompareArrows, Medal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Delta, makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { compareActivity, similarActivities, type ComparisonMetric } from "@/features/analytics/calculations/compare.ts";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { activitySport, sportTheme } from "./activity-meta.tsx";

const EASE = [0.16, 1, 0.3, 1] as const;

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

function formatMetric(activity: ActivitySummary, metric: ComparisonMetric["key"], value: number): string {
  switch (metric) {
    case "speed":
      return formatEffort(activitySport(activity), value).value;
    case "heartrate":
      return `${Math.round(value)} bpm`;
    case "distance":
      return formatDistance(value);
    case "elevation":
      return formatElevation(value);
    case "time":
      return formatDuration(value);
  }
}

/** Where this session placed by speed, as a row of markers with this one lit. */
function RankStrip({ position, of, color }: { position: number; of: number; color: string }) {
  const reduce = useReducedMotion();
  const shown = Math.min(of, 12);
  const lit = Math.min(position, shown) - 1;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/40 px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }} aria-hidden="true">
        <Medal className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="num font-display text-lg font-semibold">{ordinal(position)}</span> fastest of {of} similar sessions
        </p>
        {of <= 12 ? (
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: shown }, (_, index) => (
              <motion.span
                key={index}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: index === lit ? color : "var(--surface-3)", boxShadow: index === lit ? `0 0 10px ${color}` : undefined }}
                initial={reduce ? false : { opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** This activity against earlier ones of the same sport and a similar distance. */
export function ActivityComparisonCard({ activity, history, loading, className }: { activity: ActivitySummary; history: ActivitySummary[]; loading: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const similar = similarActivities(activity, history);
  const comparison = compareActivity(activity, similar);
  const color = sportTheme(activitySport(activity)).color;
  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle>Compared with similar sessions</CardTitle>
          <CardDescription>
            {comparison ? `Average of ${comparison.sample} earlier ${comparison.sample === 1 ? "activity" : "activities"} within 25% of this distance` : "Same sport, similar distance"}
          </CardDescription>
        </div>
        <GitCompareArrows className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="mt-4">
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading comparison">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !comparison ? (
          <EmptyState icon={GitCompareArrows} title="Nothing to compare yet" description="Coach needs at least one earlier activity of the same sport at a similar distance." className="py-6" />
        ) : (
          <div className="space-y-4">
            {comparison.speedRank ? <RankStrip position={comparison.speedRank.position} of={comparison.speedRank.of} color={color} /> : null}
            <ul className="space-y-3.5">
              {comparison.metrics.map((metric, index) => {
                const max = Math.max(metric.current, metric.baseline, 1);
                return (
                  <li key={metric.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="num font-display font-semibold text-foreground">{formatMetric(activity, metric.key, metric.current)}</span>
                        <Delta delta={makeDelta(metric.change, { suffix: "%", goodWhen: metric.key === "speed" ? "up" : "none" })} />
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1" aria-hidden="true">
                      {[
                        { value: metric.current, fill: color, glow: true },
                        { value: metric.baseline, fill: "var(--text-muted)", glow: false },
                      ].map((bar, barIndex) => (
                        <div key={barIndex} className={cn("overflow-hidden rounded-full bg-surface-3/50", barIndex === 0 ? "h-1.5" : "h-1")}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: bar.fill, boxShadow: bar.glow ? `0 0 10px color-mix(in oklab, ${bar.fill} 60%, transparent)` : undefined }}
                            initial={reduce ? false : { width: 0 }}
                            animate={{ width: `${(bar.value / max) * 100}%` }}
                            transition={{ delay: 0.15 + index * 0.08 + barIndex * 0.05, duration: 0.9, ease: EASE }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="num mt-1 text-[11px] text-faint">Average {formatMetric(activity, metric.key, metric.baseline)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
