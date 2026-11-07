import { sportKey, type ActivitySummary } from "@coach/shared";

const DISTANCE_TOLERANCE = 0.25;

/**
 * Earlier activities of the same sport at a similar distance (within 25%).
 * Without a distance, every earlier activity of the sport counts.
 */
export function similarActivities(target: ActivitySummary, all: ActivitySummary[], limit = 10): ActivitySummary[] {
  const sport = sportKey(target.sportType, target.activityType);
  const distance = target.distance ?? 0;
  return all
    .filter((other) => {
      if (other.id === target.id || other.startDate >= target.startDate) return false;
      if (sportKey(other.sportType, other.activityType) !== sport) return false;
      if (distance <= 0) return true;
      const otherDistance = other.distance ?? 0;
      return otherDistance > 0 && Math.abs(otherDistance - distance) / distance <= DISTANCE_TOLERANCE;
    })
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
    .slice(0, limit);
}

export interface ComparisonMetric {
  key: "speed" | "heartrate" | "distance" | "elevation" | "time";
  label: string;
  current: number;
  baseline: number;
  /** Relative change versus the baseline, in percent. */
  change: number;
}

export interface ActivityComparison {
  sample: number;
  metrics: ComparisonMetric[];
  /** Position of the target by average speed among the target and its similar activities (1 is fastest). */
  speedRank: { position: number; of: number } | null;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function metric(key: ComparisonMetric["key"], label: string, current: number | null, others: (number | null)[]): ComparisonMetric | null {
  const baseline = mean(others.filter((value): value is number => value != null && value > 0));
  if (current == null || current <= 0 || baseline == null) return null;
  return { key, label, current, baseline, change: ((current - baseline) / baseline) * 100 };
}

export function compareActivity(target: ActivitySummary, similar: ActivitySummary[]): ActivityComparison | null {
  if (similar.length === 0) return null;
  const metrics = [
    metric("speed", "Average speed", target.averageSpeed, similar.map((a) => a.averageSpeed)),
    metric("heartrate", "Average heart rate", target.averageHeartrate, similar.map((a) => a.averageHeartrate)),
    metric("distance", "Distance", target.distance, similar.map((a) => a.distance)),
    metric("elevation", "Elevation gain", target.totalElevationGain, similar.map((a) => a.totalElevationGain)),
    metric("time", "Moving time", target.movingTime, similar.map((a) => a.movingTime)),
  ].filter((item): item is ComparisonMetric => item != null);

  const speeds = similar.map((a) => a.averageSpeed ?? 0).filter((speed) => speed > 0);
  const speedRank =
    (target.averageSpeed ?? 0) > 0 && speeds.length > 0
      ? { position: speeds.filter((speed) => speed > (target.averageSpeed ?? 0)).length + 1, of: speeds.length + 1 }
      : null;
  return { sample: similar.length, metrics, speedRank };
}
