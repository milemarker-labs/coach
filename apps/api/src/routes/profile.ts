import { athleteProfileSchema } from "@coach/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { athleteProfiles } from "../db/schema/index.ts";
import type { AppBindings, AppVariables } from "../env.ts";
import { requireUser } from "../middleware/session.ts";

const emptyProfile = {
  timezone: "Asia/Kolkata",
  age: null,
  weightKg: null,
  maxHeartRate: null,
  thresholdHeartRate: null,
  restingHeartRate: null,
  raceGoal: null,
  targetRaceDate: null,
  targetDistanceMeters: null,
  weeklyAvailabilityDays: null,
  experience: null,
  injuryConstraints: null,
  preferredDays: [] as ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[],
};

export const profileRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
profileRoutes.use("*", requireUser);

profileRoutes.get("/", async (c) => {
  const db = await c.var.openDb();
  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, c.var.userId)).limit(1);
  return c.json(athleteProfileSchema.parse(profile ? toProfile(profile) : emptyProfile));
});

profileRoutes.put("/", async (c) => {
  const parsed = athleteProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Invalid profile" }, 400);
  const db = await c.var.openDb();
  const values = { ...parsed.data, updatedAt: new Date() };
  await db
    .insert(athleteProfiles)
    .values({ userId: c.var.userId, ...values })
    .onConflictDoUpdate({ target: athleteProfiles.userId, set: values });
  return c.json(athleteProfileSchema.parse(parsed.data));
});

function toProfile(row: typeof athleteProfiles.$inferSelect) {
  return {
    timezone: row.timezone,
    age: row.age,
    weightKg: row.weightKg,
    maxHeartRate: row.maxHeartRate,
    thresholdHeartRate: row.thresholdHeartRate,
    restingHeartRate: row.restingHeartRate,
    raceGoal: row.raceGoal,
    targetRaceDate: row.targetRaceDate,
    targetDistanceMeters: row.targetDistanceMeters,
    weeklyAvailabilityDays: row.weeklyAvailabilityDays,
    experience: row.experience,
    injuryConstraints: row.injuryConstraints,
    preferredDays: row.preferredDays,
  };
}
