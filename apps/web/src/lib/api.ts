import type {
  ActivityListResponse,
  ActivitySummary,
  AuthStatus,
  HistoricalSyncRequest,
  SportList,
  SyncJob,
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
  disconnect: () => request<AuthStatus>("/api/auth/strava", { method: "DELETE" }),
  syncStatus: () => request<SyncStatus>("/api/sync/status"),
  syncNow: () => request<SyncJob>("/api/sync/now", { method: "POST" }),
  startHistorical: (body: HistoricalSyncRequest) =>
    request<SyncJob>("/api/sync/historical", { method: "POST", body: JSON.stringify(body) }),
  continueJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}/continue`, { method: "POST" }),
  cancelJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}/cancel`, { method: "POST" }),
  getJob: (id: string) => request<SyncJob>(`/api/sync/jobs/${id}`),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}
