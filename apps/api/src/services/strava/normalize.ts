export interface NormalizedActivity {
  stravaActivityId: bigint;
  name: string | null;
  sportType: string | null;
  activityType: string | null;
  startDate: Date;
  startDateLocal: Date | null;
  distance: number | null;
  movingTime: number | null;
  elapsedTime: number | null;
  totalElevationGain: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  averageCadence: number | null;
  averageWatts: number | null;
  weightedAverageWatts: number | null;
  maxWatts: number | null;
  kilojoules: number | null;
  deviceWatts: boolean | null;
  calories: number | null;
  sufferScore: number | null;
  averageTemp: number | null;
  hasHeartrate: boolean | null;
  trainer: boolean | null;
  commute: boolean | null;
  gearId: string | null;
  rawData: Record<string, unknown>;
}

export function activityIdentity(userId: string, activity: Pick<NormalizedActivity, "stravaActivityId">): string {
  return `${userId}:${activity.stravaActivityId.toString()}`;
}

export function normalizeActivity(raw: unknown): NormalizedActivity {
  if (!isRecord(raw)) throw new Error("Activity payload is not an object");
  return {
    stravaActivityId: toBigIntId(raw.id),
    name: stringOrNull(raw.name),
    sportType: stringOrNull(raw.sport_type),
    activityType: stringOrNull(raw.type),
    startDate: parseStartDate(raw.start_date),
    startDateLocal: parseLocalWallClock(raw.start_date_local),
    distance: numberOrNull(raw.distance),
    movingTime: intOrNull(raw.moving_time),
    elapsedTime: intOrNull(raw.elapsed_time),
    totalElevationGain: numberOrNull(raw.total_elevation_gain),
    averageSpeed: numberOrNull(raw.average_speed),
    maxSpeed: numberOrNull(raw.max_speed),
    averageHeartrate: numberOrNull(raw.average_heartrate),
    maxHeartrate: numberOrNull(raw.max_heartrate),
    averageCadence: numberOrNull(raw.average_cadence),
    averageWatts: numberOrNull(raw.average_watts),
    weightedAverageWatts: numberOrNull(raw.weighted_average_watts),
    maxWatts: numberOrNull(raw.max_watts),
    kilojoules: numberOrNull(raw.kilojoules),
    deviceWatts: booleanOrNull(raw.device_watts),
    calories: numberOrNull(raw.calories),
    sufferScore: intOrNull(raw.suffer_score),
    averageTemp: numberOrNull(raw.average_temp),
    hasHeartrate: booleanOrNull(raw.has_heartrate),
    trainer: booleanOrNull(raw.trainer),
    commute: booleanOrNull(raw.commute),
    gearId: stringOrNull(raw.gear_id),
    rawData: raw,
  };
}

export function toBigIntId(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  throw new Error("Invalid Strava id");
}

export function parseStartDate(value: unknown): Date {
  if (typeof value !== "string") throw new Error("Activity is missing start_date");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Activity has an invalid start_date");
  return date;
}

/** Keep Strava's local clock numbers by storing them as UTC components. */
export function parseLocalWallClock(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])));
}

export function formatWallClock(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function intOrNull(value: unknown): number | null {
  const number = numberOrNull(value);
  return number == null ? null : Math.trunc(number);
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
