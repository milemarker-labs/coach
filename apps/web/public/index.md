# Coach

> A private coach for a small roster. Coach keeps each Strava history and turns it into load, form, and a conversation. The owner approves up to five athletes. Anyone can read the last seven days.

Markdown version of https://coach.milemarkerlabs.com/.

## Personal training archive

Coach keeps each Strava history and turns it into load, form, and a conversation. The owner approves up to five athletes. Anyone can read the last seven days.

Coach also reduces the history to one number, the **Marker** (0-100), and a daily call (rest, easy, steady, long, or quality) with a few directions. The home page shows the Marker computed from generated demo activities, labelled as a sample.

- [Connect Strava](https://coach.milemarkerlabs.com/api/auth/strava) starts sign-in. A new athlete waits until the owner approves
- [Read the journal](https://coach.milemarkerlabs.com/mangesh) is the public week
- [Journal JSON](https://coach.milemarkerlabs.com/api/journal/mangesh) is the same week for an agent

The first Strava connection becomes the owner. Later athletes can connect and wait for approval.

## Inside the archive

The signed-in dashboard opens with the athlete's Marker, today's call, and directions, then this week's distance, time, and elevation against the week before, plus training load and a short coach note. The sample on the page uses invented numbers so the layout is visible without an account. The live week is the journal.

## Approval

Five athletes besides the owner can connect a Strava account. Each one waits until the owner approves. After that, the dashboard, the sync, and the coach read that athlete's history. The owner can open any approved archive. The public journal stays the owner's last seven days.

## What is stored

- **Archive.** Every sport Strava records, stored once and read from the same place.
- **Reading.** Fitness, fatigue, form, and the Marker come from the history, not from a guess.
- **Journal.** The current week, rest days included, is published for anyone to read.

Activity streams (per-kilometer splits and GPS samples) are not stored.

## The Marker

A 0-100 reading of fitness from logged activities only. Five parts, each 0-100, blended by weight: base (35%, the 42-day load average), consistency (25%, active days and weeks with three or more sessions over four weeks), balance (20%, 7-day against 42-day load; 0.8-1.3 is best), momentum (10%, change in the base over four weeks), and efficiency (10%, speed per heartbeat in the main sport, last six weeks against the six before). A part without data drops out and the rest are re-weighted. Bands: Getting started (0+), Building (25+), Steady (45+), Strong (65+), Peak (80+).

Coach is a project of [Milemarker Labs](https://milemarkerlabs.com/).
