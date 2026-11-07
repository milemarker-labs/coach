import type { ActivitySummary } from "@coach/shared";
import { addDays, dayKeyOf, startOfWeek, type DayKey } from "./dates.ts";
import { inRange, summarize } from "./volume.ts";

export interface WeeklyTargetProgress {
  weekStart: DayKey;
  distance: number;
  target: number;
  /** 0..1, capped at 1. */
  fraction: number;
}

/** Distance covered in the current calendar week (Monday to today) against a target in meters. */
export function weeklyTargetProgress(activities: ActivitySummary[], today: DayKey, targetMeters: number): WeeklyTargetProgress {
  const weekStart = startOfWeek(today);
  const { distance } = summarize(inRange(activities, weekStart, today));
  return { weekStart, distance, target: targetMeters, fraction: targetMeters > 0 ? Math.min(distance / targetMeters, 1) : 0 };
}

export interface ConsistencySummary {
  /** Days with at least one activity in the last 7 days. */
  activeDays: number;
  /** Average active days per week over the 4 weeks before that. */
  baselineActiveDays: number | null;
  longest: ActivitySummary | null;
}

export function consistency(activities: ActivitySummary[], today: DayKey): ConsistencySummary {
  const weekFrom = addDays(today, -6);
  const week = inRange(activities, weekFrom, today);
  const baseline = inRange(activities, addDays(weekFrom, -28), addDays(weekFrom, -1));
  const longest = week.reduce<ActivitySummary | null>(
    (best, activity) => ((activity.distance ?? 0) > (best?.distance ?? 0) ? activity : best),
    null,
  );
  return {
    activeDays: new Set(week.map(dayKeyOf)).size,
    baselineActiveDays: baseline.length > 0 ? new Set(baseline.map(dayKeyOf)).size / 4 : null,
    longest: longest && (longest.distance ?? 0) > 0 ? longest : null,
  };
}
