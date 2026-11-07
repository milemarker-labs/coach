import { effortKind, sportKey, type ActivitySummary, type EffortKind } from "@coach/shared";
import { dayKeyOf, type DayKey } from "./dates.ts";

export interface EffortPoint {
  id: string;
  name: string;
  day: DayKey;
  /** Seconds per km for pace, seconds per 100 m for swim pace, km/h for speed. */
  value: number;
  trend: number | null;
  distance: number;
  averageHeartrate: number | null;
}

export interface EffortSeries {
  kind: EffortKind;
  points: EffortPoint[];
}

export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, index) => {
    if (index < window - 1) return null;
    const slice = values.slice(index - window + 1, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

function effortValue(kind: EffortKind, speed: number): number {
  if (kind === "pace") return 1000 / speed;
  if (kind === "swim-pace") return 100 / speed;
  return speed * 3.6;
}

/**
 * Pace (or speed) of each activity of one sport, oldest first, with a rolling average.
 * Activities without a speed or with under 1 km are skipped so warm-ups and stubs do not skew the line.
 */
export function effortSeries(activities: ActivitySummary[], sport: string, trendWindow = 5): EffortSeries {
  const kind = effortKind(sport);
  const rows = activities
    .filter((activity) => {
      if (sportKey(activity.sportType, activity.activityType) !== sport) return false;
      if (kind === "duration") return false;
      return (activity.averageSpeed ?? 0) > 0 && (activity.distance ?? 0) >= 1000;
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const values = rows.map((activity) => effortValue(kind, activity.averageSpeed ?? 1));
  const trend = movingAverage(values, trendWindow);
  return {
    kind,
    points: rows.map((activity, index) => ({
      id: activity.id,
      name: activity.name ?? "Untitled activity",
      day: dayKeyOf(activity),
      value: values[index] ?? 0,
      trend: trend[index] ?? null,
      distance: activity.distance ?? 0,
      averageHeartrate: activity.averageHeartrate,
    })),
  };
}

export interface HeartRatePoint {
  id: string;
  name: string;
  day: DayKey;
  average: number;
  max: number | null;
  trend: number | null;
}

/** Average and max heart rate per activity, oldest first. `sport` null means every sport. */
export function heartRateSeries(activities: ActivitySummary[], sport: string | null, trendWindow = 5): HeartRatePoint[] {
  const rows = activities
    .filter((activity) => (activity.averageHeartrate ?? 0) > 0)
    .filter((activity) => sport == null || sportKey(activity.sportType, activity.activityType) === sport)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const averages = rows.map((activity) => activity.averageHeartrate ?? 0);
  const trend = movingAverage(averages, trendWindow);
  return rows.map((activity, index) => ({
    id: activity.id,
    name: activity.name ?? "Untitled activity",
    day: dayKeyOf(activity),
    average: averages[index] ?? 0,
    max: activity.maxHeartrate,
    trend: trend[index] ?? null,
  }));
}
