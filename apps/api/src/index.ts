import { app } from "./app.ts";
import type { AppBindings } from "./env.ts";

export default {
  fetch(request: Request, env: AppBindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
