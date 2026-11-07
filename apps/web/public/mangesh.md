# Athletic journal

> The last seven days of the one athlete this copy of Coach was built for, including rest days. Older sessions stay in the private archive.

Markdown version of https://coach.milemarkerlabs.com/mangesh. This file describes the page. It is not the week's activities. Fetch the live record:

[https://coach.milemarkerlabs.com/api/journal/mangesh](https://coach.milemarkerlabs.com/api/journal/mangesh)

The response is JSON, `Cache-Control: public, max-age=60`, and it does not require a session. A missing journal is HTTP 404 with `{ "error": "Not found" }`.

## Response

| Field | Meaning |
| --- | --- |
| `slug` | Always `mangesh` |
| `name` | The athlete's display name |
| `timezone` | IANA time zone used to choose the seven local days |
| `from` | First day of the window, `YYYY-MM-DD`, inclusive |
| `to` | Last day of the window, `YYYY-MM-DD`, inclusive |
| `activities` | Sessions in that window, newest first, at most 100 |
| `fitness` | Last 90 local days of fitness, fatigue, and form. One point per day, oldest first |

Each activity:

| Field | Unit |
| --- | --- |
| `id` | UUID |
| `name` | Session name, or null |
| `sportType` | Strava sport, or null |
| `activityType` | Strava activity type, or null |
| `startDate` | UTC instant, ISO 8601 |
| `startDateLocal` | Local wall time `YYYY-MM-DDTHH:mm:ss`, or null |
| `distance` | Meters, or null |
| `movingTime` | Seconds, or null |
| `elapsedTime` | Seconds, or null |
| `totalElevationGain` | Meters, or null |
| `averageSpeed` | Meters per second, or null |
| `averageHeartrate` | Beats per minute, or null |

Each fitness point:

| Field | Meaning |
| --- | --- |
| `day` | Local day, `YYYY-MM-DD` |
| `fitness` | 42-day average of daily load, one decimal |
| `fatigue` | 7-day average of daily load, one decimal |
| `form` | Fitness minus fatigue, one decimal |

Daily load is the Strava suffer score, or one point per moving minute when a session has no suffer score. Days before the 90-day window warm those averages and are not listed. The page shows the current fitness, fatigue, and form, the change over seven days, and the three lines together.

The page groups those sessions by local day and shows four totals for the window: how many sessions, distance in kilometers, moving time, and elevation climbed. A day with no session is a rest day. The home page previews at most three of the same sessions and links here.

## What is not here

Heart-rate streams, GPS, splits, and any session older than this week are not in this response. The fitness series is only the daily averages, not those older sessions. The signed-in archive is the only place the sessions exist, and it is limited to this athlete.
