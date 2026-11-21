import { balanceScore, bandFor, baseScore, computeMarker, consistencyScore, momentumScore, todayCall, type ScoreActivity } from "@coach/shared";
import { describe, expect, it } from "vitest";
import { addDays } from "./dates.ts";

const TODAY = "2026-11-18"; // a Wednesday

function run(day: string, minutes: number, extra: Partial<ScoreActivity> = {}): ScoreActivity {
  return { day, sport: "Run", sufferScore: null, movingTime: minutes * 60, distance: minutes * 180, averageSpeed: 3, averageHeartrate: 150, ...extra };
}

/** `perWeek` sessions on the same weekdays for `weeks` weeks ending today. */
function routine(weeks: number, perWeek: number, minutes: number): ScoreActivity[] {
  const out: ScoreActivity[] = [];
  for (let d = 0; d < weeks * 7; d += 1) {
    if (d % 7 < perWeek) out.push(run(addDays(TODAY, -d), minutes));
  }
  return out;
}

describe("score curves", () => {
  it("saturates the base", () => {
    expect(baseScore(0)).toBe(0);
    expect(Math.round(baseScore(40))).toBe(63);
    expect(baseScore(500)).toBeLessThanOrEqual(100);
  });

  it("rewards the 0.8–1.3 ratio and punishes spikes", () => {
    expect(balanceScore(1)).toBe(100);
    expect(balanceScore(1.3)).toBe(100);
    expect(balanceScore(2)).toBe(0);
    expect(balanceScore(0.3)).toBe(40);
    expect(balanceScore(0.55)).toBeCloseTo(70);
  });

  it("scores consistency from active days and strong weeks", () => {
    expect(consistencyScore(16, 4)).toBe(100);
    expect(consistencyScore(0, 0)).toBe(0);
    expect(consistencyScore(8, 2)).toBe(50);
  });

  it("centres momentum on 50", () => {
    expect(momentumScore(40, 40)).toBe(50);
    expect(momentumScore(56, 40)).toBe(100);
    expect(momentumScore(24, 40)).toBe(0);
  });

  it("maps values to bands", () => {
    expect(bandFor(0).key).toBe("starting");
    expect(bandFor(45).key).toBe("steady");
    expect(bandFor(92).key).toBe("peak");
  });
});

describe("computeMarker", () => {
  it("is low and says so for an empty history", () => {
    const marker = computeMarker([], TODAY);
    expect(marker.value).toBeLessThan(30);
    expect(marker.confidence).toBe("low");
    expect(marker.call.kind).toBe("steady");
    expect(marker.readings.daysSinceLast).toBeNull();
  });

  it("scores a steady, consistent athlete well above an occasional one", () => {
    const steady = computeMarker(routine(16, 5, 50), TODAY);
    const occasional = computeMarker(routine(16, 1, 40), TODAY);
    expect(steady.value).toBeGreaterThan(occasional.value + 20);
    expect(steady.confidence).not.toBe("low");
    expect(steady.trend.length).toBeGreaterThan(80);
    expect(steady.trend.at(-1)?.value).toBe(steady.value);
  });

  it("re-weights when heart rate is missing instead of counting it as zero", () => {
    const withoutHr = routine(16, 5, 50).map((a) => ({ ...a, averageHeartrate: null }));
    const marker = computeMarker(withoutHr, TODAY);
    expect(marker.components.find((c) => c.key === "efficiency")?.value).toBeNull();
    expect(marker.value).toBeGreaterThan(50);
  });

  it("calls for recovery after a big spike in load", () => {
    const base = routine(12, 3, 30);
    const spike = [0, 1, 2, 3, 4].map((d) => run(addDays(TODAY, -d), 180, { sufferScore: 250 }));
    const marker = computeMarker([...base, ...spike], TODAY);
    expect(["rest", "easy"]).toContain(marker.call.kind);
    expect(marker.directions.some((d) => d.id === "ease-ramp")).toBe(true);
  });

  it("nudges a lapsed athlete to restart", () => {
    const lapsed = routine(12, 4, 45).filter((a) => a.day <= addDays(TODAY, -5));
    const marker = computeMarker(lapsed, TODAY);
    // Sessions fall on days 0–3 of each week, so the last one before day −5 is day −7.
    expect(marker.readings.daysSinceLast).toBe(7);
    expect(marker.call.title).toBe("Restart the rhythm");
  });

  it("detects improving efficiency in the main sport", () => {
    const history: ScoreActivity[] = [];
    for (let d = 0; d < 84; d += 3) {
      const recent = d < 42;
      history.push(run(addDays(TODAY, -d), 45, { averageSpeed: recent ? 3.3 : 3.0 }));
    }
    const marker = computeMarker(history, TODAY);
    expect(marker.components.find((c) => c.key === "efficiency")?.value).toBe(100);
  });

  it("tapers inside two weeks of a race", () => {
    const marker = computeMarker(routine(12, 5, 50), TODAY, { daysToRace: 9 });
    expect(marker.directions[0]?.id).toBe("taper");
  });
});

describe("todayCall", () => {
  it("gives a long session on a fresh weekend", () => {
    const call = todayCall({ form: 0, ratio: 1, daysSinceLast: 1, typicalMinutes: 50, weekday: 6, longSessionRecently: false });
    expect(call.kind).toBe("long");
    expect(call.minutes).toBe(80);
  });

  it("allows quality when fresh mid-week", () => {
    const call = todayCall({ form: 12, ratio: 0.85, daysSinceLast: 1, typicalMinutes: 40, weekday: 3, longSessionRecently: true });
    expect(call.kind).toBe("quality");
  });
});
