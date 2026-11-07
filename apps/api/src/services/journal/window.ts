import { addDays, localDate, zonedStart } from "@coach/analytics";

export const JOURNAL_DAYS = 7;

export const JOURNAL_TIME_ZONE = "Asia/Kolkata";

export interface JournalWindow {
  from: Date;
  through: Date;
  fromDate: string;
  toDate: string;
}

/** Last seven local calendar days, including today, ending at `now`. */
export function journalWindow(now: Date, timeZone: string): JournalWindow {
  const toDate = localDate(now.toISOString(), timeZone);
  const fromDate = addDays(toDate, -(JOURNAL_DAYS - 1));
  return {
    from: zonedStart(fromDate, timeZone),
    through: now,
    fromDate,
    toDate,
  };
}

export function resolveTimeZone(value: string | null | undefined): string {
  const candidate = value?.trim();
  if (!candidate) return JOURNAL_TIME_ZONE;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    return JOURNAL_TIME_ZONE;
  }
}

export function isInJournalWindow(start: Date, window: Pick<JournalWindow, "from" | "through">): boolean {
  return start >= window.from && start <= window.through;
}
