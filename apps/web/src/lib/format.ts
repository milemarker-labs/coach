export function formatDistance(meters: number | null): string {
  if (meters == null) return "—";
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(kilometers >= 10 ? 1 : 2)} km`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${remaining}s`;
}

export function formatElevation(meters: number | null): string {
  if (meters == null) return "—";
  return `${Math.round(meters)} m`;
}

export function formatHeartRate(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value)} bpm`;
}

export function formatInstant(value: string | null): string {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatLocalClock(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}Z`));
}

/** `m:ss` from seconds, e.g. a pace of 312 s/km becomes `5:12`. */
export function formatClock(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** `h:mm:ss` or `m:ss` for stopwatch-style durations. */
export function formatStopwatch(totalSeconds: number | null): string {
  if (totalSeconds == null) return "—";
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${minutes}:${ss}`;
}

/** Hours and minutes, e.g. `5h 18m`. Short activities fall back to minutes. */
export function formatHoursMinutes(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function toKilometers(meters: number): number {
  return Math.round((meters / 1000) * 10) / 10;
}

/** Full local timestamp for an activity, e.g. `Today, 7:14 PM` style labels are built by callers. */
export function formatActivityDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 19)}Z`);
  const now = new Date();
  const localKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const yesterday = new Date(today.getTime() - 86_400_000);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date);
  if (localKey(date) === localKey(today)) return `Today, ${time}`;
  if (localKey(date) === localKey(yesterday)) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  return `${day}, ${time}`;
}

export function formatRelative(value: string | null, now: Date = new Date()): string {
  if (!value) return "Never";
  const seconds = Math.round((now.getTime() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
