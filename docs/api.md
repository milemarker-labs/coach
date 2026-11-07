# API

All routes are under `/api`. Protected routes require the `coach_session` cookie. Every query is scoped to that user.

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Liveness check. Does not open the database. |

## Strava

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/auth/strava` | No | Redirect to Strava with a state cookie. |
| GET | `/api/auth/strava/callback` | No | Validate state, store encrypted tokens, set the session cookie. |
| GET | `/api/auth/strava/status` | Optional | `{ connected, athleteId, displayName, expiresAt }`. |
| DELETE | `/api/auth/strava` | Yes | Remove stored tokens. |

A state mismatch redirects to `/settings?error=oauth_state` and does not call Strava. A different athlete redirects to `/settings?error=athlete_locked`.

## Sync

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/sync/status` | Active job, latest failed job, last successful log time, activity count. |
| POST | `/api/sync/now` | Start a seven-day incremental sync and process the first page. |
| POST | `/api/sync/historical` | Start a historical import. Body: optional `after` and `before` as `YYYY-MM-DD`. |
| GET | `/api/sync/jobs/:id` | Job detail. |
| POST | `/api/sync/jobs/:id/continue` | Process one page, or resume a failed job from its cursor. |
| POST | `/api/sync/jobs/:id/cancel` | Cancel a pending, running, or failed job. |

A job response contains `id`, `jobType`, `status`, `page`, `recordsProcessed`, `error`, `retryAfter`, `createdAt`, `startedAt`, and `completedAt`.

`409` means another sync is already pending or running. On HTTP 429, or when the 15-minute read budget has fewer than two requests left, the job returns to `pending` with `retryAfter` and the page cursor stays put.

A page shorter than 200 activities completes the job. A full page advances `cursor.page`.

## Activities

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/activities` | Paginated summaries for every sport. |
| GET | `/api/activities/sports` | Distinct sports and how many activities each has. |
| GET | `/api/activities/:id` | One summary. |

Query parameters: `type`, `from`, `to`, `sort` (`asc` or `desc`), `limit` (1–100), `offset`. `type` matches `sport_type` or `activity_type`. Dates are inclusive `YYYY-MM-DD` against `start_date`. The list response is `{ activities, total, limit, offset }`.

Streams are not served yet. `raw_data` stays in the database.
