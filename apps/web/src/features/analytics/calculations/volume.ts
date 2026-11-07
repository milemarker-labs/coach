import type { ActivitySummary } from "@coach/shared";
import { addDays, addMonths, dayKeyOf, formatDayShort, formatMonthShort, startOfMonth, startOfWeek, type DayKey } from "./dates.ts";

export interface Totals {
  count: number;
  distance: number;
  movingTime: number;
  elevation: number;
}

export interface VolumeBucket extends Totals {
  /** First day of the week or month. */
  key: DayKey;
  label: string;
}

export type BucketUnit = "week" | "month";

export function summarize(activities: ActivitySummary[]): Totals {
  const totals: Totals = { count: 0, distance: 0, movingTime: 0, elevation: 0 };
  for (const activity of activities) {
    totals.count += 1;
    totals.distance += activity.distance ?? 0;
    totals.movingTime += activity.movingTime ?? 0;
    totals.elevation += activity.totalElevationGain ?? 0;
  }
  return totals;
}

/** Activities whose local day falls in the inclusive range. */
export function inRange(activities: ActivitySummary[], from: DayKey, to: DayKey): ActivitySummary[] {
  return activities.filter((activity) => {
    const day = dayKeyOf(activity);
    return day >= from && day <= to;
  });
}

/** Buckets cover every week or month in the range, including empty ones. */
export function bucketVolume(activities: ActivitySummary[], unit: BucketUnit, from: DayKey, to: DayKey): VolumeBucket[] {
  const first = unit === "week" ? startOfWeek(from) : startOfMonth(from);
  const step = (key: DayKey) => (unit === "week" ? addDays(key, 7) : addMonths(key, 1));
  const buckets = new Map<DayKey, VolumeBucket>();
  for (let cursor = first; cursor <= to; cursor = step(cursor)) {
    buckets.set(cursor, {
      key: cursor,
      label: unit === "week" ? formatDayShort(cursor) : formatMonthShort(cursor),
      count: 0,
      distance: 0,
      movingTime: 0,
      elevation: 0,
    });
  }
  for (const activity of activities) {
    const day = dayKeyOf(activity);
    if (day < from || day > to) continue;
    const bucket = buckets.get(unit === "week" ? startOfWeek(day) : startOfMonth(day));
    if (!bucket) continue;
    bucket.count += 1;
    bucket.distance += activity.distance ?? 0;
    bucket.movingTime += activity.movingTime ?? 0;
    bucket.elevation += activity.totalElevationGain ?? 0;
  }
  return [...buckets.values()];
}

export interface WindowComparison {
  current: Totals;
  previous: Totals;
  currentFrom: DayKey;
  previousFrom: DayKey;
}

/** The last `days` days ending today, against the same number of days before that. */
export function compareWindows(activities: ActivitySummary[], today: DayKey, days = 7): WindowComparison {
  const currentFrom = addDays(today, -(days - 1));
  const previousFrom = addDays(currentFrom, -days);
  return {
    current: summarize(inRange(activities, currentFrom, today)),
    previous: summarize(inRange(activities, previousFrom, addDays(currentFrom, -1))),
    currentFrom,
    previousFrom,
  };
}

/** Percent change, or null when there is no baseline to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Average weekly distance over the `weeks` weeks (28 days by default) before the latest 7-day window. */
export function baselineWeeklyDistance(activities: ActivitySummary[], today: DayKey, weeks = 4): number | null {
  const windowStart = addDays(today, -6);
  const from = addDays(windowStart, -weeks * 7);
  const rows = inRange(activities, from, addDays(windowStart, -1));
  if (rows.length === 0) return null;
  return summarize(rows).distance / weeks;
}
