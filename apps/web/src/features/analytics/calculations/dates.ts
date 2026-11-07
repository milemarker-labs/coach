/**
 * Calendar math on `YYYY-MM-DD` keys. Activities are bucketed by the athlete's
 * local wall-clock date (`startDateLocal`), so no time zone conversion happens here.
 */
import type { ActivitySummary } from "@coach/shared";

export type DayKey = string;

const DAY_MS = 86_400_000;

export function dayKeyOf(activity: Pick<ActivitySummary, "startDate" | "startDateLocal">): DayKey {
  return (activity.startDateLocal ?? activity.startDate).slice(0, 10);
}

function toMs(key: DayKey): number {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromMs(ms: number): DayKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayKey(now: Date = new Date()): DayKey {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(key: DayKey, days: number): DayKey {
  return fromMs(toMs(key) + days * DAY_MS);
}

export function diffDays(later: DayKey, earlier: DayKey): number {
  return Math.round((toMs(later) - toMs(earlier)) / DAY_MS);
}

/** Monday of the week containing `key`. */
export function startOfWeek(key: DayKey): DayKey {
  const weekday = new Date(toMs(key)).getUTCDay();
  return addDays(key, -((weekday + 6) % 7));
}

export function startOfMonth(key: DayKey): DayKey {
  return `${key.slice(0, 7)}-01`;
}

export function addMonths(key: DayKey, months: number): DayKey {
  const [year = 1970, month = 1] = key.split("-").map(Number);
  const index = year * 12 + (month - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;
}

export function eachDay(from: DayKey, to: DayKey): DayKey[] {
  const days: DayKey[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) days.push(cursor);
  return days;
}

export function formatDayShort(key: DayKey): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(toMs(key)));
}

export function formatWeekday(key: DayKey): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(new Date(toMs(key)));
}

export function formatDayLong(key: DayKey): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(toMs(key)),
  );
}

export function formatMonthShort(key: DayKey): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }).format(new Date(toMs(key)));
}
