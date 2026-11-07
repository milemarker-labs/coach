import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppBindings, AppVariables } from "../env.ts";
import { verifySession } from "../services/crypto/session.ts";

export const SESSION_COOKIE = "coach_session";
export const STATE_COOKIE = "coach_oauth_state";

export const requireUser = createMiddleware<{ Bindings: AppBindings; Variables: AppVariables }>(async (c, next) => {
  const userId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  c.set("userId", userId);
  await next();
});

export async function readUserId(secret: string, token: string | undefined): Promise<string | null> {
  if (!token || !secret) return null;
  return verifySession(token, secret);
}
