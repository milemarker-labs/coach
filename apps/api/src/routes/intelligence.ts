import {
  comparableActivities,
  comparePeriods,
  dataQuality,
  LOAD_METHOD,
  personalRecords,
  sessionIntent,
  summarizePeriod,
  weeklySummaries,
} from "@coach/analytics";
import { addDays, localDate, weekStart } from "@coach/analytics";
import { and, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { activities, athleteProfiles } from "../db/schema/index.ts";
import type { AppBindings, AppVariables } from "../env.ts";
import { requireUser } from "../middleware/session.ts";
import { thresholdsFromProfile, toActivityRecord } from "../services/analytics/records.ts";
import { cachedInsight } from "../services/ai/insights.ts";

export const intelligenceRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
intelligenceRoutes.use("*", requireUser);

intelligenceRoutes.get("/training", async (c) => {
  const { records, profile, thresholds, today } = await loadAthlete(c.var.openDb, c.var.userId);
  const timeZone = profile?.timezone ?? "Asia/Kolkata";
  const weeks = weeklySummaries(records, timeZone, new Date().toISOString(), 8, thresholds);
  const current = weeks.at(-1);
  const previous = weeks.at(-2);
  return c.json({
    method: LOAD_METHOD,
    weeks,
    comparison: current && previous ? comparePeriods(current, previous) : null,
    records: personalRecords(records),
    today,
  });
});

intelligenceRoutes.get("/data-quality", async (c) => {
  const { records } = await loadAthlete(c.var.openDb, c.var.userId);
  const missingHeartRate = records.filter((activity) => activity.averageHeartRate == null).length;
  return c.json({
    activities: records.length,
    missingHeartRate,
    missingStreams: records.length,
    note: "Activity streams are not stored, so split and drift analysis is unavailable.",
  });
});

intelligenceRoutes.get("/dashboard", async (c) => {
  const loaded = await loadAthlete(c.var.openDb, c.var.userId);
  const context = dashboardContext(loaded);
  const db = await c.var.openDb();
  const result = await cachedInsight(db, c.env, {
    userId: c.var.userId,
    kind: "dashboard",
    subjectKey: context.weekStart,
    context,
    prompt: "dashboard",
    refresh: c.req.query("refresh") === "1",
  });
  return c.json({ context, ...result });
});

intelligenceRoutes.get("/insights", async (c) => {
  const loaded = await loadAthlete(c.var.openDb, c.var.userId);
  const weeks = weeklySummaries(loaded.records, loaded.timeZone, new Date().toISOString(), 8, loaded.thresholds);
  const context = { weeks, profile: profileContext(loaded.profile), today: loaded.today, records: personalRecords(loaded.records) };
  const db = await c.var.openDb();
  const result = await cachedInsight(db, c.env, {
    userId: c.var.userId,
    kind: "insights",
    subjectKey: "rolling-8-weeks",
    context,
    prompt: "dashboard",
    refresh: c.req.query("refresh") === "1",
  });
  return c.json({ weeks, ...result });
});

intelligenceRoutes.get("/activities/:id", async (c) => {
  const loaded = await loadAthlete(c.var.openDb, c.var.userId);
  const activity = loaded.records.find((item) => item.id === c.req.param("id"));
  if (!activity) return c.json({ error: "Not found" }, 404);
  const context = {
    activity,
    intent: sessionIntent(activity, loaded.thresholds),
    quality: dataQuality(activity),
    comparable: comparableActivities(activity, loaded.records).map((item) => ({
      id: item.id,
      name: item.name,
      startDate: item.startDate,
      distanceMeters: item.distanceMeters,
      averageSpeedMps: item.averageSpeedMps,
      averageHeartRate: item.averageHeartRate,
      elevationGainMeters: item.elevationGainMeters,
    })),
    profile: profileContext(loaded.profile),
  };
  const db = await c.var.openDb();
  const result = await cachedInsight(db, c.env, {
    userId: c.var.userId,
    kind: "activity",
    subjectKey: activity.id,
    context,
    prompt: "activity",
    refresh: c.req.query("refresh") === "1",
  });
  return c.json({ context, ...result });
});

async function loadAthlete(openDb: AppVariables["openDb"], userId: string) {
  const db = await openDb();
  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)).limit(1);
  const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(activities)
    .where(and(eq(activities.userId, userId), gte(activities.startDate, since)));
  const timeZone = profile?.timezone ?? "Asia/Kolkata";
  return {
    profile,
    thresholds: thresholdsFromProfile(profile),
    records: rows.map(toActivityRecord),
    today: localDate(new Date().toISOString(), timeZone),
    timeZone,
  };
}

function dashboardContext(loaded: Awaited<ReturnType<typeof loadAthlete>>) {
  const start = weekStart(loaded.today);
  const current = summarizePeriod(loaded.records, start, addDays(start, 6), loaded.today, loaded.timeZone, loaded.thresholds);
  current.complete = loaded.today >= addDays(start, 6);
  const previous = summarizePeriod(loaded.records, addDays(start, -7), addDays(start, -1), loaded.today, loaded.timeZone, loaded.thresholds);
  previous.complete = true;
  return {
    weekStart: start,
    today: loaded.today,
    timeZone: loaded.timeZone,
    profile: profileContext(loaded.profile),
    current,
    previous,
    comparison: comparePeriods(current, previous),
    recent: loaded.records
      .slice()
      .sort((left, right) => right.startDate.localeCompare(left.startDate))
      .slice(0, 8)
      .map((activity) => ({ id: activity.id, name: activity.name, sportType: activity.sportType, startDate: activity.startDate, distanceMeters: activity.distanceMeters })),
  };
}

function profileContext(profile: Awaited<ReturnType<typeof loadAthlete>>["profile"]) {
  if (!profile) return { timezone: "Asia/Kolkata", raceGoal: null, thresholdsSet: false };
  return {
    timezone: profile.timezone,
    age: profile.age,
    raceGoal: profile.raceGoal,
    targetRaceDate: profile.targetRaceDate,
    weeklyAvailabilityDays: profile.weeklyAvailabilityDays,
    experience: profile.experience,
    injuryConstraints: profile.injuryConstraints,
    thresholdsSet: profile.maxHeartRate != null && profile.restingHeartRate != null,
  };
}
