import type { JournalEntry } from "@coach/shared";
import type { activities } from "../../db/schema/index.ts";
import { formatWallClock } from "../strava/normalize.ts";

type JournalSource = Pick<
  typeof activities.$inferSelect,
  | "id"
  | "name"
  | "sportType"
  | "activityType"
  | "startDate"
  | "startDateLocal"
  | "distance"
  | "movingTime"
  | "elapsedTime"
  | "totalElevationGain"
  | "averageSpeed"
  | "averageHeartrate"
>;

/** Fields a visitor of the public journal is allowed to see. */
export function toJournalEntry(row: JournalSource): JournalEntry {
  return {
    id: row.id,
    name: row.name,
    sportType: row.sportType,
    activityType: row.activityType,
    startDate: row.startDate.toISOString(),
    startDateLocal: row.startDateLocal ? formatWallClock(row.startDateLocal) : null,
    distance: row.distance,
    movingTime: row.movingTime,
    elapsedTime: row.elapsedTime,
    totalElevationGain: row.totalElevationGain,
    averageSpeed: row.averageSpeed,
    averageHeartrate: row.averageHeartrate,
  };
}
