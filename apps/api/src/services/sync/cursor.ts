export const PAGE_SIZE = 200;
export const LEASE_MS = 60_000;
export const INCREMENTAL_OVERLAP_SECONDS = 7 * 24 * 60 * 60;

export type SyncCursor = {
  page: number;
  after?: number;
  before?: number;
};

export type PageOutcome =
  | { status: "pending"; nextPage: number }
  | { status: "completed"; nextPage: number };

export function nextPageOutcome(page: number, received: number, perPage = PAGE_SIZE): PageOutcome {
  if (received < perPage) return { status: "completed", nextPage: page };
  return { status: "pending", nextPage: page + 1 };
}

export function canAcquireJob(status: string, leaseUntil: Date | null, now: Date): boolean {
  if (status === "pending" || status === "failed") return true;
  if (status === "running") return leaseUntil == null || leaseUntil.getTime() <= now.getTime();
  return false;
}

export function isWaitingForRateLimit(retryAfter: Date | null, now: Date): boolean {
  return retryAfter != null && retryAfter.getTime() > now.getTime();
}

export function incrementalAfter(now: Date): number {
  return Math.floor(now.getTime() / 1000) - INCREMENTAL_OVERLAP_SECONDS;
}

export function dateToEpochStart(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00.000Z`) / 1000);
}

export function dateToEpochNextDay(isoDate: string): number {
  return dateToEpochStart(isoDate) + 24 * 60 * 60;
}
