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
