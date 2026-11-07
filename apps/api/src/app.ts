import { Hono } from "hono";
import type { AppBindings, AppVariables } from "./env.ts";
import { dbMiddleware } from "./middleware/db.ts";
import { activityRoutes } from "./routes/activities.ts";
import { authRoutes } from "./routes/auth.ts";
import { syncRoutes } from "./routes/sync.ts";
import { safeErrorMessage } from "./services/errors.ts";

export const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

app.use("/api/*", dbMiddleware);

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/activities", activityRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  console.log(JSON.stringify({ event: "api_error", message: safeErrorMessage(error) }));
  return c.json({ error: "Internal error" }, 500);
});
