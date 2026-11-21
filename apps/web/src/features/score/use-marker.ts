import { computeMarker, sportKey, type ActivitySummary, type MarkerScore, type ScoreActivity } from "@coach/shared";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDataMode } from "@/data/mode.ts";
import { useActivityHistory } from "@/data/queries.ts";
import { dayKeyOf, diffDays, todayKey } from "@/features/analytics/calculations/dates.ts";
import { api } from "@/lib/api.ts";

export function toScoreActivity(activity: ActivitySummary): ScoreActivity {
  return {
    day: dayKeyOf(activity),
    sport: sportKey(activity.sportType, activity.activityType),
    sufferScore: activity.sufferScore,
    movingTime: activity.movingTime,
    distance: activity.distance,
    averageSpeed: activity.averageSpeed,
    averageHeartrate: activity.averageHeartrate,
  };
}

/** The athlete profile (race goal and availability). Live athletes only. */
export function useProfile() {
  const { mode } = useDataMode();
  return useQuery({ queryKey: ["profile"], queryFn: api.profile, enabled: mode === "live" });
}

/** The Marker score for the signed-in (or demo) athlete, from the shared year of history. */
export function useMarker(): { marker: MarkerScore | null; isLoading: boolean; isError: boolean } {
  const history = useActivityHistory();
  const profile = useProfile();
  const today = todayKey();
  const raceDate = profile.data?.targetRaceDate ?? null;

  const marker = useMemo(() => {
    if (!history.data) return null;
    const daysToRace = raceDate ? diffDays(raceDate, today) : null;
    return computeMarker(history.data.map(toScoreActivity), today, { daysToRace });
  }, [history.data, raceDate, today]);

  return { marker, isLoading: history.isLoading, isError: history.isError };
}
