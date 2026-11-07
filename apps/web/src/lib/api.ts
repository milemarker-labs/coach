import type {
  ActivityListResponse,
  ActivitySummary,
  AiConversation,
  AiSource,
  AiStatus,
  AthleteProfile,
  AuthStatus,
  CoachInsight,
  Journal,
  ChatRequest,
  HistoricalSyncRequest,
  SportList,
  SyncJob,
  SyncJobList,
  SyncStatus,
} from "@coach/shared";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const api = {
  authStatus: () => request<AuthStatus>("/api/auth/strava/status"),
  journal: () => request<Journal>("/api/journal/mangesh"),
  disconnect: () => request<AuthStatus>("/api/auth/strava", { method: "DELETE" }),
  syncStatus: () => request<SyncStatus>("/api/sync/status"),
  syncNow: () => request<SyncJob>("/api/sync/now", { method: "POST" }),
  startHistorical: (body: HistoricalSyncRequest) =>
    request<SyncJob>("/api/sync/historical", { method: "POST", body: JSON.stringify(body) }),
  continueJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}/continue`, { method: "POST" }),
  cancelJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}/cancel`, { method: "POST" }),
  getJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}`),
  syncJobs: () => request<SyncJobList>("/api/sync/jobs"),
  activities: (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    const query = search.toString();
    return request<ActivityListResponse>(`/api/activities${query ? `?${query}` : ""}`);
  },
  activity: (id: string) => request<ActivitySummary>(`/api/activities/${id}`),
  sports: () => request<SportList>("/api/activities/sports"),
  profile: () => request<AthleteProfile>("/api/profile"),
  saveProfile: (body: AthleteProfile) => request<AthleteProfile>("/api/profile", { method: "PUT", body: JSON.stringify(body) }),
  training: () => request<TrainingReport>("/api/intelligence/training"),
  dashboardInsight: (refresh = false) => request<InsightReport>(`/api/intelligence/dashboard${refresh ? "?refresh=1" : ""}`),
  activityInsight: (id: string, refresh = false) => request<InsightReport>(`/api/intelligence/activities/${id}${refresh ? "?refresh=1" : ""}`),
  longTermInsight: (refresh = false) => request<InsightReport>(`/api/intelligence/insights${refresh ? "?refresh=1" : ""}`),
  dataQuality: () => request<{ activities: number; missingHeartRate: number; missingStreams: number; note: string }>("/api/intelligence/data-quality"),
  aiStatus: () => request<AiStatus>("/api/ai/status"),
  latestConversation: () => request<{ conversation: AiConversation | null }>("/api/ai/conversations/latest"),
  async chat(
    body: ChatRequest,
    handlers: {
      onMeta: (meta: { conversationId: string; sources: AiSource[] }) => void;
      onDelta: (text: string) => void;
    },
  ) {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok || !response.body) {
      const text = await response.text();
      const payload: unknown = text ? JSON.parse(text) : null;
      const message = isRecord(payload) && typeof payload.error === "string" ? payload.error : response.statusText;
      throw new ApiError(response.status, message, payload);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6)) as { type: string; text?: string; error?: string; conversationId?: string; sources?: AiSource[] };
        if (event.type === "meta" && event.conversationId && event.sources) {
          handlers.onMeta({ conversationId: event.conversationId, sources: event.sources });
        }
        if (event.type === "delta" && event.text) handlers.onDelta(event.text);
        if (event.type === "error") throw new ApiError(502, event.error ?? "The local model failed.", event);
      }
      if (chunk.done) break;
    }
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers });
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = isRecord(body) && typeof body.error === "string" ? body.error : response.statusText;
    throw new ApiError(response.status, message, body);
  }
  return body as T;
}

export interface TrainingReport {
  method: string;
  weeks: { start: string; complete: boolean; runningDistanceMeters: number; trailDistanceMeters: number; strengthSessions: number }[];
  comparison: { note: string | null; runningDistanceMeters: { current: number; previous: number; difference: number } } | null;
}

export interface InsightReport {
  insight: CoachInsight | null;
  error: string | null;
  cached: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}
