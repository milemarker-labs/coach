export interface RateLimitSnapshot {
  readUsage15m: number | null;
  readLimit15m: number | null;
  readUsageDay: number | null;
  readLimitDay: number | null;
  retryAfterSeconds: number | null;
  usageHeader: string | null;
  limitHeader: string | null;
}

export const RATE_LIMIT_HEADROOM = 2;

export function parseRateLimitPair(header: string | null): { short: number | null; day: number | null } {
  if (!header) return { short: null, day: null };
  const [shortRaw, dayRaw] = header.split(",");
  const short = Number(shortRaw?.trim());
  const day = Number(dayRaw?.trim());
  return {
    short: Number.isFinite(short) ? short : null,
    day: Number.isFinite(day) ? day : null,
  };
}

export function readRateLimit(status: number, headers: Headers): RateLimitSnapshot {
  const usageHeader = headers.get("x-readratelimit-usage");
  const limitHeader = headers.get("x-readratelimit-limit");
  const usage = parseRateLimitPair(usageHeader);
  const limit = parseRateLimitPair(limitHeader);
  return {
    readUsage15m: usage.short,
    readLimit15m: limit.short,
    readUsageDay: usage.day,
    readLimitDay: limit.day,
    retryAfterSeconds: retryAfterFrom(status, headers),
    usageHeader,
    limitHeader,
  };
}

export function shouldPauseForRateLimit(snapshot: RateLimitSnapshot): {
  pause: boolean;
  retryAfterSeconds: number;
} {
  if (snapshot.retryAfterSeconds != null && snapshot.retryAfterSeconds > 0) {
    return { pause: true, retryAfterSeconds: snapshot.retryAfterSeconds };
  }
  if (
    snapshot.readUsage15m != null &&
    snapshot.readLimit15m != null &&
    snapshot.readUsage15m >= snapshot.readLimit15m - RATE_LIMIT_HEADROOM
  ) {
    return { pause: true, retryAfterSeconds: 15 * 60 };
  }
  if (
    snapshot.readUsageDay != null &&
    snapshot.readLimitDay != null &&
    snapshot.readUsageDay >= snapshot.readLimitDay - RATE_LIMIT_HEADROOM
  ) {
    return { pause: true, retryAfterSeconds: 60 * 60 };
  }
  return { pause: false, retryAfterSeconds: 0 };
}

function retryAfterFrom(status: number, headers: Headers): number | null {
  if (status !== 429) return null;
  const raw = headers.get("retry-after");
  if (!raw) return 15 * 60;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(1, Math.trunc(seconds));
  const date = Date.parse(raw);
  if (Number.isNaN(date)) return 15 * 60;
  return Math.max(1, Math.ceil((date - Date.now()) / 1000));
}
