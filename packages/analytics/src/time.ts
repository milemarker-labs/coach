export function localDate(isoUtc: string, timeZone: string): string {
  return zonedParts(isoUtc, timeZone).localDate;
}

/** Calendar date and 24-hour clock in `timeZone`. */
export function zonedParts(isoUtc: string, timeZone: string): { localDate: string; localTime: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(isoUtc));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  let hour = value("hour");
  if (hour === "24") hour = "00";
  return {
    localDate: `${value("year")}-${value("month")}-${value("day")}`,
    localTime: `${hour.padStart(2, "0")}:${value("minute").padStart(2, "0")}`,
  };
}

/** Weekday of a calendar date. The date key is a civil day, so the zone does not change the name. */
export function weekdayName(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)));
}

/** UTC instant of local midnight on `dateKey` in `timeZone`. */
export function zonedStart(dateKey: string, timeZone: string): Date {
  const utcGuess = new Date(`${dateKey}T00:00:00.000Z`);
  const adjusted = new Date(utcGuess.getTime() - zoneOffsetMs(utcGuess, timeZone));
  return new Date(utcGuess.getTime() - zoneOffsetMs(adjusted, timeZone));
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  let year = value("year");
  let month = value("month");
  let day = value("day");
  let hour = value("hour");
  if (hour === 24) {
    hour = 0;
    const rolled = new Date(Date.UTC(year, month - 1, day + 1));
    year = rolled.getUTCFullYear();
    month = rolled.getUTCMonth() + 1;
    day = rolled.getUTCDate();
  }
  return Date.UTC(year, month - 1, day, hour, value("minute"), value("second")) - instant.getTime();
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStart(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addDays(dateKey, -offset);
}

export function weekIsComplete(start: string, today: string): boolean {
  return today >= addDays(start, 6);
}
