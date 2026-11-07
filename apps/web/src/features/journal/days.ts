import type { Journal, JournalEntry } from "@coach/shared";
import { addDays } from "@/features/analytics/calculations/dates.ts";

export interface JournalDay {
  date: string;
  activities: JournalEntry[];
}

export interface JournalTotals {
  count: number;
  distance: number;
  movingTime: number;
  elevation: number;
}

/** Newest day first, with a rest day for every date in the published window. */
export function journalDays(journal: Pick<Journal, "from" | "to" | "activities">): JournalDay[] {
  const grouped = new Map<string, JournalEntry[]>();
  for (const activity of journal.activities) {
    const key = (activity.startDateLocal ?? activity.startDate).slice(0, 10);
    if (key < journal.from || key > journal.to) continue;
    const list = grouped.get(key);
    if (list) list.push(activity);
    else grouped.set(key, [activity]);
  }

  const days: JournalDay[] = [];
  for (let cursor = journal.to; cursor >= journal.from; cursor = addDays(cursor, -1)) {
    days.push({ date: cursor, activities: grouped.get(cursor) ?? [] });
  }
  return days;
}

export function journalTotals(activities: Pick<JournalEntry, "distance" | "movingTime" | "elapsedTime" | "totalElevationGain">[]): JournalTotals {
  return activities.reduce<JournalTotals>(
    (totals, activity) => ({
      count: totals.count + 1,
      distance: totals.distance + (activity.distance ?? 0),
      movingTime: totals.movingTime + (activity.movingTime ?? activity.elapsedTime ?? 0),
      elevation: totals.elevation + (activity.totalElevationGain ?? 0),
    }),
    { count: 0, distance: 0, movingTime: 0, elevation: 0 },
  );
}

export function formatJournalRange(from: string, to: string): string {
  const start = civil(from);
  const end = civil(to);
  if (from === to) return `${start.day} ${monthName(start.month)} ${start.year}`;
  if (start.year === end.year && start.month === end.month) return `${start.day}–${end.day} ${monthName(end.month)} ${end.year}`;
  if (start.year === end.year) return `${start.day} ${monthName(start.month)} – ${end.day} ${monthName(end.month)} ${end.year}`;
  return `${start.day} ${monthName(start.month)} ${start.year} – ${end.day} ${monthName(end.month)} ${end.year}`;
}

export function formatJournalDay(dateKey: string): { weekday: string; date: string } {
  const parts = civil(dateKey);
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return {
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(utc),
    date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(utc),
  };
}

function civil(dateKey: string): { year: number; month: number; day: number } {
  const [year = 1970, month = 1, day = 1] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function monthName(month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, month - 1, 1)));
}
