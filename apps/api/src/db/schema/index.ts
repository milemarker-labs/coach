import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type SyncCursor = {
  page: number;
  after?: number;
  before?: number;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name"),
    stravaAthleteId: bigint("strava_athlete_id", { mode: "bigint" }).notNull(),
    singleton: boolean("singleton").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_strava_athlete_id").on(table.stravaAthleteId),
    uniqueIndex("users_one_account").on(table.singleton),
  ],
);

export const stravaConnections = pgTable("strava_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  athleteId: bigint("athlete_id", { mode: "bigint" }).notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stravaActivityId: bigint("strava_activity_id", { mode: "bigint" }).notNull(),
    name: text("name"),
    sportType: text("sport_type"),
    activityType: text("activity_type"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    startDateLocal: timestamp("start_date_local", { withTimezone: false }),
    distance: doublePrecision("distance"),
    movingTime: integer("moving_time"),
    elapsedTime: integer("elapsed_time"),
    totalElevationGain: doublePrecision("total_elevation_gain"),
    averageSpeed: doublePrecision("average_speed"),
    maxSpeed: doublePrecision("max_speed"),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    averageCadence: doublePrecision("average_cadence"),
    averageWatts: doublePrecision("average_watts"),
    calories: doublePrecision("calories"),
    sufferScore: integer("suffer_score"),
    averageTemp: doublePrecision("average_temp"),
    gearId: text("gear_id"),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("activities_user_strava_id").on(table.userId, table.stravaActivityId),
    index("idx_activities_user_date").on(table.userId, table.startDate.desc()),
    index("idx_activities_sport_date").on(table.userId, table.sportType, table.startDate.desc()),
  ],
);

export const syncJobs = pgTable(
  "sync_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobType: text("job_type").notNull(),
    status: text("status").notNull(),
    cursor: jsonb("cursor").$type<SyncCursor>(),
    recordsProcessed: integer("records_processed").notNull().default(0),
    retryAfter: timestamp("retry_after", { withTimezone: true }),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sync_jobs_one_active")
      .on(table.userId)
      .where(sql`${table.status} in ('pending', 'running')`),
  ],
);

export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => syncJobs.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobType: text("job_type").notNull(),
  page: integer("page"),
  recordsProcessed: integer("records_processed").notNull().default(0),
  status: text("status").notNull(),
  readRateUsage: text("read_rate_usage"),
  readRateLimit: text("read_rate_limit"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
