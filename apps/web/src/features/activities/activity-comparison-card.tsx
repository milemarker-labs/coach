import { formatEffort, type ActivitySummary } from "@coach/shared";
import { GitCompareArrows } from "lucide-react";
import { Delta, makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { compareActivity, similarActivities, type ComparisonMetric } from "@/features/analytics/calculations/compare.ts";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format.ts";
import { activitySport } from "./activity-meta.tsx";

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

/** This activity against earlier ones of the same sport and a similar distance. */
export function ActivityComparisonCard({ activity, history, loading, className }: { activity: ActivitySummary; history: ActivitySummary[]; loading: boolean; className?: string }) {
  const similar = similarActivities(activity, history);
  const comparison = compareActivity(activity, similar);
  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle>Compared with similar activities</CardTitle>
          <CardDescription>
            {comparison ? `Average of ${comparison.sample} earlier ${comparison.sample === 1 ? "activity" : "activities"} within 25% of this distance` : "Same sport, similar distance"}
          </CardDescription>
        </div>
        <GitCompareArrows className="size-4 text-titanium" aria-hidden="true" />
      </CardHeader>
      <CardContent className="mt-3">
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading comparison">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : !comparison ? (
          <EmptyState icon={GitCompareArrows} title="Nothing to compare yet" description="Coach needs at least one earlier activity of the same sport at a similar distance." className="py-6" />
        ) : (
          <>
            {comparison.speedRank ? (
              <p className="mb-3 rounded-lg bg-primary-subtle px-3 py-2 text-xs text-platinum">
                <span className="num font-semibold">{ordinal(comparison.speedRank.position)}</span> fastest of {comparison.speedRank.of} similar activities
              </p>
            ) : null}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 text-right font-medium">This</th>
                  <th className="pb-2 text-right font-medium">Average</th>
                  <th className="pb-2 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.metrics.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row" className="py-2 pr-2 text-left font-normal text-muted-foreground">{metric.label}</th>
                    <td className="num py-2 text-right font-medium text-platinum">{formatMetric(activity, metric.key, metric.current)}</td>
                    <td className="num py-2 text-right text-muted-foreground">{formatMetric(activity, metric.key, metric.baseline)}</td>
                    <td className="py-2 text-right">
                      <Delta delta={makeDelta(metric.change, { suffix: "%", goodWhen: metric.key === "speed" ? "up" : "none" })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
