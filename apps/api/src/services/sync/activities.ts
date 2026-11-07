import { sql } from "drizzle-orm";
import type { Database } from "../../db/index.ts";
import { activities } from "../../db/schema/index.ts";
import type { NormalizedActivity } from "../strava/normalize.ts";

export async function upsertActivities(db: Database, userId: string, items: NormalizedActivity[]): Promise<number> {
  if (items.length === 0) return 0;
  const updatedAt = new Date();
  await db
    .insert(activities)
    .values(
      items.map((item) => ({
        userId,
        stravaActivityId: item.stravaActivityId,
        name: item.name,
        sportType: item.sportType,
        activityType: item.activityType,
        startDate: item.startDate,
        startDateLocal: item.startDateLocal,
        distance: item.distance,
        movingTime: item.movingTime,
        elapsedTime: item.elapsedTime,
        totalElevationGain: item.totalElevationGain,
        averageSpeed: item.averageSpeed,
        maxSpeed: item.maxSpeed,
        averageHeartrate: item.averageHeartrate,
        maxHeartrate: item.maxHeartrate,
        averageCadence: item.averageCadence,
        averageWatts: item.averageWatts,
        weightedAverageWatts: item.weightedAverageWatts,
        maxWatts: item.maxWatts,
        kilojoules: item.kilojoules,
        deviceWatts: item.deviceWatts,
        calories: item.calories,
        sufferScore: item.sufferScore,
        averageTemp: item.averageTemp,
        hasHeartrate: item.hasHeartrate,
        trainer: item.trainer,
        commute: item.commute,
        gearId: item.gearId,
        rawData: item.rawData,
        updatedAt,
      })),
    )
    .onConflictDoUpdate({
      target: [activities.userId, activities.stravaActivityId],
      set: {
        name: sql`excluded.name`,
        sportType: sql`excluded.sport_type`,
        activityType: sql`excluded.activity_type`,
        startDate: sql`excluded.start_date`,
        startDateLocal: sql`excluded.start_date_local`,
        distance: sql`excluded.distance`,
        movingTime: sql`excluded.moving_time`,
        elapsedTime: sql`excluded.elapsed_time`,
        totalElevationGain: sql`excluded.total_elevation_gain`,
        averageSpeed: sql`excluded.average_speed`,
        maxSpeed: sql`excluded.max_speed`,
        averageHeartrate: sql`excluded.average_heartrate`,
        maxHeartrate: sql`excluded.max_heartrate`,
        averageCadence: sql`excluded.average_cadence`,
        averageWatts: sql`excluded.average_watts`,
        weightedAverageWatts: sql`excluded.weighted_average_watts`,
        maxWatts: sql`excluded.max_watts`,
        kilojoules: sql`excluded.kilojoules`,
        deviceWatts: sql`excluded.device_watts`,
        calories: sql`excluded.calories`,
        sufferScore: sql`excluded.suffer_score`,
        averageTemp: sql`excluded.average_temp`,
        hasHeartrate: sql`excluded.has_heartrate`,
        trainer: sql`excluded.trainer`,
        commute: sql`excluded.commute`,
        gearId: sql`excluded.gear_id`,
        rawData: sql`excluded.raw_data`,
        updatedAt: sql`now()`,
      },
    });
  return items.length;
}
