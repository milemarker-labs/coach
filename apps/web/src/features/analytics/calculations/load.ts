import type { ActivitySummary } from "@coach/shared";
import { addDays, dayKeyOf, diffDays, eachDay, type DayKey } from "./dates.ts";

/**
 * Training load.
 *
 * Strava does not give Coach a load number for every activity, so load comes from two sources:
 *  - `effort`: the Strava suffer score, when the activity has one (needs heart rate data).
 *  - `estimated`: one point per moving minute, for activities without a suffer score.
 *
 * Both are surfaced separately so the interface can say how much of a number is estimated.
 */
export const ESTIMATED_POINTS_PER_MINUTE = 1;
export const CTL_DAYS = 42;
export const ATL_DAYS = 7;

export type LoadBasis = "effort" | "estimated";

export interface ActivityLoad {
  value: number;
  basis: LoadBasis;
}

export function activityLoad(activity: Pick<ActivitySummary, "sufferScore" | "movingTime">): ActivityLoad | null {
  if (activity.sufferScore != null && activity.sufferScore > 0) return { value: activity.sufferScore, basis: "effort" };
  if (activity.movingTime != null && activity.movingTime > 0) {
    return { value: (activity.movingTime / 60) * ESTIMATED_POINTS_PER_MINUTE, basis: "estimated" };
  }
  return null;
}

export interface DailyLoad {
  day: DayKey;
  load: number;
  /** Portion of `load` that comes from Strava suffer scores. */
  effort: number;
  estimated: number;
  count: number;
}

export function dailyLoad(activities: ActivitySummary[], from: DayKey, to: DayKey): DailyLoad[] {
  const days = new Map<DayKey, DailyLoad>(
    eachDay(from, to).map((day) => [day, { day, load: 0, effort: 0, estimated: 0, count: 0 }]),
  );
  for (const activity of activities) {
    const entry = days.get(dayKeyOf(activity));
    const load = activityLoad(activity);
    if (!entry || !load) continue;
    entry.count += 1;
    entry.load += load.value;
    if (load.basis === "effort") entry.effort += load.value;
    else entry.estimated += load.value;
  }
  return [...days.values()];
}

export interface FitnessPoint {
  day: DayKey;
  /** Chronic training load: 42-day exponentially weighted average. */
  fitness: number;
  /** Acute training load: 7-day exponentially weighted average. */
  fatigue: number;
  /** Fitness minus fatigue at the end of the day. */
  form: number;
}

const MAX_WARMUP_DAYS = 365;

/**
 * Fitness, fatigue and form for each day in the range.
 * The averages warm up on every activity before `from` (up to a year), so the first
 * visible day is not artificially low.
 */
export function fitnessSeries(activities: ActivitySummary[], from: DayKey, to: DayKey): FitnessPoint[] {
  let start = from;
  for (const activity of activities) {
    const day = dayKeyOf(activity);
    if (day < start) start = day;
  }
  if (diffDays(to, start) > MAX_WARMUP_DAYS) start = addDays(to, -MAX_WARMUP_DAYS);

  const loads = dailyLoad(activities, start, to);
  const fitnessWeight = 1 - Math.exp(-1 / CTL_DAYS);
  const fatigueWeight = 1 - Math.exp(-1 / ATL_DAYS);
  let fitness = 0;
  let fatigue = 0;
  const points: FitnessPoint[] = [];
  for (const entry of loads) {
    fitness += (entry.load - fitness) * fitnessWeight;
    fatigue += (entry.load - fatigue) * fatigueWeight;
    if (entry.day >= from) points.push({ day: entry.day, fitness, fatigue, form: fitness - fatigue });
  }
  return points;
}

export interface FitnessSummary {
  current: FitnessPoint;
  /** Change since seven days earlier. */
  fitnessDelta: number;
  fatigueDelta: number;
  formDelta: number;
}

export function summarizeFitness(series: FitnessPoint[]): FitnessSummary | null {
  const current = series.at(-1);
  if (!current) return null;
  const weekAgo = series.at(-8) ?? series[0] ?? current;
  return {
    current,
    fitnessDelta: current.fitness - weekAgo.fitness,
    fatigueDelta: current.fatigue - weekAgo.fatigue,
    formDelta: current.form - weekAgo.form,
  };
}

export interface FormStatus {
  label: string;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
}

export function formStatus(form: number): FormStatus {
  if (form > 10) return { label: "Fresh", tone: "info" };
  if (form >= -10) return { label: "Balanced", tone: "neutral" };
  if (form >= -30) return { label: "Loaded", tone: "warning" };
  return { label: "Overreaching", tone: "danger" };
}

/** Share of load in the range that comes from estimates instead of Strava suffer scores. */
export function estimatedShare(loads: DailyLoad[]): number | null {
  const total = loads.reduce((sum, day) => sum + day.load, 0);
  if (total <= 0) return null;
  return loads.reduce((sum, day) => sum + day.estimated, 0) / total;
}
