import { useQuery } from "@tanstack/react-query";
import { useDataMode } from "@/data/mode.ts";
import { api } from "@/lib/api.ts";

export type InsightScope = { kind: "dashboard" } | { kind: "long-term" } | { kind: "activity"; id: string };

/**
 * The model-written interpretation from the Coach API. Only requested for a connected athlete:
 * demo data has nothing real for a model to interpret.
 */
export function useCoachInsight(scope: InsightScope) {
  const { mode } = useDataMode();
  const id = scope.kind === "activity" ? scope.id : "";
  const query = useQuery({
    queryKey: ["coach-insight", scope.kind, id],
    queryFn: () => {
      if (scope.kind === "activity") return api.activityInsight(scope.id);
      return scope.kind === "dashboard" ? api.dashboardInsight() : api.longTermInsight();
    },
    enabled: mode === "live",
    staleTime: 5 * 60_000,
  });
  return {
    enabled: mode === "live",
    loading: mode === "live" && query.isLoading,
    insight: query.data?.insight ?? null,
    error: query.isError ? "The Coach API could not produce an interpretation." : (query.data?.error ?? null),
    cached: query.data?.cached ?? false,
  };
}
