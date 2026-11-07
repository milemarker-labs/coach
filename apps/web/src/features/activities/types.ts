import type { ActivitySummary } from "@coach/shared";

/** One kilometer (or the final partial kilometer) of an activity. */
export interface ActivitySplit {
  index: number;
  /** Meters covered in this split. */
  distance: number;
  /** Seconds spent moving in this split. */
  time: number;
  elevationGain: number | null;
  averageHeartrate: number | null;
}

/**
 * An activity with the detail the API may or may not provide.
 * The API currently stores summaries only, so `splits` is null for live data
 * until per-kilometer data is synced.
 */
export interface ActivityDetail {
  summary: ActivitySummary;
  splits: ActivitySplit[] | null;
}
