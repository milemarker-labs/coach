import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { athleteRosterSchema, athleteViewRequestSchema, athleteViewResponseSchema } from "@coach/shared";
import { users } from "../db/schema/index.ts";
import { secureCookie, type AppBindings, type AppVariables } from "../env.ts";
import { VIEW_COOKIE, readViewUserId, requireUser, signView } from "../middleware/session.ts";
import { ATHLETE_LIMIT } from "../services/auth/athlete.ts";

export const athleteRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

athleteRoutes.use("*", requireUser);
athleteRoutes.use("*", async (c, next) => {
  if (c.var.role !== "owner") return c.json({ error: "Forbidden" }, 403);
  await next();
});

athleteRoutes.get("/", async (c) => {
  const db = await c.var.openDb();
  const rows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      athleteId: users.stravaAthleteId,
      status: users.status,
    })
    .from(users)
    .where(eq(users.role, "athlete"))
    .orderBy(asc(users.createdAt));
  return c.json(
    athleteRosterSchema.parse({
      limit: ATHLETE_LIMIT,
      athletes: rows.flatMap((row) =>
        row.status === "pending" || row.status === "approved"
          ? [{ userId: row.userId, displayName: row.displayName, athleteId: row.athleteId.toString(), status: row.status }]
          : [],
      ),
    }),
  );
});

athleteRoutes.post("/view", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = athleteViewRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid athlete" }, 400);
  if (parsed.data.userId == null) {
    deleteCookie(c, VIEW_COOKIE, { path: "/" });
    return c.json(athleteViewResponseSchema.parse({ viewing: null }));
  }

  const db = await c.var.openDb();
  const [target] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      athleteId: users.stravaAthleteId,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.id, parsed.data.userId), eq(users.role, "athlete"), eq(users.status, "approved")))
    .limit(1);
  if (!target) return c.json({ error: "Athlete not found" }, 404);

  setCookie(c, VIEW_COOKIE, await signView(target.id, c.env.SESSION_SECRET), {
    httpOnly: true,
    secure: secureCookie(c.env),
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.json(
    athleteViewResponseSchema.parse({
      viewing: { userId: target.id, displayName: target.displayName, athleteId: target.athleteId.toString() },
    }),
  );
});

athleteRoutes.post("/:id/approve", async (c) => {
  const id = userIdParam(c.req.param("id"));
  if (!id) return c.json({ error: "Athlete not found" }, 404);
  const db = await c.var.openDb();
  const [updated] = await db
    .update(users)
    .set({ status: "approved", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.role, "athlete")))
    .returning({ id: users.id });
  if (!updated) return c.json({ error: "Athlete not found" }, 404);
  return c.json({ ok: true });
});

athleteRoutes.post("/:id/deny", async (c) => {
  const id = userIdParam(c.req.param("id"));
  if (!id) return c.json({ error: "Athlete not found" }, 404);
  const db = await c.var.openDb();
  const [removed] = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.role, "athlete"), eq(users.status, "pending")))
    .returning({ id: users.id });
  if (!removed) return c.json({ error: "Athlete not found" }, 404);
  return c.json({ ok: true });
});

athleteRoutes.delete("/:id", async (c) => {
  const id = userIdParam(c.req.param("id"));
  if (!id) return c.json({ error: "Athlete not found" }, 404);
  const db = await c.var.openDb();
  const [removed] = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.role, "athlete"), eq(users.status, "approved")))
    .returning({ id: users.id });
  if (!removed) return c.json({ error: "Athlete not found" }, 404);
  const viewed = await readViewUserId(c.env.SESSION_SECRET, getCookie(c, VIEW_COOKIE));
  if (viewed === id) deleteCookie(c, VIEW_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

function userIdParam(value: string): string | null {
  const parsed = z.uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}
