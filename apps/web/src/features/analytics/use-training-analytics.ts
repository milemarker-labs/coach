import { useMemo } from "react";
import { useActivityHistory } from "@/data/queries.ts";
import { addDays, todayKey } from "./calculations/dates.ts";
import { dailyLoad, fitnessSeries, summarizeFitness } from "./calculations/load.ts";
import { buildObservations } from "./calculations/observations.ts";
import { bucketVolume, compareWindows } from "./calculations/volume.ts";

export const FITNESS_DAYS = 90;
export const WEEKS_SHOWN = 12;

/**
 * Everything the dashboard and training screens derive from the last year of activities.
 * The calculations are pure functions in ./calculations; this hook only wires them to the query.
 */
export function useTrainingAnalytics() {
  const history = useActivityHistory();
  const today = todayKey();
  const activities = history.data;

  const derived = useMemo(() => {
    if (!activities) return null;
    const fitness = fitnessSeries(activities, addDays(today, -(FITNESS_DAYS - 1)), today);
    const fitnessSummary = summarizeFitness(fitness);
    return {
      load7: dailyLoad(activities, addDays(today, -6), today),
      load28: dailyLoad(activities, addDays(today, -27), today),
      fitness,
      fitnessSummary,
      weekly: bucketVolume(activities, "week", addDays(today, -(WEEKS_SHOWN * 7 - 1)), today),
      comparison: compareWindows(activities, today, 7),
      observations: buildObservations(activities, today, fitnessSummary),
    };
  }, [activities, today]);

  return {
    isLoading: history.isLoading,
    isError: history.isError,
    refetch: history.refetch,
    activities: activities ?? [],
    today,
    ...derived,
  };
}
