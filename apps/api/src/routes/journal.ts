import { computeMarker, journalSchema, sportKey } from "@coach/shared";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { activities, athleteProfiles, users } from "../db/schema/index.ts";
import type { AppBindings, AppVariables } from "../env.ts";
import { toJournalEntry } from "../services/journal/entry.ts";
import { journalFitness, journalFitnessFrom, journalLoadDay } from "../services/journal/fitness.ts";
import { journalWindow, resolveTimeZone } from "../services/journal/window.ts";

export const journalRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

const journalColumns = {
  id: activities.id,
  name: activities.name,
  sportType: activities.sportType,
  activityType: activities.activityType,
  startDate: activities.startDate,
  startDateLocal: activities.startDateLocal,
  distance: activities.distance,
  movingTime: activities.movingTime,
  elapsedTime: activities.elapsedTime,
  totalElevationGain: activities.totalElevationGain,
  averageSpeed: activities.averageSpeed,
  averageHeartrate: activities.averageHeartrate,
};

const fitnessColumns = {
  startDate: activities.startDate,
  startDateLocal: activities.startDateLocal,
  movingTime: activities.movingTime,
  sufferScore: activities.sufferScore,
  sportType: activities.sportType,
  activityType: activities.activityType,
  distance: activities.distance,
  averageSpeed: activities.averageSpeed,
  averageHeartrate: activities.averageHeartrate,
};

journalRoutes.get("/mangesh", async (c) => {
  const journalUserId = c.env.JOURNAL_USER_ID?.trim();
  if (!journalUserId) return c.json({ error: "Not found" }, 404);
  const db = await c.var.openDb();
  // One connection is open per request. Overlapping these queries deadlocks that connection on the Worker.
  const userRows = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, journalUserId)).limit(1);
  const profileRows = await db.select({ timezone: athleteProfiles.timezone }).from(athleteProfiles).where(eq(athleteProfiles.userId, journalUserId)).limit(1);
  const user = userRows[0];
  if (!user) return c.json({ error: "Not found" }, 404);

  const timeZone = resolveTimeZone(profileRows[0]?.timezone);
  const window = journalWindow(new Date(), timeZone);
  const rows = await db
    .select(journalColumns)
    .from(activities)
    .where(and(eq(activities.userId, journalUserId), gte(activities.startDate, window.from), lte(activities.startDate, window.through)))
    .orderBy(desc(activities.startDate), desc(activities.id))
    .limit(100);
  const loadRows = await db
    .select(fitnessColumns)
    .from(activities)
    .where(
      and(
        eq(activities.userId, journalUserId),
        gte(activities.startDate, new Date(`${journalFitnessFrom(window.toDate)}T00:00:00.000Z`)),
        lte(activities.startDate, window.through),
      ),
    )
    .limit(4000);

  const marker = computeMarker(
    loadRows.map((row) => ({
      day: journalLoadDay(row.startDate, row.startDateLocal),
      sport: sportKey(row.sportType, row.activityType),
      sufferScore: row.sufferScore,
      movingTime: row.movingTime,
      distance: row.distance,
      averageSpeed: row.averageSpeed,
      averageHeartrate: row.averageHeartrate,
    })),
    window.toDate,
  );

  c.header("Cache-Control", "public, max-age=60");
  c.header("Content-Signal", "search=yes, ai-input=yes, ai-train=yes, use=full");
  c.header("Link", '</llms.txt>; rel="describedby", </mangesh.md>; rel="describedby"');
  return c.json(
    journalSchema.parse({
      slug: "mangesh",
      name: user.displayName?.trim() || "Mangesh",
      timezone: timeZone,
      from: window.fromDate,
      to: window.toDate,
      activities: rows.map(toJournalEntry),
      fitness: journalFitness(
        loadRows.map((row) => ({
          day: journalLoadDay(row.startDate, row.startDateLocal),
          sufferScore: row.sufferScore,
          movingTime: row.movingTime,
        })),
        window.toDate,
      ),
      // The number and its parts only. Today's call and the directions stay in the private archive.
      score: {
        name: marker.name,
        value: marker.value,
        band: { key: marker.band.key, label: marker.band.label },
        delta7: marker.delta7,
        confidence: marker.confidence,
        components: marker.components.map(({ key, label, value, detail }) => ({ key, label, value, detail })),
        trend: marker.trend,
      },
    }),
  );
});
