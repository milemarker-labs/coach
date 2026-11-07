import type { ActivitySummary } from "@coach/shared";
import { addDays, todayKey, type DayKey } from "@/features/analytics/calculations/dates.ts";

/**
 * Demo history, shown only when Strava is not connected (or `VITE_DEMO_DATA=true`).
 * It has the exact shape of the API's `ActivitySummary`, so every screen reads it through
 * the same code path as live data. It is generated deterministically from a fixed seed,
 * ending on the current day, so a reload always shows the same training.
 */
const HISTORY_DAYS = 400;

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockUuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}

interface Template {
  sport: string;
  name: string;
  km: number;
  /** Seconds per km at the start of the history. */
  pace: number;
  hr: number;
  climb: number;
  hour: number;
}

function planFor(weekday: number, week: number, rand: () => number): Template[] {
  const deload = week % 4 === 3 ? 0.75 : 1;
  const build = 1 + Math.min(week, 40) * 0.006;
  const jitter = () => 0.9 + rand() * 0.2;
  const run = (name: string, km: number, pace: number, hr: number, hour: number): Template => ({
    sport: "Run",
    name,
    km: km * deload * build * jitter(),
    pace,
    hr,
    climb: km * (6 + rand() * 12),
    hour,
  });
  switch (weekday) {
    case 1:
      return [run("Easy Run", 7, 342, 141, 7)];
    case 2:
      return rand() < 0.8 ? [run("Interval Session", 9, 292, 158, 18)] : [];
    case 3:
      return rand() < 0.55 ? [{ sport: "WeightTraining", name: "Strength", km: 0, pace: 0, hr: 0, climb: 0, hour: 12 }] : [];
    case 4:
      return [run("Tempo Run", 10, 311, 154, 7)];
    case 5:
      return rand() < 0.5 ? [run("Recovery Run", 5, 360, 134, 18)] : [];
    case 6:
      return rand() < 0.75
        ? [{ sport: "Ride", name: "Endurance Ride", km: 38 * deload * jitter(), pace: 135, hr: 128, climb: 380 * jitter(), hour: 8 }]
        : [run("Trail Run", 12, 358, 149, 8)];
    case 0:
      return [run("Long Run", 17, 335, 146, 8)];
    default:
      return [];
  }
}

function build(): ActivitySummary[] {
  const rand = mulberry32(20260507);
  const now = new Date();
  const today = todayKey(now);
  const first = addDays(today, -(HISTORY_DAYS - 1));
  const rows: ActivitySummary[] = [];
  const nowLocal = `${today}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
  let index = 1;
  for (let offset = 0; offset < HISTORY_DAYS; offset += 1) {
    const cursor: DayKey = addDays(first, offset);
    const week = Math.floor(offset / 7);
    const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    for (const template of planFor(weekday, week, rand)) {
      const minute = Math.floor(rand() * 40);
      const local = `${cursor}T${String(template.hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      if (local > nowLocal) continue;
      rows.push(makeActivity(index, template, local, offset, rand));
      index += 1;
    }
  }
  return rows.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

function makeActivity(index: number, t: Template, local: string, offset: number, rand: () => number): ActivitySummary {
  const base = {
    id: mockUuid(index),
    stravaActivityId: String(10_000_000_000 + index),
    sportType: t.sport,
    activityType: t.sport,
    startDate: `${local}Z`,
    startDateLocal: local,
    maxSpeed: null,
    averageCadence: null,
    averageWatts: null,
    weightedAverageWatts: null,
    maxWatts: null,
    kilojoules: null,
    deviceWatts: null,
    averageTemp: null,
    trainer: false,
    commute: false,
    gearId: null,
  };

  if (t.sport === "WeightTraining") {
    const movingTime = Math.round((40 + rand() * 25) * 60);
    const averageHeartrate = rand() < 0.7 ? Math.round(112 + rand() * 14) : null;
    return {
      ...base,
      name: t.name,
      distance: null,
      movingTime,
      elapsedTime: movingTime + Math.round(rand() * 600),
      totalElevationGain: null,
      averageSpeed: null,
      averageHeartrate,
      maxHeartrate: averageHeartrate ? averageHeartrate + 28 : null,
      calories: Math.round(movingTime / 60 * 5.2),
      sufferScore: averageHeartrate ? Math.round((movingTime / 60) * 0.55) : null,
      hasHeartrate: averageHeartrate != null,
    };
  }

  // Athletes get a little faster across the history: roughly 4% over 400 days.
  const progress = 1 + (offset / HISTORY_DAYS) * 0.04;
  const paceNoise = 1 + (rand() - 0.5) * 0.05;
  const secondsPerKm = (t.pace / progress) * paceNoise;
  const distance = Math.round(t.km * 1000);
  const movingTime = Math.round((distance / 1000) * secondsPerKm);
  const hasHeartrate = rand() < 0.88;
  const averageHeartrate = hasHeartrate ? Math.round(t.hr + (rand() - 0.5) * 8 - (progress - 1) * 100) : null;
  const isRide = t.sport === "Ride";
  return {
    ...base,
    name: t.name,
    distance,
    movingTime,
    elapsedTime: movingTime + Math.round(rand() * (isRide ? 900 : 240)),
    totalElevationGain: Math.round(t.climb),
    averageSpeed: distance / movingTime,
    maxSpeed: (distance / movingTime) * (isRide ? 1.9 : 1.45),
    averageHeartrate,
    maxHeartrate: averageHeartrate ? averageHeartrate + Math.round(18 + rand() * 12) : null,
    averageCadence: isRide ? Math.round(84 + rand() * 8) : Math.round(80 + rand() * 6),
    averageWatts: isRide ? Math.round(150 + rand() * 40) : null,
    weightedAverageWatts: isRide ? Math.round(165 + rand() * 40) : null,
    maxWatts: isRide ? Math.round(520 + rand() * 200) : null,
    kilojoules: isRide ? Math.round((movingTime / 60) * 9.4) : null,
    deviceWatts: isRide ? true : null,
    calories: Math.round((distance / 1000) * (isRide ? 22 : 62)),
    sufferScore: averageHeartrate ? Math.round((movingTime / 60) * Math.pow(averageHeartrate / 148, 2.4) * 0.85) : null,
    hasHeartrate,
  };
}

let cache: { day: DayKey; rows: ActivitySummary[] } | null = null;

export function mockActivities(): ActivitySummary[] {
  const day = todayKey();
  if (!cache || cache.day !== day) cache = { day, rows: build() };
  return cache.rows;
}
