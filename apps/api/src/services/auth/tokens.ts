export const REFRESH_SKEW_MS = 5 * 60 * 1000;

export function shouldRefreshToken(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() - now.getTime() <= REFRESH_SKEW_MS;
}
