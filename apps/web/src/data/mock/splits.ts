import type { ActivitySummary } from "@coach/shared";
import type { ActivitySplit } from "@/features/activities/types.ts";

function seededRandom(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) state = (Math.imul(state, 31) + seed.charCodeAt(i)) | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Demo per-kilometer splits that add up to the activity's own distance and moving time.
 * Only used in demo mode; live activities report `splits: null` until the API stores them.
 */
export function mockSplits(activity: ActivitySummary): ActivitySplit[] | null {
  const distance = activity.distance ?? 0;
  const movingTime = activity.movingTime ?? 0;
  if (distance < 1000 || movingTime <= 0) return null;
  const rand = seededRandom(activity.id);
  const count = Math.ceil(distance / 1000);
  const interval = activity.name?.includes("Interval") ?? false;

  const lengths = Array.from({ length: count }, (_, i) => (i === count - 1 ? distance - 1000 * (count - 1) : 1000));
  // Relative effort per split: gradual fade, with alternating hard and easy kilometers for intervals.
  const weights = lengths.map((_, i) => {
    const fade = 1 + (i / count) * 0.04;
    const rep = interval && i > 0 && i < count - 1 ? (i % 2 === 0 ? 0.94 : 1.07) : 1;
    return fade * rep * (1 + (rand() - 0.5) * 0.05);
  });
  const timeUnits = lengths.map((length, i) => (length / 1000) * (weights[i] ?? 1));
  const unitTotal = timeUnits.reduce((sum, value) => sum + value, 0);

  const climbTotal = activity.totalElevationGain ?? 0;
  const climbWeights = lengths.map(() => 0.4 + rand());
  const climbSum = climbWeights.reduce((sum, value) => sum + value, 0);
  const startHr = activity.averageHeartrate ? activity.averageHeartrate - 6 : null;

  return lengths.map((length, i) => ({
    index: i + 1,
    distance: length,
    time: (movingTime * (timeUnits[i] ?? 0)) / unitTotal,
    elevationGain: climbTotal > 0 ? Math.round((climbTotal * (climbWeights[i] ?? 0)) / climbSum) : null,
    averageHeartrate: startHr != null ? Math.round(startHr + (12 * i) / Math.max(count - 1, 1) + (rand() - 0.5) * 3) : null,
  }));
}
