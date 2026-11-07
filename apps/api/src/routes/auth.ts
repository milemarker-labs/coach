import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { authStatusSchema } from "@coach/shared";
import { stravaConnections, users } from "../db/schema/index.ts";
import { appOrigin, secureCookie, type AppBindings, type AppVariables } from "../env.ts";
import { SESSION_COOKIE, STATE_COOKIE } from "../middleware/session.ts";
import { readUserId } from "../middleware/session.ts";
import { decideAthleteAccess } from "../services/auth/athlete.ts";
import { timingSafeEqual } from "../services/crypto/compare.ts";
import { encryptSecret } from "../services/crypto/tokens.ts";
import { signSession } from "../services/crypto/session.ts";
import { buildAuthorizeUrl, exchangeAuthorizationCode, STRAVA_SCOPE } from "../services/strava/client.ts";

export const authRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

authRoutes.get("/strava", (c) => {
  const state = crypto.randomUUID();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: secureCookie(c.env),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  const redirectUri = `${appOrigin(c.env)}/api/auth/strava/callback`;
  return c.redirect(buildAuthorizeUrl({ clientId: c.env.STRAVA_CLIENT_ID, redirectUri, state }));
});

authRoutes.get("/strava/callback", async (c) => {
  const origin = appOrigin(c.env);
  const expected = getCookie(c, STATE_COOKIE);
  const received = c.req.query("state");
  deleteCookie(c, STATE_COOKIE, { path: "/" });
  if (!expected || !received || !(await timingSafeEqual(expected, received))) {
    return c.redirect(`${origin}/settings?error=oauth_state`);
  }
  if (c.req.query("error")) {
    return c.redirect(`${origin}/settings?error=access_denied`);
  }
  const code = c.req.query("code");
  if (!code) return c.redirect(`${origin}/settings?error=strava`);

  const exchanged = await exchangeAuthorizationCode(
    { clientId: c.env.STRAVA_CLIENT_ID, clientSecret: c.env.STRAVA_CLIENT_SECRET },
    code,
  );
  if (!exchanged.ok || !exchanged.data.athlete) {
    return c.redirect(`${origin}/settings?error=strava`);
  }

  const db = await c.var.openDb();
  const [existing] = await db.select().from(users).limit(1);
  const decision = decideAthleteAccess({
    existingAthleteId: existing?.stravaAthleteId ?? null,
    incomingAthleteId: exchanged.data.athlete.id,
    allowedAthleteId: c.env.ALLOWED_STRAVA_ATHLETE_ID,
  });
  if (!decision.ok) return c.redirect(`${origin}/settings?error=athlete_locked`);

  const displayName = exchanged.data.athlete.displayName;
  const user = existing
    ? (await db
        .update(users)
        .set({ displayName, updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning())[0]
    : (await db
        .insert(users)
        .values({ displayName, stravaAthleteId: exchanged.data.athlete.id })
        .returning())[0];
  if (!user) return c.redirect(`${origin}/settings?error=strava`);

  const tokenValues = {
    athleteId: exchanged.data.athlete.id,
    accessTokenEncrypted: await encryptSecret(exchanged.data.accessToken, c.env.TOKEN_ENCRYPTION_KEY),
    refreshTokenEncrypted: await encryptSecret(exchanged.data.refreshToken, c.env.TOKEN_ENCRYPTION_KEY),
    expiresAt: exchanged.data.expiresAt,
    scope: exchanged.data.scope || STRAVA_SCOPE,
    updatedAt: new Date(),
  };
  await db
    .insert(stravaConnections)
    .values({ userId: user.id, ...tokenValues })
    .onConflictDoUpdate({
      target: stravaConnections.userId,
      set: tokenValues,
    });

  setCookie(c, SESSION_COOKIE, await signSession(user.id, c.env.SESSION_SECRET), {
    httpOnly: true,
    secure: secureCookie(c.env),
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.redirect(`${origin}/`);
});

authRoutes.get("/strava/status", async (c) => {
  const userId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!userId) {
    return c.json(authStatusSchema.parse({ connected: false, athleteId: null, displayName: null, expiresAt: null }));
  }
  const db = await c.var.openDb();
  const [row] = await db
    .select({
      displayName: users.displayName,
      athleteId: users.stravaAthleteId,
      expiresAt: stravaConnections.expiresAt,
    })
    .from(users)
    .leftJoin(stravaConnections, eq(stravaConnections.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) {
    return c.json(authStatusSchema.parse({ connected: false, athleteId: null, displayName: null, expiresAt: null }));
  }
  return c.json(
    authStatusSchema.parse({
      connected: row.expiresAt != null,
      athleteId: row.athleteId.toString(),
      displayName: row.displayName,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    }),
  );
});

authRoutes.delete("/strava", async (c) => {
  const userId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = await c.var.openDb();
  await db.delete(stravaConnections).where(eq(stravaConnections.userId, userId));
  return c.json(authStatusSchema.parse({ connected: false, athleteId: null, displayName: null, expiresAt: null }));
});
