import { activityListQuerySchema, activityListResponseSchema, activitySummarySchema, sportListSchema } from "@coach/shared";
import { and, asc, count, desc, eq, gte, lt, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { activities } from "../db/schema/index.ts";
import type { AppBindings, AppVariables } from "../env.ts";
import { requireUser } from "../middleware/session.ts";
import { dateToEpochNextDay } from "../services/sync/cursor.ts";
import { formatWallClock } from "../services/strava/normalize.ts";

export const activityRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

activityRoutes.use("*", requireUser);

activityRoutes.get("/", async (c) => {
  const query: Record<string, string> = {};
  for (const key of ["type", "from", "to", "sort", "limit", "offset"] as const) {
    const value = c.req.query(key);
    if (value) query[key] = value;
  }
  const parsed = activityListQuerySchema.safeParse(query);
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);

  const db = await c.var.openDb();
  const filters = [eq(activities.userId, c.var.userId)];
  if (parsed.data.type) {
    const sport = parsed.data.type;
    const sportFilter = or(eq(activities.sportType, sport), eq(activities.activityType, sport));
    if (sportFilter) filters.push(sportFilter);
  }
  if (parsed.data.from) filters.push(gte(activities.startDate, new Date(`${parsed.data.from}T00:00:00.000Z`)));
  if (parsed.data.to) filters.push(lt(activities.startDate, new Date(dateToEpochNextDay(parsed.data.to) * 1000)));
  const where = and(...filters);
  const order = parsed.data.sort === "asc" ? asc(activities.startDate) : desc(activities.startDate);

  const [countRow] = await db.select({ total: count() }).from(activities).where(where);
  const rows = await db
    .select()
    .from(activities)
    .where(where)
    .orderBy(order, desc(activities.stravaActivityId))
    .limit(parsed.data.limit)
    .offset(parsed.data.offset);

  return c.json(
    activityListResponseSchema.parse({
      activities: rows.map(serializeActivity),
      total: Number(countRow?.total ?? 0),
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    }),
  );
});

activityRoutes.get("/sports", async (c) => {
  const db = await c.var.openDb();
  const sport = sql<string>`coalesce(nullif(${activities.sportType}, ''), nullif(${activities.activityType}, ''), 'Activity')`;
  const rows = await db
    .select({ sport, total: count() })
    .from(activities)
    .where(eq(activities.userId, c.var.userId))
    .groupBy(sport)
    .orderBy(sql`count(*) desc`, sport);
  return c.json(
    sportListSchema.parse({
      sports: rows.map((row) => ({ sport: row.sport, count: Number(row.total) })),
    }),
  );
});

activityRoutes.get("/:id", async (c) => {
  const db = await c.var.openDb();
  const [row] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, c.req.param("id")), eq(activities.userId, c.var.userId)))
    .limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(activitySummarySchema.parse(serializeActivity(row)));
});

function serializeActivity(row: typeof activities.$inferSelect) {
  return {
    id: row.id,
    stravaActivityId: row.stravaActivityId.toString(),
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
    maxSpeed: row.maxSpeed,
    averageHeartrate: row.averageHeartrate,
    maxHeartrate: row.maxHeartrate,
    averageCadence: row.averageCadence,
    averageWatts: row.averageWatts,
    weightedAverageWatts: row.weightedAverageWatts,
    maxWatts: row.maxWatts,
    kilojoules: row.kilojoules,
    deviceWatts: row.deviceWatts,
    calories: row.calories,
    sufferScore: row.sufferScore,
    averageTemp: row.averageTemp,
    hasHeartrate: row.hasHeartrate,
    trainer: row.trainer,
    commute: row.commute,
    gearId: row.gearId,
  };
}
