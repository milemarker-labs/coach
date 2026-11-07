import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { count, eq } from "drizzle-orm";
import { authStatusSchema, type AuthStatus } from "@coach/shared";
import { stravaConnections, users } from "../db/schema/index.ts";
import { appOrigin, secureCookie, type AppBindings, type AppVariables } from "../env.ts";
import { SESSION_COOKIE, STATE_COOKIE, VIEW_COOKIE, readUserId, readViewUserId } from "../middleware/session.ts";
import { accountRole, accountStatus, archiveUserId, decideAthleteAccess } from "../services/auth/athlete.ts";
import { timingSafeEqual } from "../services/crypto/compare.ts";
import { encryptSecret } from "../services/crypto/tokens.ts";
import { signSession } from "../services/crypto/session.ts";
import { buildAuthorizeUrl, exchangeAuthorizationCode, STRAVA_SCOPE } from "../services/strava/client.ts";

export const authRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

const signedOut: AuthStatus = {
  connected: false,
  athleteId: null,
  displayName: null,
  expiresAt: null,
  role: null,
  status: null,
  viewing: null,
};

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
  const incomingAthleteId = exchanged.data.athlete.id;
  const [known] = await db.select().from(users).where(eq(users.stravaAthleteId, incomingAthleteId)).limit(1);
  const [owner] = await db
    .select({ stravaAthleteId: users.stravaAthleteId })
    .from(users)
    .where(eq(users.role, "owner"))
    .limit(1);
  const [athleteRows] = await db.select({ value: count() }).from(users).where(eq(users.role, "athlete"));
  const decision = decideAthleteAccess({
    ownerAthleteId: owner?.stravaAthleteId ?? null,
    knownUser: known ? { id: known.id } : null,
    incomingAthleteId,
    allowedAthleteId: c.env.ALLOWED_STRAVA_ATHLETE_ID,
    athleteCount: Number(athleteRows?.value ?? 0),
  });
  if (!decision.ok) {
    const error = decision.reason === "roster-full" ? "roster_full" : "athlete_locked";
    return c.redirect(`${origin}/settings?error=${error}`);
  }

  const displayName = exchanged.data.athlete.displayName;
  const user =
    decision.action === "sign-in"
      ? (await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, decision.userId)).returning())[0]
      : (await db
          .insert(users)
          .values({
            displayName,
            stravaAthleteId: incomingAthleteId,
            role: decision.action === "create-owner" ? "owner" : "athlete",
            status: decision.action === "create-owner" ? "approved" : "pending",
          })
          .returning())[0];
  if (!user) return c.redirect(`${origin}/settings?error=strava`);

  const tokenValues = {
    athleteId: incomingAthleteId,
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
  deleteCookie(c, VIEW_COOKIE, { path: "/" });
  const destination = user.status === "pending" ? "/waiting" : "/";
  return c.redirect(`${origin}${destination}`);
});

authRoutes.get("/strava/status", async (c) => {
  const userId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!userId) return c.json(authStatusSchema.parse(signedOut));
  const db = await c.var.openDb();
  const [row] = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      displayName: users.displayName,
      athleteId: users.stravaAthleteId,
      expiresAt: stravaConnections.expiresAt,
    })
    .from(users)
    .leftJoin(stravaConnections, eq(stravaConnections.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  const role = row ? accountRole(row.role) : null;
  const status = row ? accountStatus(row.status) : null;
  if (!row || !role || !status) return c.json(authStatusSchema.parse(signedOut));

  let viewing: AuthStatus["viewing"] = null;
  if (role === "owner") {
    const viewedId = await readViewUserId(c.env.SESSION_SECRET, getCookie(c, VIEW_COOKIE));
    if (viewedId) {
      const [target] = await db
        .select({
          id: users.id,
          role: users.role,
          status: users.status,
          displayName: users.displayName,
          athleteId: users.stravaAthleteId,
        })
        .from(users)
        .where(eq(users.id, viewedId))
        .limit(1);
      if (target && archiveUserId(row, target) !== row.id) {
        viewing = {
          userId: target.id,
          displayName: target.displayName,
          athleteId: target.athleteId.toString(),
        };
      }
    }
  }

  return c.json(
    authStatusSchema.parse({
      connected: row.expiresAt != null,
      athleteId: row.athleteId.toString(),
      displayName: row.displayName,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      role,
      status,
      viewing,
    }),
  );
});

authRoutes.delete("/strava", async (c) => {
  const userId = await readUserId(c.env.SESSION_SECRET, getCookie(c, SESSION_COOKIE));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = await c.var.openDb();
  await db.delete(stravaConnections).where(eq(stravaConnections.userId, userId));
  return c.json(authStatusSchema.parse(signedOut));
});
