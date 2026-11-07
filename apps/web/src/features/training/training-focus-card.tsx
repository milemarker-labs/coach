import type { ActivitySummary } from "@coach/shared";
import { Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { consistency } from "@/features/analytics/calculations/focus.ts";
import { diffDays, type DayKey } from "@/features/analytics/calculations/dates.ts";
import { formStatus, type FitnessSummary } from "@/features/analytics/calculations/load.ts";
import { api } from "@/lib/api.ts";
import { formatDistance } from "@/lib/format.ts";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="num mt-0.5 text-sm font-semibold text-platinum">{value}</dd>
    </div>
  );
}

/**
 * The athlete's stated objective (from their profile) with progress indicators that only
 * appear when there is a real target to measure against.
 */
export function TrainingFocusCard({
  activities,
  today,
  fitness,
  loading,
  className,
}: {
  activities: ActivitySummary[];
  today: DayKey;
  fitness: FitnessSummary | null;
  loading: boolean;
  className?: string;
}) {
  const { mode } = useDataMode();
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.profile, enabled: mode === "live" });
  const summary = consistency(activities, today);
  const goal = profile.data;
  const daysToRace = goal?.targetRaceDate ? diffDays(goal.targetRaceDate, today) : null;
  const availability = goal?.weeklyAvailabilityDays ?? null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Training focus</CardTitle>
        <Target className="size-4 text-titanium" aria-hidden="true" />
      </CardHeader>
      <CardContent className="mt-3 space-y-4">
        {loading || (mode === "live" && profile.isLoading) ? (
          <div className="space-y-3" role="status" aria-label="Loading training focus">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div>
              {goal?.raceGoal ? (
                <>
                  <p className="text-sm font-semibold text-platinum">{goal.raceGoal}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {goal.targetDistanceMeters ? <span className="num">{formatDistance(goal.targetDistanceMeters)}</span> : null}
                    {daysToRace != null ? (
                      daysToRace >= 0 ? <Badge tone="bronze" className="num">{daysToRace} days to go</Badge> : <Badge>Race date passed</Badge>
                    ) : null}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-platinum">{mode === "live" ? "No objective set" : "Demo athlete"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {mode === "live" ? (
                      <>
                        Add a race goal in <Link to="/settings" className="text-primary underline-offset-2 hover:underline">Settings</Link> to track progress toward it.
                      </>
                    ) : (
                      "Connect Strava and set a race goal to see your own focus."
                    )}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Active days, last 7</span>
                <span className="num font-semibold text-platinum">
                  {summary.activeDays}
                  {availability != null ? ` of ${availability}` : ""}
                </span>
              </div>
              {availability != null && availability > 0 ? (
                <Progress value={summary.activeDays / availability} label="Active days against weekly availability" />
              ) : (
                <p className="text-xs text-muted-foreground">Set your weekly availability in Settings to measure this against a target.</p>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3">
              <Stat label="Longest, 7 days" value={summary.longest ? formatDistance(summary.longest.distance) : "—"} />
              <Stat label="Usual active days" value={summary.baselineActiveDays != null ? summary.baselineActiveDays.toFixed(1) : "—"} />
              <Stat label="Form" value={fitness ? formStatus(fitness.current.form).label : "—"} />
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
