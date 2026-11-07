import { historicalSyncRequestSchema } from "@coach/shared";
import { Hono } from "hono";
import type { AppBindings, AppVariables } from "../env.ts";
import { requireUser } from "../middleware/session.ts";
import {
  cancelSyncJob,
  continueSyncJob,
  getSyncJob,
  getSyncStatus,
  startHistoricalSync,
  startIncrementalSync,
  type JobAction,
} from "../services/sync/jobs.ts";

export const syncRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

syncRoutes.use("*", requireUser);

syncRoutes.get("/status", async (c) => {
  const db = await c.var.openDb();
  return c.json(await getSyncStatus(db, c.var.userId));
});

syncRoutes.post("/now", async (c) => {
  const db = await c.var.openDb();
  const result = await startIncrementalSync(syncContext(c, db));
  return jobResponse(c, result);
});

syncRoutes.post("/historical", async (c) => {
  const parsed = historicalSyncRequestSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);
  const db = await c.var.openDb();
  const result = await startHistoricalSync(syncContext(c, db), parsed.data);
  return jobResponse(c, result);
});

syncRoutes.get("/jobs/:id", async (c) => {
  const db = await c.var.openDb();
  const job = await getSyncJob(db, c.var.userId, c.req.param("id"));
  if (!job) return c.json({ error: "Not found" }, 404);
  return c.json(job);
});

syncRoutes.post("/jobs/:id/continue", async (c) => {
  const db = await c.var.openDb();
  const result = await continueSyncJob(syncContext(c, db), c.req.param("id"));
  return jobResponse(c, result);
});

syncRoutes.post("/jobs/:id/cancel", async (c) => {
  const db = await c.var.openDb();
  const result = await cancelSyncJob(db, c.var.userId, c.req.param("id"));
  return jobResponse(c, result);
});

function syncContext(c: { env: AppBindings; var: AppVariables }, db: Awaited<ReturnType<AppVariables["openDb"]>>) {
  return {
    db,
    userId: c.var.userId,
    credentials: { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
    tokenKey: c.env.TOKEN_ENCRYPTION_KEY,
  };
}

function jobResponse(c: { json: (body: unknown, status?: 400 | 404 | 409) => Response }, result: JobAction): Response {
  if (result.kind === "not_found") return c.json({ error: "Not found" }, 404);
  if (result.kind === "conflict") {
    return c.json({ error: "A sync is already running", job: result.job }, 409);
  }
  return c.json(result.job);
}
