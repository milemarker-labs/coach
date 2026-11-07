import type { ActivitySummary } from "@coach/shared";
import { describe, expect, it } from "vitest";
import { compareActivity, similarActivities } from "./compare.ts";
import { addDays, startOfWeek } from "./dates.ts";
import { effortSeries, heartRateSeries } from "./effort.ts";
import { activityLoad, fitnessSeries, formStatus } from "./load.ts";
import { bucketVolume, compareWindows, percentChange } from "./volume.ts";

let counter = 0;
function activity(day: string, overrides: Partial<ActivitySummary> = {}): ActivitySummary {
  counter += 1;
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
    stravaActivityId: String(counter),
    name: `Activity ${counter}`,
    sportType: "Run",
    activityType: "Run",
    startDate: `${day}T07:00:00Z`,
    startDateLocal: `${day}T07:00:00`,
    distance: 10_000,
    movingTime: 3000,
    elapsedTime: 3100,
    totalElevationGain: 100,
    averageSpeed: 10_000 / 3000,
    maxSpeed: null,
    averageHeartrate: 150,
    maxHeartrate: 170,
    averageCadence: null,
    averageWatts: null,
    weightedAverageWatts: null,
    maxWatts: null,
    kilojoules: null,
    deviceWatts: null,
    calories: null,
    sufferScore: null,
    averageTemp: null,
    hasHeartrate: true,
    trainer: false,
    commute: false,
    gearId: null,
    ...overrides,
  };
}

describe("dates", () => {
  it("finds Monday as the start of the week", () => {
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(startOfWeek("2026-11-02")).toBe("2026-11-02"); // Monday
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("volume", () => {
  it("includes empty weeks and sums each bucket", () => {
    const rows = [activity("2026-11-02"), activity("2026-11-04", { distance: 5000 }), activity("2026-10-20")];
    const buckets = bucketVolume(rows, "week", "2026-10-19", "2026-11-08");
    expect(buckets.map((b) => b.key)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(buckets.map((b) => b.count)).toEqual([1, 0, 2]);
    expect(buckets[2]?.distance).toBe(15_000);
  });

  it("compares the last 7 days with the 7 before", () => {
    const rows = [activity("2026-11-07"), activity("2026-11-01"), activity("2026-10-31", { distance: 5000 }), activity("2026-10-24")];
    const { current, previous } = compareWindows(rows, "2026-11-07", 7);
    expect(current.distance).toBe(20_000); // Nov 1 to Nov 7
    expect(previous.distance).toBe(5000); // Oct 25 to Oct 31; Oct 24 is outside both windows
  });

  it("gives no percentage without a baseline", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(12, 10)).toBeCloseTo(20);
  });
});

describe("load", () => {
  it("uses the suffer score when present and one point per minute otherwise", () => {
    expect(activityLoad({ sufferScore: 80, movingTime: 3600 })).toEqual({ value: 80, basis: "effort" });
    expect(activityLoad({ sufferScore: null, movingTime: 3600 })).toEqual({ value: 60, basis: "estimated" });
    expect(activityLoad({ sufferScore: null, movingTime: null })).toBeNull();
  });

  it("builds fatigue faster than fitness and returns to zero form with no training", () => {
    const rows = [activity("2026-10-01", { sufferScore: 100 })];
    const series = fitnessSeries(rows, "2026-10-01", "2026-10-02");
    expect(series).toHaveLength(2);
    const first = series[0];
    expect(first && first.fatigue > first.fitness).toBe(true);
    expect(first && first.form < 0).toBe(true);
    const quiet = fitnessSeries([], "2026-10-01", "2026-10-03");
    expect(quiet.every((point) => point.fitness === 0 && point.form === 0)).toBe(true);
  });

  it("labels form", () => {
    expect(formStatus(-9).label).toBe("Balanced");
    expect(formStatus(-40).tone).toBe("danger");
  });
});

describe("effort and heart rate", () => {
  it("returns pace in seconds per km, oldest first, skipping short activities", () => {
    const rows = [
      activity("2026-11-03", { averageSpeed: 4 }),
      activity("2026-11-01", { averageSpeed: 5 }),
      activity("2026-11-02", { distance: 500 }),
      activity("2026-11-02", { sportType: "Ride", activityType: "Ride" }),
    ];
    const series = effortSeries(rows, "Run");
    expect(series.kind).toBe("pace");
    expect(series.points.map((p) => p.value)).toEqual([200, 250]);
  });

  it("ignores activities without heart rate", () => {
    const rows = [activity("2026-11-01"), activity("2026-11-02", { averageHeartrate: null })];
    expect(heartRateSeries(rows, null)).toHaveLength(1);
  });
});

describe("comparison", () => {
  it("compares with earlier similar activities of the same sport only", () => {
    const target = activity("2026-11-07", { averageSpeed: 4 });
    const similar = activity("2026-11-01", { averageSpeed: 3.5 });
    const rows = [
      similar,
      activity("2026-11-02", { distance: 25_000 }),
      activity("2026-11-03", { sportType: "Ride", activityType: "Ride" }),
      activity("2026-11-09"),
    ];
    expect(similarActivities(target, rows)).toEqual([similar]);
    const comparison = compareActivity(target, [similar]);
    expect(comparison?.speedRank).toEqual({ position: 1, of: 2 });
    expect(comparison?.metrics.find((m) => m.key === "speed")?.change).toBeCloseTo((0.5 / 3.5) * 100);
  });

  it("returns null with nothing to compare", () => {
    expect(compareActivity(activity("2026-11-07"), [])).toBeNull();
  });
});
