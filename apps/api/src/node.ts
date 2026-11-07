import { serve } from "@hono/node-server";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./app.ts";
import type { AppBindings } from "./env.ts";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = loadBindings(apiRoot);

serve(
  {
    fetch: (request) => app.fetch(request, env),
    hostname: "127.0.0.1",
    port: Number(process.env.PORT ?? 4000),
  },
  (info) => {
    console.log(`API ready on http://${info.address}:${info.port}`);
  },
);

function loadBindings(root: string): AppBindings {
  const values = new Map<string, string>();
  readEnvFile(resolve(root, ".env"), values);
  readEnvFile(resolve(root, ".dev.vars"), values);
  return {
    APP_ORIGIN: values.get("APP_ORIGIN") ?? "http://localhost:3000",
    STRAVA_CLIENT_ID: values.get("STRAVA_CLIENT_ID") ?? "",
    STRAVA_CLIENT_SECRET: values.get("STRAVA_CLIENT_SECRET") ?? "",
    SESSION_SECRET: values.get("SESSION_SECRET") ?? "",
    TOKEN_ENCRYPTION_KEY: values.get("TOKEN_ENCRYPTION_KEY") ?? "",
    ALLOWED_STRAVA_ATHLETE_ID: values.get("ALLOWED_STRAVA_ATHLETE_ID") ?? "",
    DATABASE_URL: values.get("DATABASE_URL"),
  };
}

function readEnvFile(file: string, values: Map<string, string>) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
}
