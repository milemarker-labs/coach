import { modalityOf } from "./classify.js";
import type { ActivityRecord, DataQuality } from "./types.js";
import { paceSecondsPerKm } from "./units.js";

export function dataQuality(activity: ActivityRecord): DataQuality {
  const modality = modalityOf(activity);
  const limitations: string[] = ["Activity streams are not stored, so splits and within-session drift are unavailable."];
  if (activity.averageHeartRate == null) limitations.push("Heart rate was not recorded.");
  if (activity.averageWatts == null) limitations.push("Power was not recorded.");
  if (activity.elevationGainMeters == null) limitations.push("Elevation gain was not recorded.");
  if (modality === "strength") limitations.push("Sets, repetitions, and loads are not present in the activity summary.");
  if ((modality === "road-run" || modality === "trail-run") && paceSecondsPerKm(activity.averageSpeedMps, activity.distanceMeters) == null) {
    limitations.push("Pace cannot be calculated from the recorded speed and distance.");
  }
  return {
    hasHeartRate: activity.averageHeartRate != null,
    hasPower: activity.averageWatts != null,
    hasCadence: activity.averageCadence != null && activity.averageCadence > 0,
    hasElevation: activity.elevationGainMeters != null,
    hasStreams: false,
    limitations,
  };
}
