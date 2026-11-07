import type { ActivityRecord, Modality } from "./types.ts";

const ROAD = new Set(["Run", "VirtualRun"]);
const TRAIL = new Set(["TrailRun"]);
const WALK = new Set(["Walk"]);
const HIKE = new Set(["Hike"]);
const STRENGTH = new Set(["WeightTraining", "Workout", "Yoga", "Pilates", "Crossfit"]);

export function modalityOf(activity: Pick<ActivityRecord, "sportType" | "activityType">): Modality {
  const sport = activity.sportType?.trim() || activity.activityType?.trim() || "";
  if (ROAD.has(sport)) return "road-run";
  if (TRAIL.has(sport)) return "trail-run";
  if (WALK.has(sport)) return "walk";
  if (HIKE.has(sport)) return "hike";
  if (STRENGTH.has(sport)) return "strength";
  return "other";
}

export function countsAsRunningMileage(modality: Modality): boolean {
  return modality === "road-run";
}
