import type { Database } from "./db/index.ts";

export type AppBindings = {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  APP_ORIGIN: string;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
  ALLOWED_STRAVA_ATHLETE_ID?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
};

export type AppVariables = {
  openDb: () => Promise<Database>;
  userId: string;
};

export function appOrigin(env: AppBindings): string {
  return env.APP_ORIGIN.replace(/\/$/, "");
}

export function secureCookie(env: AppBindings): boolean {
  return appOrigin(env).startsWith("https://");
}

export function databaseConnectionString(env: AppBindings): string {
  const direct = env.DATABASE_URL?.trim();
  if (direct) return direct;
  const hyperdrive = env.HYPERDRIVE?.connectionString?.trim();
  if (hyperdrive) return hyperdrive;
  throw new Error("Database is not configured");
}
