import type { ActivitySummary } from "@coach/shared";
import { Flag, Target } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { consistency } from "@/features/analytics/calculations/focus.ts";
import { addDays, dayKeyOf, diffDays, formatWeekday, type DayKey } from "@/features/analytics/calculations/dates.ts";
import { formStatus, type FitnessSummary } from "@/features/analytics/calculations/load.ts";
import { useProfile } from "@/features/score/use-marker.ts";
import { formatDistance } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="num mt-0.5 font-display text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/** Seven dots, one per day, lit where something was logged. Today is the last dot. */
function WeekStrip({ activities, today }: { activities: ActivitySummary[]; today: DayKey }) {
  const reduce = useReducedMotion();
  const active = new Set(activities.map(dayKeyOf));
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Active days in the last 7">
      {days.map((day, index) => {
        const on = active.has(day);
        return (
          <li key={day} className="flex flex-col items-center gap-1.5">
            <motion.span
              className={cn(
                "h-9 w-full rounded-lg",
                on ? "bg-gradient-to-t from-pulse/70 via-flow/70 to-primary shadow-[0_0_14px_-2px_rgb(var(--flow-rgb)/0.5)]" : "bg-surface-2 ring-1 ring-border ring-inset",
              )}
              initial={{ scaleY: 0.2, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ originY: 1 }}
              transition={{ delay: reduce ? 0 : 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 22 }}
            />
            <span className={cn("text-[10px]", day === today ? "font-semibold text-foreground" : "text-faint")}>{formatWeekday(day).slice(0, 2)}</span>
            <span className="sr-only">{on ? "active" : "rest"}</span>
          </li>
        );
      })}
    </ol>
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
  const profile = useProfile();
  const summary = consistency(activities, today);
  const goal = profile.data;
  const daysToRace = goal?.targetRaceDate ? diffDays(goal.targetRaceDate, today) : null;
  const availability = goal?.weeklyAvailabilityDays ?? null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Training focus</CardTitle>
        <span className="grid size-7 place-items-center rounded-lg bg-primary-subtle text-primary" aria-hidden="true">
          <Target className="size-3.5" />
        </span>
      </CardHeader>
      <CardContent className="mt-3 space-y-5">
        {loading || (mode === "live" && profile.isLoading) ? (
          <div className="space-y-3" role="status" aria-label="Loading training focus">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {goal?.raceGoal ? (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-primary/[0.08] to-transparent p-3 ring-1 ring-primary/15 ring-inset">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    <Flag className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {goal.raceGoal}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{goal.targetDistanceMeters ? <span className="num">{formatDistance(goal.targetDistanceMeters)}</span> : "Race goal"}</p>
                </div>
                {daysToRace != null ? (
                  daysToRace >= 0 ? (
                    <div className="text-right">
                      <AnimatedNumber value={daysToRace} className="font-display text-2xl leading-none font-semibold text-primary" />
                      <p className="text-[11px] text-muted-foreground">days to go</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Race date passed</span>
                  )
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-foreground">{mode === "live" ? "No objective set" : "Demo athlete"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mode === "live" ? (
                    <>
                      Add a race goal in{" "}
                      <Link to="/settings" className="text-primary underline-offset-2 hover:underline">
                        Settings
                      </Link>{" "}
                      and the directions will taper you into it.
                    </>
                  ) : (
                    "Connect Strava and set a race goal to see your own focus."
                  )}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Active days, last 7</span>
                <span className="num font-semibold text-foreground">
                  {summary.activeDays}
                  {availability != null ? ` of ${availability}` : ""}
                </span>
              </div>
              <WeekStrip activities={activities} today={today} />
              {availability != null && availability > 0 ? <Progress value={summary.activeDays / availability} label="Active days against weekly availability" /> : null}
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
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
