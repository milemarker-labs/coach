export type Modality = "road-run" | "trail-run" | "walk" | "hike" | "strength" | "other";

export interface ActivityRecord {
  id: string;
  name: string;
  sportType: string | null;
  activityType: string | null;
  startDate: string;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  elapsedTimeSeconds: number | null;
  averageSpeedMps: number | null;
  maxSpeedMps: number | null;
  elevationGainMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  averageCadence: number | null;
  averageWatts: number | null;
  sufferScore: number | null;
}

export interface AthleteThresholds {
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
  restingHeartRate: number | null;
}

export interface DataQuality {
  hasHeartRate: boolean;
  hasPower: boolean;
  hasCadence: boolean;
  hasElevation: boolean;
  hasStreams: false;
  limitations: string[];
}

export interface ModalityTotals {
  modality: Modality;
  activities: number;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  sufferScore: number | null;
  heartRateLoad: number | null;
}

export interface PeriodSummary {
  start: string;
  end: string;
  complete: boolean;
  days: number;
  byModality: ModalityTotals[];
  runningDistanceMeters: number;
  trailDistanceMeters: number;
  walkDistanceMeters: number;
  hikeDistanceMeters: number;
  strengthSessions: number;
}

export type Confidence = "low" | "medium" | "high";
