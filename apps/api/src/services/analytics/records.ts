import type { ActivityRecord, AthleteThresholds } from "@coach/analytics";
import { activities, athleteProfiles } from "../../db/schema/index.ts";

export function toActivityRecord(row: typeof activities.$inferSelect): ActivityRecord {
  return {
    id: row.id,
    name: row.name ?? "Untitled activity",
    sportType: row.sportType,
    activityType: row.activityType,
    startDate: row.startDate.toISOString(),
    distanceMeters: row.distance,
    movingTimeSeconds: row.movingTime,
    elapsedTimeSeconds: row.elapsedTime,
    averageSpeedMps: row.averageSpeed,
    maxSpeedMps: row.maxSpeed,
    elevationGainMeters: row.totalElevationGain,
    averageHeartRate: row.averageHeartrate,
    maxHeartRate: row.maxHeartrate,
    averageCadence: row.averageCadence,
    averageWatts: row.averageWatts,
    sufferScore: row.sufferScore,
  };
}

export function thresholdsFromProfile(profile: typeof athleteProfiles.$inferSelect | undefined): AthleteThresholds {
  return {
    maxHeartRate: profile?.maxHeartRate ?? null,
    thresholdHeartRate: profile?.thresholdHeartRate ?? null,
    restingHeartRate: profile?.restingHeartRate ?? null,
  };
}
