import { countsAsRunningMileage, modalityOf } from "./classify.js";
import { addDays, localDate, weekIsComplete, weekStart } from "./time.js";
import type { ActivityRecord, AthleteThresholds, Modality, ModalityTotals, PeriodSummary } from "./types.js";
import { paceSecondsPerKm } from "./units.js";

const MODALITIES: Modality[] = ["road-run", "trail-run", "walk", "hike", "strength", "other"];

export const LOAD_METHOD =
  "Heart-rate load is moving minutes multiplied by (average HR - resting HR) / (max HR - resting HR) when both max and resting HR are set and average HR is present. It is not CTL, ATL, or TSB. Suffer score is summed separately and is not converted into that load.";

export function summarizePeriod(activities: ActivityRecord[], start: string, end: string, today: string, timeZone: string, thresholds: AthleteThresholds): PeriodSummary {
  const included = activities.filter((activity) => {
    const day = localDate(activity.startDate, timeZone);
    return day >= start && day <= end;
  });
  const byModality = MODALITIES.map((modality) => totalsFor(included.filter((activity) => modalityOf(activity) === modality), modality, thresholds)).filter(
    (row) => row.activities > 0,
  );
  return {
    start,
    end,
    complete: end < today,
    days: diffDays(start, end) + 1,
    byModality,
    runningDistanceMeters: sumDistance(included.filter((activity) => countsAsRunningMileage(modalityOf(activity)))),
    trailDistanceMeters: sumDistance(included.filter((activity) => modalityOf(activity) === "trail-run")),
    walkDistanceMeters: sumDistance(included.filter((activity) => modalityOf(activity) === "walk")),
    hikeDistanceMeters: sumDistance(included.filter((activity) => modalityOf(activity) === "hike")),
    strengthSessions: included.filter((activity) => modalityOf(activity) === "strength").length,
  };
}

export function weeklySummaries(activities: ActivityRecord[], timeZone: string, todayIso: string, weeks: number, thresholds: AthleteThresholds): PeriodSummary[] {
  const today = localDate(todayIso, timeZone);
  const currentStart = weekStart(today);
  const summaries: PeriodSummary[] = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const start = addDays(currentStart, -7 * index);
    const end = addDays(start, 6);
    const summary = summarizePeriod(activities, start, end, today, timeZone, thresholds);
    summary.complete = weekIsComplete(start, today);
    summaries.push(summary);
  }
  return summaries;
}

export function comparePeriods(current: PeriodSummary, previous: PeriodSummary) {
  return {
    currentComplete: current.complete,
    previousComplete: previous.complete,
    note: current.complete ? null : "The current period is incomplete, so it is not equivalent to the previous full period.",
    runningDistanceMeters: delta(current.runningDistanceMeters, previous.runningDistanceMeters),
    trailDistanceMeters: delta(current.trailDistanceMeters, previous.trailDistanceMeters),
    hikeDistanceMeters: delta(current.hikeDistanceMeters, previous.hikeDistanceMeters),
    strengthSessions: delta(current.strengthSessions, previous.strengthSessions),
  };
}

export function heartRateLoad(activity: ActivityRecord, thresholds: AthleteThresholds): number | null {
  const max = thresholds.maxHeartRate;
  const resting = thresholds.restingHeartRate;
  const average = activity.averageHeartRate;
  const moving = activity.movingTimeSeconds;
  if (max == null || resting == null || average == null || moving == null) return null;
  if (max <= resting || average <= 0 || moving <= 0) return null;
  const fraction = Math.min(1.5, Math.max(0, (average - resting) / (max - resting)));
  return Math.round((moving / 60) * fraction * 10) / 10;
}

export function sessionIntent(activity: ActivityRecord, thresholds: AthleteThresholds): { intent: string; basis: string } {
  const modality = modalityOf(activity);
  if (modality === "strength") return { intent: "strength", basis: "Sport type is weight training. Sets and loads are not in the summary." };
  if (modality === "hike") return { intent: "hike", basis: "Sport type is hike. This is not counted as a run." };
  if (modality === "walk") return { intent: "walk", basis: "Sport type is walk. Distance is not running mileage." };
  if (modality === "trail-run") return { intent: "trail-run", basis: "Trail pace is not compared with road pace." };
  if (modality !== "road-run") return { intent: "other", basis: "This sport has no running-intensity classification." };
  const threshold = thresholds.thresholdHeartRate;
  if (activity.averageHeartRate == null || threshold == null) {
    return { intent: "unclassified", basis: "Average pace alone is not used to label intensity, and a threshold heart rate or recorded heart rate is missing." };
  }
  if (activity.averageHeartRate >= threshold) return { intent: "hard", basis: "Average heart rate is at or above the athlete threshold. Streams are required to separate tempo from intervals." };
  const distance = activity.distanceMeters ?? 0;
  if (distance >= 16000) return { intent: "long", basis: "Road run of at least 16 km with average heart rate below threshold." };
  return { intent: "easy", basis: "Average heart rate is below the athlete threshold." };
}

export function comparableActivities(target: ActivityRecord, history: ActivityRecord[]): ActivityRecord[] {
  const modality = modalityOf(target);
  return history
    .filter((activity) => activity.id !== target.id && modalityOf(activity) === modality)
    .filter((activity) => similarDistance(target.distanceMeters, activity.distanceMeters))
    .filter((activity) => modality !== "trail-run" && modality !== "hike" || similarElevation(target.elevationGainMeters, activity.elevationGainMeters))
    .slice(0, 5);
}

export function personalRecords(activities: ActivityRecord[]) {
  const runs = activities.filter((activity) => modalityOf(activity) === "road-run");
  let longest: ActivityRecord | null = null;
  let fastest: { activity: ActivityRecord; pace: number } | null = null;
  for (const activity of runs) {
    if (activity.distanceMeters != null && (longest == null || activity.distanceMeters > (longest.distanceMeters ?? 0))) longest = activity;
    const pace = paceSecondsPerKm(activity.averageSpeedMps, activity.distanceMeters);
    if (pace != null && (activity.distanceMeters ?? 0) >= 5000 && (fastest == null || pace < fastest.pace)) fastest = { activity, pace };
  }
  return {
    longestRunId: longest?.id ?? null,
    fastestRunId: fastest?.activity.id ?? null,
    fastestPaceSecondsPerKm: fastest?.pace ?? null,
  };
}

function totalsFor(activities: ActivityRecord[], modality: Modality, thresholds: AthleteThresholds): ModalityTotals {
  const loads = activities.map((activity) => heartRateLoad(activity, thresholds)).filter((load): load is number => load != null);
  const suffer = activities.map((activity) => activity.sufferScore).filter((score): score is number => score != null);
  return {
    modality,
    activities: activities.length,
    distanceMeters: sumDistance(activities),
    movingTimeSeconds: activities.reduce((sum, activity) => sum + (activity.movingTimeSeconds ?? 0), 0),
    elevationGainMeters: activities.reduce((sum, activity) => sum + (activity.elevationGainMeters ?? 0), 0),
    sufferScore: suffer.length > 0 ? suffer.reduce((sum, score) => sum + score, 0) : null,
    heartRateLoad: loads.length > 0 ? Math.round(loads.reduce((sum, load) => sum + load, 0) * 10) / 10 : null,
  };
}

function sumDistance(activities: ActivityRecord[]): number {
  return activities.reduce((sum, activity) => sum + (activity.distanceMeters ?? 0), 0);
}

function similarDistance(left: number | null, right: number | null): boolean {
  if (left == null || right == null || left <= 0 || right <= 0) return false;
  const ratio = left / right;
  return ratio >= 0.85 && ratio <= 1.15;
}

function similarElevation(left: number | null, right: number | null): boolean {
  if (left == null || right == null) return false;
  return Math.abs(left - right) <= Math.max(50, left * 0.25);
}

function delta(current: number, previous: number) {
  return { current, previous, difference: current - previous };
}

function diffDays(start: string, end: string): number {
  const startDate = Date.parse(`${start}T00:00:00Z`);
  const endDate = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endDate - startDate) / 86400000);
}
