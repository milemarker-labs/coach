import { createMiddleware } from "hono/factory";
import { createDatabase } from "../db/index.ts";
import { databaseConnectionString, type AppBindings, type AppVariables } from "../env.ts";

export const dbMiddleware = createMiddleware<{ Bindings: AppBindings; Variables: AppVariables }>(async (c, next) => {
  const state: { client: ReturnType<typeof createDatabase> | null } = { client: null };
  c.set("openDb", async () => {
    if (state.client) return state.client.db;
    state.client = createDatabase(databaseConnectionString(c.env));
    return state.client.db;
  });
  try {
    await next();
  } finally {
    await state.client?.close();
  }
});
