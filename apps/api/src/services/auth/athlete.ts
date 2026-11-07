export const ATHLETE_LIMIT = 5;

export type AccountRole = "owner" | "athlete";
export type AccountStatus = "pending" | "approved";

export type AthleteAccess =
  | { ok: true; action: "create-owner" }
  | { ok: true; action: "create-pending" }
  | { ok: true; action: "sign-in"; userId: string }
  | { ok: false; reason: "allowlist" | "roster-full" };

export function decideAthleteAccess(input: {
  ownerAthleteId: bigint | null;
  knownUser: { id: string } | null;
  incomingAthleteId: bigint;
  allowedAthleteId: string | null | undefined;
  athleteCount: number;
}): AthleteAccess {
  if (input.knownUser) return { ok: true, action: "sign-in", userId: input.knownUser.id };
  if (input.ownerAthleteId == null) {
    const allowed = parseOptionalAthleteId(input.allowedAthleteId);
    if (allowed != null && allowed !== input.incomingAthleteId) return { ok: false, reason: "allowlist" };
    return { ok: true, action: "create-owner" };
  }
  if (input.athleteCount >= ATHLETE_LIMIT) return { ok: false, reason: "roster-full" };
  return { ok: true, action: "create-pending" };
}

/** Whose archive a request reads. The owner can open an approved athlete. Everyone else reads their own. */
export function archiveUserId(
  actor: { id: string; role: string },
  viewed: { id: string; role: string; status: string } | null,
): string {
  if (actor.role === "owner" && viewed && viewed.role === "athlete" && viewed.status === "approved") return viewed.id;
  return actor.id;
}

export function accountRole(value: string): AccountRole | null {
  return value === "owner" || value === "athlete" ? value : null;
}

export function accountStatus(value: string): AccountStatus | null {
  return value === "pending" || value === "approved" ? value : null;
}

export function parseOptionalAthleteId(value: string | null | undefined): bigint | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}
