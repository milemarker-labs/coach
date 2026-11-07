import {
  cadencePresentation,
  comparableActivities,
  comparePeriods,
  dataQuality,
  formatDuration,
  heartRateLoad,
  localDate,
  modalityOf,
  paceSecondsPerKm,
  personalRecords,
  sessionIntent,
  summarizePeriod,
  weekStart,
  type ActivityRecord,
  type AthleteThresholds,
} from "@coach/analytics";
import { describe, expect, it } from "vitest";

const thresholds: AthleteThresholds = { maxHeartRate: 190, thresholdHeartRate: 170, restingHeartRate: 50 };

function activity(overrides: Partial<ActivityRecord>): ActivityRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Session",
    sportType: "Run",
    activityType: "Run",
    startDate: "2026-11-02T01:30:00.000Z",
    distanceMeters: 10000,
    movingTimeSeconds: 3600,
    elapsedTimeSeconds: 3700,
    averageSpeedMps: 1000 / 360,
    maxSpeedMps: 4,
    elevationGainMeters: 40,
    averageHeartRate: 145,
    maxHeartRate: 168,
    averageCadence: 86,
    averageWatts: null,
    sufferScore: 50,
    ...overrides,
  };
}

describe("units and classification", () => {
  it("calculates pace only from valid speed and distance", () => {
    expect(paceSecondsPerKm(1000 / 360, 10000)).toBe(360);
    expect(paceSecondsPerKm(0, 10000)).toBeNull();
    expect(paceSecondsPerKm(3, 0)).toBeNull();
    expect(paceSecondsPerKm(null, 10000)).toBeNull();
  });

  it("formats duration and keeps run cadence as one-foot rpm", () => {
    expect(formatDuration(3661)).toBe("01:01:01");
    expect(formatDuration(null)).toBeNull();
    expect(cadencePresentation("road-run", 86)).toEqual({ value: 86, unit: "one-foot rpm" });
    expect(cadencePresentation("strength", 86)).toBeNull();
  });

  it("separates the supplied sport types", () => {
    expect(modalityOf(activity({ sportType: "Run" }))).toBe("road-run");
    expect(modalityOf(activity({ sportType: "TrailRun" }))).toBe("trail-run");
    expect(modalityOf(activity({ sportType: "Walk" }))).toBe("walk");
    expect(modalityOf(activity({ sportType: "Hike" }))).toBe("hike");
    expect(modalityOf(activity({ sportType: "WeightTraining", distanceMeters: null, averageSpeedMps: null }))).toBe("strength");
  });

  it("groups by the athlete timezone rather than the local timestamp string", () => {
    expect(localDate("2026-11-01T20:30:00.000Z", "Asia/Kolkata")).toBe("2026-11-02");
    expect(weekStart("2026-11-04")).toBe("2026-11-02");
  });
});

describe("aggregation", () => {
  const records = [
    activity({ id: "11111111-1111-4111-8111-111111111111", sportType: "Run", distanceMeters: 8000 }),
    activity({ id: "22222222-2222-4222-8222-222222222222", sportType: "Walk", startDate: "2026-11-03T02:00:00.000Z", distanceMeters: 3000, averageHeartRate: null, averageWatts: null, elevationGainMeters: null, sufferScore: null }),
    activity({ id: "33333333-3333-4333-8333-333333333333", sportType: "TrailRun", startDate: "2026-11-04T02:00:00.000Z", distanceMeters: 12000, elevationGainMeters: 400 }),
    activity({ id: "44444444-4444-4444-8444-444444444444", sportType: "Hike", startDate: "2026-11-05T01:00:00.000Z", distanceMeters: 15000, elevationGainMeters: 800, movingTimeSeconds: 18000 }),
    activity({ id: "55555555-5555-4555-8555-555555555555", sportType: "WeightTraining", startDate: "2026-11-06T12:00:00.000Z", distanceMeters: null, averageSpeedMps: null, averageHeartRate: null, elevationGainMeters: null, movingTimeSeconds: 3000, sufferScore: null }),
  ];

  it("does not fold walking, hiking, or strength into running mileage", () => {
    const summary = summarizePeriod(records, "2026-11-02", "2026-11-08", "2026-11-08", "Asia/Kolkata", thresholds);
    expect(summary.runningDistanceMeters).toBe(8000);
    expect(summary.trailDistanceMeters).toBe(12000);
    expect(summary.walkDistanceMeters).toBe(3000);
    expect(summary.hikeDistanceMeters).toBe(15000);
    expect(summary.strengthSessions).toBe(1);
    expect(summary.complete).toBe(false);
  });

  it("labels an incomplete week when comparing it with a full one", () => {
    const current = summarizePeriod(records, "2026-11-02", "2026-11-08", "2026-11-07", "Asia/Kolkata", thresholds);
    const previous = summarizePeriod([], "2026-10-26", "2026-11-01", "2026-11-07", "Asia/Kolkata", thresholds);
    current.complete = false;
    previous.complete = true;
    expect(comparePeriods(current, previous).note).toContain("incomplete");
  });

  it("keeps missing heart rate and power as unavailable", () => {
    const walk = records[1]!;
    expect(dataQuality(walk).hasHeartRate).toBe(false);
    expect(dataQuality(walk).hasPower).toBe(false);
    expect(heartRateLoad(walk, thresholds)).toBeNull();
    expect(sessionIntent(activity({ averageHeartRate: null }), thresholds).intent).toBe("unclassified");
    expect(sessionIntent(activity({ averageHeartRate: 175 }), thresholds).intent).toBe("hard");
    expect(paceSecondsPerKm(null, null)).toBeNull();
  });

  it("finds comparable road runs and personal records without using trail pace", () => {
    const target = activity({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", distanceMeters: 10000 });
    const similar = activity({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", distanceMeters: 9800, startDate: "2026-10-01T02:00:00.000Z" });
    const trail = activity({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", sportType: "TrailRun", distanceMeters: 10000 });
    expect(comparableActivities(target, [similar, trail]).map((item) => item.id)).toEqual([similar.id]);
    const records = personalRecords([
      activity({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", distanceMeters: 21000, averageSpeedMps: 3 }),
      activity({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", distanceMeters: 5000, averageSpeedMps: 4 }),
    ]);
    expect(records.longestRunId).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    expect(records.fastestRunId).toBe("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
  });
});
