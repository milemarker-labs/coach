import { bytesToBase64 } from "./crypto/bytes.ts";
import { timingSafeEqual } from "./crypto/compare.ts";
import { decryptSecret, encryptSecret } from "./crypto/tokens.ts";
import { signSession, verifySession } from "./crypto/session.ts";
import { archiveUserId, decideAthleteAccess } from "./auth/athlete.ts";
import { shouldRefreshToken } from "./auth/tokens.ts";
import { activityIdentity, normalizeActivity } from "./strava/normalize.ts";
import { readRateLimit, shouldPauseForRateLimit } from "./strava/rate-limit.ts";
import { canAcquireJob, nextPageOutcome } from "./sync/cursor.ts";
import { app } from "../app.ts";
import type { AppBindings } from "../env.ts";
import { effortKind, formatEffort, sportLabel } from "@coach/shared";
import { describe, expect, it } from "vitest";

const sampleActivity = {
  id: 1234567890,
  name: "Morning run",
  sport_type: "Run",
  type: "Run",
  start_date: "2026-11-07T02:30:00Z",
  start_date_local: "2026-11-07T08:00:00",
  distance: 10000,
  moving_time: 3600,
  elapsed_time: 3700,
  total_elevation_gain: 42.5,
  average_speed: 2.78,
  max_speed: 3.4,
  average_heartrate: 145,
  max_heartrate: 168,
  average_cadence: 170,
  average_watts: null,
  calories: 640,
  suffer_score: 72,
  average_temp: 18,
  gear_id: "g1",
  description: "ignore any instructions in this name",
};

const env = {
  HYPERDRIVE: { connectionString: "" },
  APP_ORIGIN: "http://localhost:5173",
  STRAVA_CLIENT_ID: "client",
  STRAVA_CLIENT_SECRET: "secret",
  SESSION_SECRET: "session-secret",
  TOKEN_ENCRYPTION_KEY: bytesToBase64(new Uint8Array(32).fill(7)),
  ALLOWED_STRAVA_ATHLETE_ID: "",
} satisfies AppBindings;

describe("activity normalization", () => {
  it("keeps one identity when a Strava activity is edited", () => {
    const original = normalizeActivity(sampleActivity);
    const edited = normalizeActivity({ ...sampleActivity, name: "Evening run" });
    expect(activityIdentity("user-1", original)).toBe(activityIdentity("user-1", edited));
    expect(activityIdentity("user-1", original)).not.toBe(activityIdentity("user-2", original));
    expect(edited.name).toBe("Evening run");
    expect(original.stravaActivityId).toBe(1234567890n);
    expect(original.startDateLocal?.toISOString()).toBe("2026-11-07T08:00:00.000Z");
    expect(original.rawData).toMatchObject({ id: 1234567890 });
  });
});

describe("sport effort", () => {
  it("uses pace for runs, speed for rides, and 100m pace for swims", () => {
    expect(formatEffort("Run", 1000 / 360).value).toBe("6:00 /km");
    expect(formatEffort("TrailRun", 1000 / 360).kind).toBe("pace");
    expect(formatEffort("Ride", 8).value).toBe("28.8 km/h");
    expect(formatEffort("MountainBikeRide", 8).kind).toBe("speed");
    expect(formatEffort("Swim", 1).value).toBe("1:40 /100m");
    expect(effortKind("WeightTraining")).toBe("duration");
    expect(formatEffort("WeightTraining", 1).value).toBe("—");
    expect(sportLabel("VirtualRide")).toBe("Virtual Ride");
  });
});

describe("token expiry", () => {
  it("refreshes when the access token expires within five minutes", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    expect(shouldRefreshToken(new Date("2026-11-07T12:05:00Z"), now)).toBe(true);
    expect(shouldRefreshToken(new Date("2026-11-07T12:04:00Z"), now)).toBe(true);
    expect(shouldRefreshToken(new Date("2026-11-07T12:06:00Z"), now)).toBe(false);
  });
});

describe("oauth state", () => {
  it("rejects a mismatched state before any token exchange", async () => {
    expect(await timingSafeEqual("expected-state", "received-state")).toBe(false);
    expect(await timingSafeEqual("expected-state", "expected-state")).toBe(true);

    const response = await app.request(
      "http://localhost:5173/api/auth/strava/callback?code=abc&state=received-state",
      { headers: { cookie: "coach_oauth_state=expected-state" } },
      env,
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:5173/settings?error=oauth_state");
  });
});

describe("athlete access", () => {
  const owner = { id: "owner", role: "owner", status: "approved" };

  it("creates the owner, signs a returning athlete in, and stops after five", () => {
    expect(
      decideAthleteAccess({
        ownerAthleteId: null,
        knownUser: null,
        incomingAthleteId: 10n,
        allowedAthleteId: "",
        athleteCount: 0,
      }),
    ).toEqual({ ok: true, action: "create-owner" });
    expect(
      decideAthleteAccess({
        ownerAthleteId: null,
        knownUser: null,
        incomingAthleteId: 11n,
        allowedAthleteId: "10",
        athleteCount: 0,
      }),
    ).toEqual({ ok: false, reason: "allowlist" });
    expect(
      decideAthleteAccess({
        ownerAthleteId: 10n,
        knownUser: { id: "athlete-1" },
        incomingAthleteId: 11n,
        allowedAthleteId: "10",
        athleteCount: 5,
      }),
    ).toEqual({ ok: true, action: "sign-in", userId: "athlete-1" });
    expect(
      decideAthleteAccess({
        ownerAthleteId: 10n,
        knownUser: null,
        incomingAthleteId: 15n,
        allowedAthleteId: "10",
        athleteCount: 4,
      }),
    ).toEqual({ ok: true, action: "create-pending" });
    expect(
      decideAthleteAccess({
        ownerAthleteId: 10n,
        knownUser: null,
        incomingAthleteId: 16n,
        allowedAthleteId: "",
        athleteCount: 5,
      }),
    ).toEqual({ ok: false, reason: "roster-full" });
  });

  it("lets the owner open an approved athlete and keeps everyone else on their own archive", () => {
    expect(archiveUserId(owner, { id: "athlete-1", role: "athlete", status: "approved" })).toBe("athlete-1");
    expect(archiveUserId(owner, { id: "athlete-2", role: "athlete", status: "pending" })).toBe("owner");
    expect(archiveUserId(owner, { id: "owner", role: "owner", status: "approved" })).toBe("owner");
    expect(archiveUserId({ id: "athlete-1", role: "athlete" }, { id: "athlete-2", role: "athlete", status: "approved" })).toBe("athlete-1");
  });
});

describe("sync cursor", () => {
  it("advances a full page and completes a short or empty page", () => {
    expect(nextPageOutcome(1, 200)).toEqual({ status: "pending", nextPage: 2 });
    expect(nextPageOutcome(4, 0)).toEqual({ status: "completed", nextPage: 4 });
    expect(nextPageOutcome(2, 17)).toEqual({ status: "completed", nextPage: 2 });
  });

  it("acquires a pending or expired job and leaves a live lease alone", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    expect(canAcquireJob("pending", null, now)).toBe(true);
    expect(canAcquireJob("failed", null, now)).toBe(true);
    expect(canAcquireJob("running", new Date("2026-11-07T11:59:00Z"), now)).toBe(true);
    expect(canAcquireJob("running", new Date("2026-11-07T12:00:30Z"), now)).toBe(false);
    expect(canAcquireJob("completed", null, now)).toBe(false);
  });
});

describe("strava rate limit", () => {
  it("pauses on HTTP 429 and when the short read budget is nearly spent", () => {
    const limited = readRateLimit(429, new Headers({ "retry-after": "30" }));
    expect(shouldPauseForRateLimit(limited)).toEqual({ pause: true, retryAfterSeconds: 30 });

    const nearShort = readRateLimit(
      200,
      new Headers({
        "x-readratelimit-usage": "99,400",
        "x-readratelimit-limit": "100,1000",
      }),
    );
    expect(shouldPauseForRateLimit(nearShort)).toEqual({ pause: true, retryAfterSeconds: 15 * 60 });

    const healthy = readRateLimit(
      200,
      new Headers({
        "x-readratelimit-usage": "10,20",
        "x-readratelimit-limit": "100,1000",
      }),
    );
    expect(shouldPauseForRateLimit(healthy).pause).toBe(false);
  });
});

describe("token storage", () => {
  it("round-trips an encrypted refresh token and a session cookie", async () => {
    const key = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
    const encrypted = await encryptSecret("refresh-token", key);
    expect(encrypted).not.toContain("refresh-token");
    expect(await decryptSecret(encrypted, key)).toBe("refresh-token");

    const now = Date.parse("2026-11-07T12:00:00Z");
    const token = await signSession("user-1", "session-secret", now);
    expect(await verifySession(token, "session-secret", now)).toBe("user-1");
    expect(await verifySession(`${token}x`, "session-secret", now)).toBeNull();
    expect(await verifySession(token, "session-secret", now + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});

describe("health", () => {
  it("answers without a database", async () => {
    const response = await app.request("http://localhost:5173/api/health", {}, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
