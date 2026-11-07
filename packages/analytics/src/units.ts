export function paceSecondsPerKm(speedMps: number | null, distanceMeters: number | null): number | null {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps <= 0) return null;
  if (distanceMeters == null || !Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
  return 1000 / speedMps;
}

export function kilometres(meters: number | null): number | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  return meters / 1000;
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, "0")).join(":");
}

/** Strava stores run cadence as one-foot revolutions per minute. Do not double it. */
export function cadencePresentation(modality: string, cadence: number | null): { value: number; unit: string } | null {
  if (cadence == null || !Number.isFinite(cadence) || cadence <= 0) return null;
  if (modality === "road-run" || modality === "trail-run") return { value: cadence, unit: "one-foot rpm" };
  if (modality === "other") return { value: cadence, unit: "rpm" };
  return null;
}
