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
  weightedAverageWatts: z.number().nullable(),
  maxWatts: z.number().nullable(),
  kilojoules: z.number().nullable(),
  deviceWatts: z.boolean().nullable(),
  calories: z.number().nullable(),
  sufferScore: z.number().nullable(),
  averageTemp: z.number().nullable(),
  hasHeartrate: z.boolean().nullable(),
  trainer: z.boolean().nullable(),
  commute: z.boolean().nullable(),
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

export const syncJobListSchema = z.object({
  jobs: z.array(syncJobSchema),
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

export const aiSourceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sport: z.string(),
  startedAt: z.string(),
});

export const aiStatusSchema = z.object({
  provider: z.literal("ollama"),
  model: z.string().nullable(),
  reachable: z.boolean(),
  models: z.array(z.string()),
  error: z.string().nullable(),
});

export const chatRequestSchema = z.object({
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export const aiMessageSchema = z.object({
  id: z.uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  sources: z.array(aiSourceSchema),
  createdAt: z.string(),
});

export const aiConversationSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  updatedAt: z.string(),
  messages: z.array(aiMessageSchema),
});

export const athleteProfileSchema = z.object({
  timezone: z.string().min(1).default("Asia/Kolkata"),
  age: z.number().int().positive().nullable(),
  weightKg: z.number().positive().nullable(),
  maxHeartRate: z.number().int().positive().nullable(),
  thresholdHeartRate: z.number().int().positive().nullable(),
  restingHeartRate: z.number().int().positive().nullable(),
  raceGoal: z.string().max(200).nullable(),
  targetRaceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  targetDistanceMeters: z.number().positive().nullable(),
  weeklyAvailabilityDays: z.number().int().min(0).max(7).nullable(),
  experience: z.string().max(500).nullable(),
  injuryConstraints: z.string().max(500).nullable(),
  preferredDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])),
});

export const coachInsightSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  observations: z.array(z.object({
    type: z.enum(["positive", "neutral", "concern"]),
    title: z.string(),
    description: z.string(),
  })),
  concerns: z.array(z.string()),
  recommendation: z.object({ title: z.string(), description: z.string() }).nullable(),
  evidence: z.array(z.object({ activityId: z.uuid(), note: z.string() })),
  confidence: z.enum(["low", "medium", "high"]),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type SyncJob = z.infer<typeof syncJobSchema>;
export type SyncJobList = z.infer<typeof syncJobListSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type SportCount = z.infer<typeof sportCountSchema>;
export type SportList = z.infer<typeof sportListSchema>;
export type AiSource = z.infer<typeof aiSourceSchema>;
export type AiStatus = z.infer<typeof aiStatusSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type AiMessage = z.infer<typeof aiMessageSchema>;
export type AiConversation = z.infer<typeof aiConversationSchema>;
export type AthleteProfile = z.infer<typeof athleteProfileSchema>;
export type CoachInsight = z.infer<typeof coachInsightSchema>;
export type HistoricalSyncRequest = z.infer<typeof historicalSyncRequestSchema>;
