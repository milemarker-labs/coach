import { describe, expect, it } from "vitest";
import { JOURNAL_FITNESS_DAYS, journalFitness, journalLoadDay } from "./fitness.ts";

describe("journalFitness", () => {
  it("builds fatigue faster than fitness and stays at zero with no training", () => {
    const series = journalFitness([{ day: "2026-10-01", sufferScore: 100, movingTime: 3600 }], "2026-10-02");
    const first = series[0];
    expect(first?.day).toBe("2026-07-05");
    expect(series).toHaveLength(JOURNAL_FITNESS_DAYS);
    expect(series.find((point) => point.day === "2026-10-01")).toMatchObject({
      fatigue: expect.any(Number),
    });
    const loaded = series.find((point) => point.day === "2026-10-01");
    expect(loaded && loaded.fatigue > loaded.fitness).toBe(true);

    const quiet = journalFitness([], "2026-10-03");
    expect(quiet.every((point) => point.fitness === 0 && point.fatigue === 0 && point.form === 0)).toBe(true);
  });

  it("uses a suffer score ahead of moving time, and moving minutes when there is no score", () => {
    const scored = journalFitness([{ day: "2026-10-01", sufferScore: 80, movingTime: 3600 }], "2026-10-01");
    const estimated = journalFitness([{ day: "2026-10-01", sufferScore: null, movingTime: 3600 }], "2026-10-01");
    const scoredDay = scored.at(-1);
    const estimatedDay = estimated.at(-1);
    expect(scoredDay && estimatedDay && scoredDay.fatigue > estimatedDay.fatigue).toBe(true);
  });

  it("reads the local wall-clock day", () => {
    const local = new Date(Date.UTC(2026, 10, 7, 8, 0, 0));
    const utc = new Date("2026-11-06T20:30:00.000Z");
    expect(journalLoadDay(utc, local)).toBe("2026-11-07");
    expect(journalLoadDay(utc, null)).toBe("2026-11-06");
  });
});
