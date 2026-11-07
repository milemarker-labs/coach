const FOOT_SPORTS = new Set(["Run", "TrailRun", "VirtualRun", "Walk", "Hike", "Snowshoe"]);
const SWIM_SPORTS = new Set(["Swim"]);
const CYCLE_SPORTS = new Set([
  "Ride",
  "VirtualRide",
  "MountainBikeRide",
  "GravelRide",
  "EBikeRide",
  "EMountainBikeRide",
  "Velomobile",
  "Handcycle",
]);
const DURATION_SPORTS = new Set([
  "WeightTraining",
  "Workout",
  "Yoga",
  "Pilates",
  "Crossfit",
  "Elliptical",
  "StairStepper",
  "RockClimbing",
  "HighIntensityIntervalTraining",
]);

export type EffortKind = "pace" | "swim-pace" | "speed" | "duration";

export function sportKey(sportType: string | null, activityType: string | null): string {
  return sportType?.trim() || activityType?.trim() || "Activity";
}

export function sportLabel(sport: string): string {
  return sport.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

export function effortKind(sport: string | null): EffortKind {
  if (sport && FOOT_SPORTS.has(sport)) return "pace";
  if (sport && SWIM_SPORTS.has(sport)) return "swim-pace";
  if (sport && DURATION_SPORTS.has(sport)) return "duration";
  return "speed";
}

export function cadenceUnit(sport: string | null): string | null {
  if (sport && FOOT_SPORTS.has(sport)) return "spm";
  if (sport && CYCLE_SPORTS.has(sport)) return "rpm";
  return null;
}

export function formatPace(metersPerSecond: number | null): string {
  if (metersPerSecond == null || metersPerSecond <= 0) return "—";
  return formatClock(1000 / metersPerSecond, "/km");
}

export function formatSwimPace(metersPerSecond: number | null): string {
  if (metersPerSecond == null || metersPerSecond <= 0) return "—";
  return formatClock(100 / metersPerSecond, "/100m");
}

export function formatSpeed(metersPerSecond: number | null): string {
  if (metersPerSecond == null || metersPerSecond <= 0) return "—";
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
}

export function formatEffort(sport: string | null, metersPerSecond: number | null): { kind: EffortKind; label: string; value: string } {
  const kind = effortKind(sport);
  if (kind === "pace") return { kind, label: "Pace", value: formatPace(metersPerSecond) };
  if (kind === "swim-pace") return { kind, label: "Pace", value: formatSwimPace(metersPerSecond) };
  if (kind === "duration") return { kind, label: "Speed", value: "—" };
  return { kind, label: "Speed", value: formatSpeed(metersPerSecond) };
}

function formatClock(totalSeconds: number, suffix: string): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} ${suffix}`;
}
