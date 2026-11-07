import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/index.ts";
import type { AppBindings, AppVariables } from "../env.ts";
import { accountRole, accountStatus, archiveUserId } from "../services/auth/athlete.ts";
import { signSession, verifySession } from "../services/crypto/session.ts";

export const SESSION_COOKIE = "coach_session";
export const STATE_COOKIE = "coach_oauth_state";
export const VIEW_COOKIE = "coach_view";

export const requireUser = createMiddleware<{ Bindings: AppBindings; Variables: AppVariables }>(async (c, next) => {
  const actorId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!actorId) return c.json({ error: "Unauthorized" }, 401);
  const db = await c.var.openDb();
  const [actor] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);
  const role = actor ? accountRole(actor.role) : null;
  const status = actor ? accountStatus(actor.status) : null;
  if (!actor || !role || status !== "approved") return c.json({ error: "Forbidden" }, 403);

  let viewed: { id: string; role: string; status: string } | null = null;
  if (role === "owner") {
    const viewedId = await readViewUserId(c.env.SESSION_SECRET, getCookie(c, VIEW_COOKIE));
    if (viewedId && viewedId !== actor.id) {
      const [target] = await db
        .select({ id: users.id, role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, viewedId))
        .limit(1);
      viewed = target ?? null;
    }
  }

  c.set("actorId", actor.id);
  c.set("role", role);
  c.set("userId", archiveUserId(actor, viewed));
  await next();
});

export async function readUserId(secret: string, token: string | undefined): Promise<string | null> {
  if (!token || !secret) return null;
  return verifySession(token, secret);
}

const VIEW_PREFIX = "view:";

export async function signView(userId: string, secret: string): Promise<string> {
  return signSession(`${VIEW_PREFIX}${userId}`, secret);
}

export async function readViewUserId(secret: string, token: string | undefined): Promise<string | null> {
  const value = await readUserId(secret, token);
  if (!value?.startsWith(VIEW_PREFIX)) return null;
  return value.slice(VIEW_PREFIX.length);
}
