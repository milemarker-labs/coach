# Database

PostgreSQL is the system of record. Drizzle schema lives in `apps/api/src/db/schema/index.ts`. Apply it with `pnpm db:migrate` using `DATABASE_URL`.

Internal ids are UUIDs. Strava athlete and activity ids are `bigint` and are sent to the browser as strings.

## Tables in this slice

### users

One account. `strava_athlete_id` is unique. `singleton` is a boolean that defaults to true and is unique, which keeps the table to a single row.

### strava_connections

Encrypted access token, encrypted refresh token, expiry, scope, and athlete id. Both tokens use AES-GCM. A refresh response overwrites the stored refresh token because Strava can rotate it. Disconnect deletes this row and leaves the user and activities in place.

### activities

Normalized summary columns plus `raw_data` jsonb. Unique on `(user_id, strava_activity_id)`. Indexes:

- `(user_id, start_date desc)`
- `(user_id, sport_type, start_date desc)`

`start_date` is the absolute timestamp from Strava. `start_date_local` stores the athlete's wall-clock numbers as a timestamp without time zone. Activity names and descriptions inside `raw_data` are untrusted text for any later prompt.

### sync_jobs

`job_type` is `historical` or `incremental`. `status` is `pending`, `running`, `completed`, `failed`, or `cancelled`. `cursor` is jsonb: `{ page, after?, before? }`. `lease_until` is a one-minute claim so two continues cannot process the same page. `retry_after` pauses the job when Strava rate limits the read budget. A partial unique index allows only one `pending` or `running` job per user. Failed jobs stay resumable through continue and do not block a new import.

### sync_logs

One row per page attempt. Stores the Strava read-rate usage and limit headers, the page number, and a short error. Tokens are not written here.

## Later tables

These are not created yet:

- `activity_streams` for heart rate, pace, elevation, and GPS samples. Summaries are enough for the first import.
- `daily_metrics` and `training_metrics` for deterministic analytics.
- `ai_conversations`, `ai_messages`, and `ai_insights` for the coach.
- `user_settings` for training preferences.

Add each table with the milestone that writes it.
