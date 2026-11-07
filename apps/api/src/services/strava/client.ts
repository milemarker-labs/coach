import { readRateLimit, type RateLimitSnapshot } from "./rate-limit.ts";
import { toBigIntId } from "./normalize.ts";

const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const TOKEN_URL = "https://www.strava.com/oauth/token";
const ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";
export const STRAVA_SCOPE = "read,activity:read_all";

export interface StravaCredentials {
  clientId: string;
  clientSecret: string;
}

export interface StravaToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  athlete: { id: bigint; displayName: string | null } | null;
}

export type StravaCall<T> =
  | { ok: true; data: T; rateLimit: RateLimitSnapshot }
  | { ok: false; status: number; message: string; rateLimit: RateLimitSnapshot };

export function buildAuthorizeUrl(input: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_SCOPE);
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function exchangeAuthorizationCode(
  credentials: StravaCredentials,
  code: string,
): Promise<StravaCall<StravaToken>> {
  return requestToken(credentials, { grant_type: "authorization_code", code });
}

export async function refreshStravaToken(
  credentials: StravaCredentials,
  refreshToken: string,
): Promise<StravaCall<StravaToken>> {
  return requestToken(credentials, { grant_type: "refresh_token", refresh_token: refreshToken });
}

export async function fetchActivityPage(
  accessToken: string,
  query: { page: number; perPage: number; after?: number; before?: number },
): Promise<StravaCall<unknown[]>> {
  const url = new URL(ACTIVITIES_URL);
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("per_page", String(query.perPage));
  if (query.after != null) url.searchParams.set("after", String(query.after));
  if (query.before != null) url.searchParams.set("before", String(query.before));

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const rateLimit = readRateLimit(response.status, response.headers);
  const body = await readJson(response);
  if (!response.ok) {
    return { ok: false, status: response.status, message: stravaMessage(body, response.status), rateLimit };
  }
  if (!Array.isArray(body)) {
    return { ok: false, status: response.status, message: "Strava activity list was not an array", rateLimit };
  }
  return { ok: true, data: body, rateLimit };
}

async function requestToken(
  credentials: StravaCredentials,
  fields: Record<string, string>,
): Promise<StravaCall<StravaToken>> {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    ...fields,
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const rateLimit = readRateLimit(response.status, response.headers);
  const payload = await readJson(response);
  if (!response.ok) {
    return { ok: false, status: response.status, message: stravaMessage(payload, response.status), rateLimit };
  }
  const token = parseToken(payload);
  if (!token) {
    return { ok: false, status: response.status, message: "Strava token response was incomplete", rateLimit };
  }
  return { ok: true, data: token, rateLimit };
}

function parseToken(payload: unknown): StravaToken | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.access_token !== "string" || typeof payload.refresh_token !== "string") return null;
  const expiresAtSeconds = typeof payload.expires_at === "number" ? payload.expires_at : null;
  if (expiresAtSeconds == null) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: new Date(expiresAtSeconds * 1000),
    scope: typeof payload.scope === "string" && payload.scope.length > 0 ? payload.scope : STRAVA_SCOPE,
    athlete: parseAthlete(payload.athlete),
  };
}

function parseAthlete(value: unknown): StravaToken["athlete"] {
  if (!isRecord(value) || value.id == null) return null;
  try {
    const first = typeof value.firstname === "string" ? value.firstname.trim() : "";
    const last = typeof value.lastname === "string" ? value.lastname.trim() : "";
    const displayName = `${first} ${last}`.trim();
    return { id: toBigIntId(value.id), displayName: displayName.length > 0 ? displayName : null };
  } catch {
    return null;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function stravaMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message.slice(0, 300);
  }
  return `Strava request failed (${status})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
