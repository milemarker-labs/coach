# Coach

> A private coach for one athlete. Coach keeps one Strava history and turns it into load, form, and a conversation. Sign in to open the archive. Anyone can read the last seven days.

Markdown version of https://coach.milemarkerlabs.com/.

## Personal training archive

Coach keeps one Strava history and turns it into load, form, and a conversation. Sign in to open the archive. Anyone can read the last seven days.

- [Connect Strava](https://coach.milemarkerlabs.com/api/auth/strava) starts sign-in for the athlete this archive was built for
- [Read the journal](https://coach.milemarkerlabs.com/mangesh) is the public week
- [Journal JSON](https://coach.milemarkerlabs.com/api/journal/mangesh) is the same week for an agent

Strava sign-in is limited to the athlete this archive was built for. A different Strava account cannot sign in.

## Inside the archive

The signed-in dashboard is this week's distance, time, and elevation against the week before, plus training load and a short coach note. The sample on the page uses invented numbers so the layout is visible without an account. Those numbers are not the athlete's history. The live week is the journal.

## One profile

This copy of Coach only works for one profile. The dashboard, the sync, and the coach all read that one history. The public journal is the last seven days of the same profile.

To ask for a copy for another profile, email [milemarkerlabs@gmail.com](mailto:milemarkerlabs@gmail.com?subject=Coach%20for%20my%20Strava%20profile).

## What is stored

- **Archive.** Every sport Strava records, stored once and read from the same place.
- **Reading.** Fitness, fatigue, and form come from the history, not from a guess.
- **Journal.** The current week, rest days included, is published for anyone to read.

Activity streams (per-kilometer splits and GPS samples) are not stored.

Coach is a project of [Milemarker Labs](https://milemarkerlabs.com/).
