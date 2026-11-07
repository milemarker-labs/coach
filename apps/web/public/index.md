# Coach

> A private coach for a small roster. Coach keeps each Strava history and turns it into load, form, and a conversation. The owner approves up to five athletes. Anyone can read the last seven days.

Markdown version of https://coach.milemarkerlabs.com/.

## Personal training archive

Coach keeps each Strava history and turns it into load, form, and a conversation. The owner approves up to five athletes. Anyone can read the last seven days.

- [Connect Strava](https://coach.milemarkerlabs.com/api/auth/strava) starts sign-in. A new athlete waits until the owner approves
- [Read the journal](https://coach.milemarkerlabs.com/mangesh) is the public week
- [Journal JSON](https://coach.milemarkerlabs.com/api/journal/mangesh) is the same week for an agent

The first Strava connection becomes the owner. Later athletes can connect and wait for approval.

## Inside the archive

The signed-in dashboard is this week's distance, time, and elevation against the week before, plus training load and a short coach note. The sample on the page uses invented numbers so the layout is visible without an account. The live week is the journal.

## Approval

Five athletes besides the owner can connect a Strava account. Each one waits until the owner approves. After that, the dashboard, the sync, and the coach read that athlete's history. The owner can open any approved archive. The public journal stays the owner's last seven days.

## What is stored

- **Archive.** Every sport Strava records, stored once and read from the same place.
- **Reading.** Fitness, fatigue, and form come from the history, not from a guess.
- **Journal.** The current week, rest days included, is published for anyone to read.

Activity streams (per-kilometer splits and GPS samples) are not stored.

Coach is a project of [Milemarker Labs](https://milemarkerlabs.com/).
