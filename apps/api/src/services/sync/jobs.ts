import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { SyncJob as SyncJobResponse } from "@coach/shared";
import { syncJobSchema } from "@coach/shared";
import type { Database } from "../../db/index.ts";
import { activities, stravaConnections, syncJobs, syncLogs } from "../../db/schema/index.ts";
import { safeErrorMessage } from "../errors.ts";
import { decryptSecret, encryptSecret } from "../crypto/tokens.ts";
import { shouldRefreshToken } from "../auth/tokens.ts";
import { fetchActivityPage, refreshStravaToken, type StravaCredentials } from "../strava/client.ts";
import { normalizeActivity } from "../strava/normalize.ts";
import { readRateLimit, shouldPauseForRateLimit, type RateLimitSnapshot } from "../strava/rate-limit.ts";
import { upsertActivities } from "./activities.ts";
import {
  LEASE_MS,
  PAGE_SIZE,
  dateToEpochNextDay,
  dateToEpochStart,
  incrementalAfter,
  isWaitingForRateLimit,
  nextPageOutcome,
  type SyncCursor,
} from "./cursor.ts";

export interface SyncContext {
  db: Database;
  userId: string;
  credentials: StravaCredentials;
  tokenKey: string;
}

export type JobAction =
  | { kind: "ok"; job: SyncJobResponse }
  | { kind: "conflict"; job: SyncJobResponse | null }
  | { kind: "not_found" };

type JobRow = typeof syncJobs.$inferSelect;

export async function startHistoricalSync(
  context: SyncContext,
  range: { after?: string; before?: string },
): Promise<JobAction> {
  const cursor: SyncCursor = { page: 1 };
  if (range.after) cursor.after = dateToEpochStart(range.after);
  if (range.before) cursor.before = dateToEpochNextDay(range.before);
  return startJob(context, "historical", cursor);
}

export async function startIncrementalSync(context: SyncContext, now = new Date()): Promise<JobAction> {
  return startJob(context, "incremental", { page: 1, after: incrementalAfter(now) });
}

export async function continueSyncJob(context: SyncContext, jobId: string): Promise<JobAction> {
  const now = new Date();
  const existing = await findJob(context.db, context.userId, jobId);
  if (!existing) return { kind: "not_found" };
  if (existing.status === "completed" || existing.status === "cancelled") {
    return { kind: "ok", job: serializeJob(existing) };
  }
  if (existing.status === "pending" && isWaitingForRateLimit(existing.retryAfter, now)) {
    return { kind: "ok", job: serializeJob(existing) };
  }

  const acquired = await acquireJob(context.db, context.userId, jobId, now);
  if (!acquired) {
    const current = await findJob(context.db, context.userId, jobId);
    return { kind: "conflict", job: current ? serializeJob(current) : null };
  }

  try {
    return { kind: "ok", job: await processAcquiredJob(context, acquired) };
  } catch (error) {
    const message = safeErrorMessage(error);
    const [failed] = await context.db
      .update(syncJobs)
      .set({
        status: "failed",
        error: message,
        leaseUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(syncJobs.id, acquired.id))
      .returning();
    await writeLog(context.db, {
      job: acquired,
      page: readCursor(acquired.cursor).page,
      recordsProcessed: 0,
      status: "error",
      rateLimit: emptyRateLimit(),
      error: message,
    });
    return { kind: "ok", job: serializeJob(failed ?? acquired) };
  }
}

export async function cancelSyncJob(db: Database, userId: string, jobId: string): Promise<JobAction> {
  const [job] = await db
    .update(syncJobs)
    .set({
      status: "cancelled",
      leaseUntil: null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(syncJobs.id, jobId),
        eq(syncJobs.userId, userId),
        or(eq(syncJobs.status, "pending"), eq(syncJobs.status, "running"), eq(syncJobs.status, "failed")),
      ),
    )
    .returning();
  if (job) return { kind: "ok", job: serializeJob(job) };
  const existing = await findJob(db, userId, jobId);
  if (!existing) return { kind: "not_found" };
  return { kind: "ok", job: serializeJob(existing) };
}

export async function getSyncJob(db: Database, userId: string, jobId: string): Promise<SyncJobResponse | null> {
  const job = await findJob(db, userId, jobId);
  return job ? serializeJob(job) : null;
}

export async function getSyncStatus(db: Database, userId: string) {
  const jobs = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.userId, userId))
    .orderBy(desc(syncJobs.createdAt));
  const active = jobs.find((job) => job.status === "pending" || job.status === "running") ?? null;
  const resumable = jobs.find((job) => job.status === "failed") ?? null;
  const [latestLog] = await db
    .select({ createdAt: syncLogs.createdAt })
    .from(syncLogs)
    .where(and(eq(syncLogs.userId, userId), eq(syncLogs.status, "ok")))
    .orderBy(desc(syncLogs.createdAt))
    .limit(1);
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(activities)
    .where(eq(activities.userId, userId));
  return {
    activeJob: active ? serializeJob(active) : null,
    resumableJob: resumable && resumable.id !== active?.id ? serializeJob(resumable) : null,
    lastSyncedAt: latestLog?.createdAt.toISOString() ?? null,
    activityCount: countRow?.total ?? 0,
  };
}

async function startJob(context: SyncContext, jobType: "historical" | "incremental", cursor: SyncCursor): Promise<JobAction> {
  const active = await context.db
    .select()
    .from(syncJobs)
    .where(and(eq(syncJobs.userId, context.userId), or(eq(syncJobs.status, "pending"), eq(syncJobs.status, "running"))))
    .limit(1);
  if (active[0]) return { kind: "conflict", job: serializeJob(active[0]) };

  try {
    const [created] = await context.db
      .insert(syncJobs)
      .values({
        userId: context.userId,
        jobType,
        status: "pending",
        cursor,
        recordsProcessed: 0,
      })
      .returning();
    if (!created) throw new Error("Sync job was not created");
    return continueSyncJob(context, created.id);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const [existing] = await context.db
      .select()
      .from(syncJobs)
      .where(and(eq(syncJobs.userId, context.userId), or(eq(syncJobs.status, "pending"), eq(syncJobs.status, "running"))))
      .limit(1);
    return { kind: "conflict", job: existing ? serializeJob(existing) : null };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error != null && "code" in error && error.code === "23505";
}

async function processAcquiredJob(context: SyncContext, job: JobRow): Promise<SyncJobResponse> {
  const cursor = readCursor(job.cursor);
  const access = await resolveAccessToken(context);
  if (!access.ok) {
    return failJob(context, job, cursor.page, access.message, access.reconnect);
  }

  const page = await fetchActivityPage(access.token, {
    page: cursor.page,
    perPage: PAGE_SIZE,
    after: cursor.after,
    before: cursor.before,
  });
  if (!page.ok) {
    if (page.status === 429 || shouldPauseForRateLimit(page.rateLimit).pause) {
      return pauseJob(context, job, cursor.page, page.message, page.rateLimit);
    }
    if (page.status === 401) return failJob(context, job, cursor.page, page.message, true);
    return failJob(context, job, cursor.page, page.message, false);
  }

  const normalized = page.data.map((item) => normalizeActivity(item));
  const saved = await upsertActivities(context.db, context.userId, normalized);
  const outcome = nextPageOutcome(cursor.page, normalized.length);
  const pause = outcome.status === "pending" ? shouldPauseForRateLimit(page.rateLimit) : { pause: false, retryAfterSeconds: 0 };
  const now = new Date();
  const nextCursor: SyncCursor = { ...cursor, page: outcome.nextPage };
  const [updated] = await context.db
    .update(syncJobs)
    .set({
      status: outcome.status === "completed" ? "completed" : "pending",
      cursor: nextCursor,
      recordsProcessed: job.recordsProcessed + saved,
      retryAfter: pause.pause ? new Date(now.getTime() + pause.retryAfterSeconds * 1000) : null,
      leaseUntil: null,
      error: null,
      completedAt: outcome.status === "completed" ? now : null,
      updatedAt: now,
    })
    .where(eq(syncJobs.id, job.id))
    .returning();
  await writeLog(context.db, {
    job,
    page: cursor.page,
    recordsProcessed: saved,
    status: "ok",
    rateLimit: page.rateLimit,
    error: null,
  });
  return serializeJob(updated ?? job);
}

async function resolveAccessToken(context: SyncContext): Promise<{ ok: true; token: string } | { ok: false; message: string; reconnect: boolean }> {
  const [connection] = await context.db
    .select()
    .from(stravaConnections)
    .where(eq(stravaConnections.userId, context.userId))
    .limit(1);
  if (!connection) return { ok: false, message: "Strava is not connected", reconnect: true };

  const currentAccess = await decryptSecret(connection.accessTokenEncrypted, context.tokenKey);
  if (!shouldRefreshToken(connection.expiresAt, new Date())) return { ok: true, token: currentAccess };

  const refreshToken = await decryptSecret(connection.refreshTokenEncrypted, context.tokenKey);
  const refreshed = await refreshStravaToken(context.credentials, refreshToken);
  if (!refreshed.ok) {
    if (refreshed.status === 400 || refreshed.status === 401) {
      await context.db.delete(stravaConnections).where(eq(stravaConnections.userId, context.userId));
    }
    return { ok: false, message: refreshed.message, reconnect: refreshed.status === 400 || refreshed.status === 401 };
  }

  await context.db
    .update(stravaConnections)
    .set({
      accessTokenEncrypted: await encryptSecret(refreshed.data.accessToken, context.tokenKey),
      refreshTokenEncrypted: await encryptSecret(refreshed.data.refreshToken, context.tokenKey),
      expiresAt: refreshed.data.expiresAt,
      scope: refreshed.data.scope,
      updatedAt: new Date(),
    })
    .where(eq(stravaConnections.id, connection.id));
  return { ok: true, token: refreshed.data.accessToken };
}

async function pauseJob(
  context: SyncContext,
  job: JobRow,
  page: number,
  message: string,
  rateLimit: RateLimitSnapshot,
): Promise<SyncJobResponse> {
  const pause = shouldPauseForRateLimit(rateLimit);
  const retryAfterSeconds = pause.retryAfterSeconds > 0 ? pause.retryAfterSeconds : 15 * 60;
  const now = new Date();
  const [updated] = await context.db
    .update(syncJobs)
    .set({
      status: "pending",
      retryAfter: new Date(now.getTime() + retryAfterSeconds * 1000),
      leaseUntil: null,
      error: message,
      updatedAt: now,
    })
    .where(eq(syncJobs.id, job.id))
    .returning();
  await writeLog(context.db, {
    job,
    page,
    recordsProcessed: 0,
    status: "rate_limited",
    rateLimit,
    error: message,
  });
  return serializeJob(updated ?? job);
}

async function failJob(context: SyncContext, job: JobRow, page: number, message: string, reconnect: boolean): Promise<SyncJobResponse> {
  if (reconnect) {
    await context.db.delete(stravaConnections).where(eq(stravaConnections.userId, context.userId));
  }
  const [updated] = await context.db
    .update(syncJobs)
    .set({
      status: "failed",
      error: message,
      leaseUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(syncJobs.id, job.id))
    .returning();
  await writeLog(context.db, {
    job,
    page,
    recordsProcessed: 0,
    status: "error",
    rateLimit: emptyRateLimit(),
    error: message,
  });
  return serializeJob(updated ?? job);
}

async function acquireJob(db: Database, userId: string, jobId: string, now: Date): Promise<JobRow | undefined> {
  const [job] = await db
    .update(syncJobs)
    .set({
      status: "running",
      leaseUntil: new Date(now.getTime() + LEASE_MS),
      error: null,
      updatedAt: now,
      startedAt: sql`coalesce(${syncJobs.startedAt}, now())`,
    })
    .where(
      and(
        eq(syncJobs.id, jobId),
        eq(syncJobs.userId, userId),
        or(
          and(eq(syncJobs.status, "pending"), or(isNull(syncJobs.retryAfter), lte(syncJobs.retryAfter, now))),
          eq(syncJobs.status, "failed"),
          and(eq(syncJobs.status, "running"), or(isNull(syncJobs.leaseUntil), lte(syncJobs.leaseUntil, now))),
        ),
      ),
    )
    .returning();
  return job;
}

async function findJob(db: Database, userId: string, jobId: string): Promise<JobRow | undefined> {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(and(eq(syncJobs.id, jobId), eq(syncJobs.userId, userId)))
    .limit(1);
  return job;
}

async function writeLog(
  db: Database,
  input: {
    job: JobRow;
    page: number;
    recordsProcessed: number;
    status: string;
    rateLimit: RateLimitSnapshot;
    error: string | null;
  },
) {
  await db.insert(syncLogs).values({
    jobId: input.job.id,
    userId: input.job.userId,
    jobType: input.job.jobType,
    page: input.page,
    recordsProcessed: input.recordsProcessed,
    status: input.status,
    readRateUsage: input.rateLimit.usageHeader,
    readRateLimit: input.rateLimit.limitHeader,
    error: input.error,
  });
  console.log(
    JSON.stringify({
      event: "sync_page",
      jobId: input.job.id,
      userId: input.job.userId,
      page: input.page,
      records: input.recordsProcessed,
      status: input.status,
    }),
  );
}

function serializeJob(row: JobRow): SyncJobResponse {
  const cursor = readCursor(row.cursor);
  return syncJobSchema.parse({
    id: row.id,
    jobType: row.jobType,
    status: row.status,
    page: cursor.page,
    recordsProcessed: row.recordsProcessed,
    error: row.error,
    retryAfter: row.retryAfter ? row.retryAfter.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  });
}

function readCursor(value: SyncCursor | null): SyncCursor {
  if (!value || typeof value.page !== "number" || value.page < 1) return { page: 1 };
  return value;
}

function emptyRateLimit(): RateLimitSnapshot {
  return readRateLimit(200, new Headers());
}
