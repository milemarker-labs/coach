import { z } from "zod";

export const activitySummarySchema = z.object({
  id: z.uuid(),
  stravaActivityId: z.string(),
  name: z.string().nullable(),
  sportType: z.string().nullable(),
  activityType: z.string().nullable(),
  startDate: z.string(),
  startDateLocal: z.string().nullable(),
  distance: z.number().nullable(),
  movingTime: z.number().nullable(),
  elapsedTime: z.number().nullable(),
  totalElevationGain: z.number().nullable(),
  averageSpeed: z.number().nullable(),
  maxSpeed: z.number().nullable(),
  averageHeartrate: z.number().nullable(),
  maxHeartrate: z.number().nullable(),
  averageCadence: z.number().nullable(),
  averageWatts: z.number().nullable(),
  calories: z.number().nullable(),
  sufferScore: z.number().nullable(),
  averageTemp: z.number().nullable(),
  gearId: z.string().nullable(),
});

export const activityListQuerySchema = z.object({
  type: z.string().trim().min(1).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const activityListResponseSchema = z.object({
  activities: z.array(activitySummarySchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const authStatusSchema = z.object({
  connected: z.boolean(),
  athleteId: z.string().nullable(),
  displayName: z.string().nullable(),
  expiresAt: z.string().nullable(),
});

export const syncJobSchema = z.object({
  id: z.uuid(),
  jobType: z.enum(["historical", "incremental"]),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  page: z.number().int(),
  recordsProcessed: z.number().int(),
  error: z.string().nullable(),
  retryAfter: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const syncStatusSchema = z.object({
  activeJob: syncJobSchema.nullable(),
  resumableJob: syncJobSchema.nullable(),
  lastSyncedAt: z.string().nullable(),
  activityCount: z.number().int(),
});

export const sportCountSchema = z.object({
  sport: z.string(),
  count: z.number().int(),
});

export const sportListSchema = z.object({
  sports: z.array(sportCountSchema),
});

export const historicalSyncRequestSchema = z.object({
  after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type SyncJob = z.infer<typeof syncJobSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type SportCount = z.infer<typeof sportCountSchema>;
export type SportList = z.infer<typeof sportListSchema>;
export type HistoricalSyncRequest = z.infer<typeof historicalSyncRequestSchema>;
