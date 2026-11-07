# Architecture

Coach is a personal training archive for every sport Strava records. This repository currently implements the foundation: a Vite interface and a Cloudflare Worker API that connect one Strava athlete, import activity summaries, and store them in PostgreSQL.

## Boundaries

- `apps/web` renders the interface. It talks only to `/api` on the same origin.
- `apps/api` owns HTTP, Strava OAuth, sync jobs, and database access.
- `packages/shared` holds the Zod contracts both sides compile against.
- Analytics calculations and model providers are not in this repository yet. Route handlers must not invent training metrics or call a model.

The production host is `coach.milemarklabs.com`. One Worker serves the built interface as static assets and handles `/api/*` first, so the session cookie, OAuth callback, and API share one site.

Locally, Vite on port 3000 proxies `/api` to a Node API on port 4000. Open `http://localhost:3000`. Set `APP_ORIGIN` to that URL so Strava returns there. The local API uses Node's Postgres driver and `DATABASE_URL`, because the Workers runtime on this machine cannot complete a TLS connection to Neon. `wrangler deploy --env production` still runs the Worker and connects through Hyperdrive.

## Web interface

The interface uses the Titanium Noir design system. Its tokens are CSS variables in `apps/web/src/index.css`; charts read the same variables through `src/lib/tokens.ts`. Champagne bronze is the only brand accent. Semantic colors (success, warning, danger, information) are kept apart from it.

- `src/data` holds data access. `mode.ts` decides between `live` (Strava connected) and `demo` (not connected, API unreachable, or `VITE_DEMO_DATA=true`). Demo activities are generated in `src/data/mock`, have the API's exact shape, and are always announced by a banner. They are never mixed with live data.
- `src/features/analytics/calculations` holds pure functions: weekly and monthly volume, training load, fitness/fatigue/form, pace and heart rate series, activity comparison. They have unit tests (`pnpm --filter @coach/web test`). Components never calculate.
- Training load is the Strava suffer score when an activity has one, otherwise one point per moving minute. The charts state how much of a figure is estimated.
- Per-kilometer splits are not stored by the API yet, so live activities show an unavailable state. Only demo activities have splits.

## Data path

Strava summaries are normalized in TypeScript, then upserted on `(user_id, strava_activity_id)`. A repeated import updates the existing row. Historical import fetches one page of 200 activities per request and stores the next page on the job. The import screen calls continue until the job completes, pauses for a rate limit, or fails. Incremental sync uses the same job runner with a seven-day overlap.

The Worker does not call `localhost:11434`. Local models, when they are added, belong behind a separate gateway.

## Runtime

- Hono on Cloudflare Workers, `nodejs_compat`, compatibility date `2026-11-07`.
- Neon PostgreSQL. Locally the Worker uses `DATABASE_URL`. Production uses Hyperdrive via `wrangler deploy --env production`. The Worker opens a postgres.js client per request and closes it before the response finishes.
- Drizzle migrations run from Node with `DATABASE_URL`. They do not go through Hyperdrive.
- Secrets (`STRAVA_CLIENT_SECRET`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`) are Wrangler secrets. The local Hyperdrive URL is the process environment variable `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, loaded from `apps/api/.env` by the dev script. It is not written into `wrangler.jsonc`.

## Single athlete

The first successful Strava connection creates the only user. A later connection with a different athlete id is rejected. `ALLOWED_STRAVA_ATHLETE_ID` can pin the allowed athlete before the site is public. The `users.singleton` column is unique so the database also holds one account.

## Commands

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm --filter @coach/web build
pnpm --filter @coach/api exec wrangler deploy
```

Deploy only after Neon, Hyperdrive, the `coach.milemarklabs.com` DNS zone, and the production Strava app exist. Replace the placeholder Hyperdrive id in `apps/api/wrangler.jsonc` before deploying.

Create two Strava applications. Strava stores one callback domain per app:

- Coach Dev: callback domain `localhost`, redirect `http://localhost:3000/api/auth/strava/callback`
- Coach: callback domain `coach.milemarklabs.com`, redirect `https://coach.milemarklabs.com/api/auth/strava/callback`

Request the scope `read,activity:read_all`.

Generate secrets with:

```bash
node -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"
```

Use a different random value for `SESSION_SECRET`. Put the 32-byte key in `TOKEN_ENCRYPTION_KEY`.
