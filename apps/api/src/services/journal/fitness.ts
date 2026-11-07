import { addDays } from "@coach/analytics";

/** Days drawn on the public chart. Matches the signed-in training chart. */
export const JOURNAL_FITNESS_DAYS = 90;
/** Activities before the chart still warm the averages, up to one year. */
const WARMUP_DAYS = 365;
const CTL_DAYS = 42;
const ATL_DAYS = 7;

export interface JournalLoad {
  day: string;
  sufferScore: number | null;
  movingTime: number | null;
}

export interface JournalFitnessPoint {
  day: string;
  fitness: number;
  fatigue: number;
  form: number;
}

/**
 * Fitness, fatigue and form for each day ending at `to`.
 * Same reading as the signed-in chart: suffer score, or one point per moving minute,
 * then a 42-day and a 7-day average. Only the averages leave the archive.
 */
export function journalFitness(loads: JournalLoad[], to: string): JournalFitnessPoint[] {
  const from = addDays(to, -(JOURNAL_FITNESS_DAYS - 1));
  let start = from;
  for (const load of loads) {
    if (load.day < start) start = load.day;
  }
  const earliest = addDays(to, -WARMUP_DAYS);
  if (start < earliest) start = earliest;

  const byDay = new Map<string, number>();
  for (let cursor = start; cursor <= to; cursor = addDays(cursor, 1)) byDay.set(cursor, 0);
  for (const load of loads) {
    if (!byDay.has(load.day)) continue;
    const value = loadValue(load);
    if (value == null) continue;
    byDay.set(load.day, (byDay.get(load.day) ?? 0) + value);
  }

  const fitnessWeight = 1 - Math.exp(-1 / CTL_DAYS);
  const fatigueWeight = 1 - Math.exp(-1 / ATL_DAYS);
  let fitness = 0;
  let fatigue = 0;
  const points: JournalFitnessPoint[] = [];
  for (let cursor = start; cursor <= to; cursor = addDays(cursor, 1)) {
    const load = byDay.get(cursor) ?? 0;
    fitness += (load - fitness) * fitnessWeight;
    fatigue += (load - fatigue) * fatigueWeight;
    if (cursor >= from) {
      points.push({
        day: cursor,
        fitness: round1(fitness),
        fatigue: round1(fatigue),
        form: round1(fitness - fatigue),
      });
    }
  }
  return points;
}

/** First instant to include when loading a year of history for `to`. */
export function journalFitnessFrom(to: string): string {
  return addDays(to, -WARMUP_DAYS);
}

/** Local calendar day, using the stored wall clock when Strava sent one. */
export function journalLoadDay(startDate: Date, startDateLocal: Date | null): string {
  const source = startDateLocal ?? startDate;
  const year = source.getUTCFullYear();
  const month = String(source.getUTCMonth() + 1).padStart(2, "0");
  const day = String(source.getUTCDate()).padStart(2, "0");
  if (startDateLocal) return `${year}-${month}-${day}`;
  return startDate.toISOString().slice(0, 10);
}

function loadValue(load: JournalLoad): number | null {
  if (load.sufferScore != null && load.sufferScore > 0) return load.sufferScore;
  if (load.movingTime != null && load.movingTime > 0) return load.movingTime / 60;
  return null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
