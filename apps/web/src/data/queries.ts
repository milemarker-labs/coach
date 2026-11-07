import type { ActivityListResponse, ActivitySummary, SportList } from "@coach/shared";
import { sportKey } from "@coach/shared";
import { useQuery } from "@tanstack/react-query";
import { addDays, dayKeyOf, todayKey } from "@/features/analytics/calculations/dates.ts";
import type { ActivityDetail } from "@/features/activities/types.ts";
import { api } from "@/lib/api.ts";
import { useDataMode, type DataMode } from "./mode.ts";
import { mockActivities } from "./mock/activities.ts";
import { mockSplits } from "./mock/splits.ts";

/** How much history the analytics screens load. Longer ranges are not offered. */
export const HISTORY_DAYS = 365;
const PAGE_SIZE = 100;
const MAX_PAGES = 30;

export interface ActivityListParams {
  type?: string;
  from?: string;
  to?: string;
  sort: "asc" | "desc";
  offset: number;
  limit: number;
}

function filterMock(params: Pick<ActivityListParams, "type" | "from" | "to">): ActivitySummary[] {
  return mockActivities().filter((activity) => {
    if (params.type && sportKey(activity.sportType, activity.activityType) !== params.type) return false;
    const day = dayKeyOf(activity);
    if (params.from && day < params.from) return false;
    if (params.to && day > params.to) return false;
    return true;
  });
}

async function fetchList(mode: DataMode, params: ActivityListParams): Promise<ActivityListResponse> {
  if (mode === "demo") {
    const rows = filterMock(params);
    const ordered = params.sort === "asc" ? [...rows].reverse() : rows;
    return {
      activities: ordered.slice(params.offset, params.offset + params.limit),
      total: ordered.length,
      limit: params.limit,
      offset: params.offset,
    };
  }
  return api.activities({ ...params });
}

async function fetchHistory(mode: DataMode): Promise<ActivitySummary[]> {
  const from = addDays(todayKey(), -(HISTORY_DAYS - 1));
  if (mode === "demo") return filterMock({ from });
  const rows: ActivitySummary[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await api.activities({ from, sort: "desc", limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    rows.push(...response.activities);
    if (rows.length >= response.total || response.activities.length === 0) break;
  }
  return rows;
}

async function fetchDetail(mode: DataMode, id: string): Promise<ActivityDetail> {
  if (mode === "demo") {
    const summary = mockActivities().find((activity) => activity.id === id);
    if (!summary) throw new Error("Activity not found");
    return { summary, splits: mockSplits(summary) };
  }
  // The API stores summaries only, so there are no splits to show for live activities yet.
  return { summary: await api.activity(id), splits: null };
}

async function fetchSports(mode: DataMode): Promise<SportList> {
  if (mode === "demo") {
    const counts = new Map<string, number>();
    for (const activity of mockActivities()) {
      const sport = sportKey(activity.sportType, activity.activityType);
      counts.set(sport, (counts.get(sport) ?? 0) + 1);
    }
    return { sports: [...counts.entries()].map(([sport, count]) => ({ sport, count })).sort((a, b) => b.count - a.count) };
  }
  return api.sports();
}

export function useActivityList(params: ActivityListParams) {
  const { mode } = useDataMode();
  return useQuery({
    queryKey: ["activities", mode, "list", params],
    queryFn: () => fetchList(mode, params),
    enabled: mode !== "loading",
    placeholderData: (previous) => previous,
  });
}

/** The last year of activities, shared by the dashboard, training and insights screens. */
export function useActivityHistory() {
  const { mode } = useDataMode();
  return useQuery({
    queryKey: ["activities", mode, "history"],
    queryFn: () => fetchHistory(mode),
    enabled: mode !== "loading",
    staleTime: 60_000,
  });
}

export function useActivityDetail(id: string | undefined) {
  const { mode } = useDataMode();
  return useQuery({
    queryKey: ["activities", mode, "detail", id],
    queryFn: () => fetchDetail(mode, id ?? ""),
    enabled: mode !== "loading" && Boolean(id),
  });
}

export function useSports() {
  const { mode } = useDataMode();
  return useQuery({
    queryKey: ["sports", mode],
    queryFn: () => fetchSports(mode),
    enabled: mode !== "loading",
  });
}

export function useSyncStatus() {
  const { mode } = useDataMode();
  return useQuery({ queryKey: ["sync-status"], queryFn: api.syncStatus, enabled: mode === "live" });
}

export function useSyncJobs() {
  const { mode } = useDataMode();
  return useQuery({ queryKey: ["sync-jobs"], queryFn: api.syncJobs, enabled: mode === "live" });
}
