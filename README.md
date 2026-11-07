# Coach

Coach is a personal training archive. It imports every sport Strava records, stores the activity summaries, and turns that history into load, form, charts, and a conversation with a local model.

The site is [coach.milemarkerlabs.com](https://coach.milemarkerlabs.com). The first successful Strava connection becomes the owner. Up to five other athletes can connect and wait for the owner's approval, then use their own archive. The owner can also open an approved athlete's archive. Anyone can read the owner's last seven days at `/mangesh` without signing in.

Agents should start at [/llms.txt](https://coach.milemarkerlabs.com/llms.txt). The home page and the journal have Markdown copies (`/index.md`, `/mangesh.md`). The live week is `GET /api/journal/mangesh`. Signed-in screens are disallowed in `robots.txt`.

## What you can do

Once Strava is connected, the signed-in app has:

- **Dashboard.** This week against the one before it: distance, time, elevation, recent sessions, training load, and a short coach note.
- **Activities.** Every imported sport, filtered by type and date, with a detail page for one session.
- **Training.** Fitness, fatigue, and form from the stored load, plus a longer view of how the weeks are going.
- **Insights.** Mileage, elevation, pace, and heart rate across three, six, or twelve months.
- **Chat Coach.** A streaming conversation grounded in the stored history. The model sees rolling seven-day totals and recent summaries. It does not see raw Strava payloads or get a database connection.
- **Data & Sync.** A historical import, then incremental syncs with a seven-day overlap. Each request pulls one page of activities. The screen keeps calling continue until the job finishes, pauses for a Strava rate limit, or fails.
- **Settings.** The Strava connection, athlete approvals, heart-rate thresholds, race goal, and whether the local model is reachable.

Activity streams (per-kilometer splits, GPS samples) are not stored. Charts that need them stay unavailable on live data.

## Tech

pnpm workspace. TypeScript throughout. Zod contracts in `packages/shared` are what the web app and the API both compile against.

| Piece | Where | What it is |
| --- | --- | --- |
| Interface | `apps/web` | Vite, React 19, React Router, TanStack Query, Tailwind CSS 4, Radix, Recharts |
| API | `apps/api` | Hono on Cloudflare Workers, with a Node server for local development |
| Database | Neon PostgreSQL | Drizzle schema and migrations. Production reaches Neon through Hyperdrive |
| Analytics | `packages/analytics` | Sport classification, weekly summaries, heart-rate load, records, period comparison |
| Coach model | `packages/ai` | Ollama client, prompt assembly, and a guard on which host the Worker may call |

Production is one Worker on `coach.milemarkerlabs.com`. It serves the built interface as static assets and handles `/api/*` first, so the session cookie, the OAuth callback, and the API share one origin.

Locally, Vite on port 3000 proxies `/api` to the Node API on port 4000. The local API uses `DATABASE_URL` and Node's Postgres driver. `pnpm dev` builds the shared packages, then runs both apps. Open `http://localhost:3000`.

Strava tokens are encrypted at rest. The browser keeps an HMAC session cookie. The coach model is `qwen3.5:9b` in Ollama. In production the Worker reaches that process on this PC through a Cloudflare Tunnel. Setup for the model is in [docs/running.md](docs/running.md).

## Commands

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm --filter @coach/web build
pnpm --filter @coach/api exec wrangler deploy --env production
```

`pnpm db:migrate` applies Drizzle migrations with `DATABASE_URL`. It does not go through Hyperdrive.

## Docs

- [docs/architecture.md](docs/architecture.md) — runtime, secrets, Strava apps, and deploy
- [docs/api.md](docs/api.md) — HTTP routes
- [docs/database.md](docs/database.md) — tables
- [docs/running.md](docs/running.md) — Ollama, the stream proxy, and the tunnel
