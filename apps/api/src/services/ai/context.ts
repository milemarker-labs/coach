import { addDays, weekdayName, zonedParts, zonedStart } from "@coach/analytics";
import type { CoachContext } from "@coach/ai";
import { sportKey } from "@coach/shared";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { Database } from "../../db/index.ts";
import { activities } from "../../db/schema/index.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export function coachCalendar(now: Date, timeZone: string) {
  const nowParts = zonedParts(now.toISOString(), timeZone);
  const today = nowParts.localDate;
  const last7From = zonedStart(addDays(today, -6), timeZone);
  const last7To = zonedStart(addDays(today, 1), timeZone);
  const previous7From = zonedStart(addDays(today, -13), timeZone);
  return {
    today,
    nowLocalTime: nowParts.localTime,
    weekday: weekdayName(today),
    timeZone,
    last7From,
    last7To,
    previous7From,
    previous7To: last7From,
  };
}

export async function buildCoachContext(db: Database, userId: string, now = new Date(), timeZone = "Asia/Kolkata"): Promise<CoachContext> {
  const calendar = coachCalendar(now, timeZone);
  const recentStart = new Date(now.getTime() - 90 * DAY_MS);
  const [last7Days, previous7Days, recent] = await Promise.all([
    sportWindow(db, userId, calendar.last7From, calendar.last7To),
    sportWindow(db, userId, calendar.previous7From, calendar.previous7To),
    db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, userId), gte(activities.startDate, recentStart)))
      .orderBy(desc(activities.startDate))
      .limit(20),
  ]);

  return {
    today: calendar.today,
    nowLocalTime: calendar.nowLocalTime,
    weekday: calendar.weekday,
    timeZone,
    last7Days,
    previous7Days,
    recentActivities: recent.map((activity) => {
      const dated = activityCalendar(activity.startDate, timeZone);
      return {
        id: activity.id,
        name: (activity.name ?? "Untitled activity").slice(0, 120),
        sport: sportKey(activity.sportType, activity.activityType),
        startedAt: activity.startDate.toISOString(),
        localDate: dated.localDate,
        localTime: dated.localTime,
        weekday: dated.weekday,
        distanceMeters: activity.distance,
        movingTimeSeconds: activity.movingTime,
        averageSpeedMps: activity.averageSpeed,
        averageHeartRate: activity.averageHeartrate,
      };
    }),
  };
}

/** Convert the stored UTC instant into the athlete timezone. The UTC hour is never shown. */
export function activityCalendar(startDate: Date, timeZone: string): { localDate: string; localTime: string; weekday: string } {
  const zoned = zonedParts(startDate.toISOString(), timeZone);
  return { localDate: zoned.localDate, localTime: zoned.localTime, weekday: weekdayName(zoned.localDate) };
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
