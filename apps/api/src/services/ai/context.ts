import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { CoachContext } from "@coach/ai";
import { sportKey } from "@coach/shared";
import type { Database } from "../../db/index.ts";
import { activities } from "../../db/schema/index.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function buildCoachContext(db: Database, userId: string, now = new Date()): Promise<CoachContext> {
  const last7Start = new Date(now.getTime() - 7 * DAY_MS);
  const previous7Start = new Date(now.getTime() - 14 * DAY_MS);
  const recentStart = new Date(now.getTime() - 90 * DAY_MS);
  const [last7Days, previous7Days, recent] = await Promise.all([
    sportWindow(db, userId, last7Start, now),
    sportWindow(db, userId, previous7Start, last7Start),
    db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, userId), gte(activities.startDate, recentStart)))
      .orderBy(desc(activities.startDate))
      .limit(20),
  ]);

  return {
    last7Days,
    previous7Days,
    recentActivities: recent.map((activity) => ({
      id: activity.id,
      name: (activity.name ?? "Untitled activity").slice(0, 120),
      sport: sportKey(activity.sportType, activity.activityType),
      startedAt: activity.startDate.toISOString(),
      distanceMeters: activity.distance,
      movingTimeSeconds: activity.movingTime,
      averageSpeedMps: activity.averageSpeed,
      averageHeartRate: activity.averageHeartrate,
    })),
  };
}

async function sportWindow(db: Database, userId: string, from: Date, to: Date) {
  const sport = sql<string>`coalesce(nullif(${activities.sportType}, ''), nullif(${activities.activityType}, ''), 'Activity')`;
  const rows = await db
    .select({
      sport,
      activities: count(),
      distanceMeters: sql<number>`coalesce(sum(${activities.distance}), 0)`,
      movingTimeSeconds: sql<number>`coalesce(sum(${activities.movingTime}), 0)`,
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), gte(activities.startDate, from), lt(activities.startDate, to)))
    .groupBy(sport);
  return rows.map((row) => ({
    sport: row.sport,
    activities: Number(row.activities),
    distanceMeters: Number(row.distanceMeters),
    movingTimeSeconds: Number(row.movingTimeSeconds),
  }));
}
