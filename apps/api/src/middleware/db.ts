import type { Context } from "hono";
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
    const closing = state.client?.close();
    if (closing) {
      const done = closing.catch(() => undefined);
      // A streaming response must be returned before this connection closes.
      // Waiting here holds the chat reply until the client gives up.
      // Reading `executionCtx` throws when the Node server has no Workers context.
      const pending = runAfterResponse(c, done);
      if (pending) await pending;
    }
  }
});

function runAfterResponse(c: Context, task: Promise<void>): Promise<void> | undefined {
  try {
    c.executionCtx.waitUntil(task);
    return undefined;
  } catch (error) {
    if (error instanceof Error && error.message === "This context has no ExecutionContext") return task;
    throw error;
  }
}
