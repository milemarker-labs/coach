export type AthleteDecision =
  | { ok: true }
  | { ok: false; reason: "allowlist" | "different-athlete" };

export function decideAthleteAccess(input: {
  existingAthleteId: bigint | null;
  incomingAthleteId: bigint;
  allowedAthleteId: string | null | undefined;
}): AthleteDecision {
  const allowed = parseOptionalAthleteId(input.allowedAthleteId);
  if (allowed != null && allowed !== input.incomingAthleteId) {
    return { ok: false, reason: "allowlist" };
  }
  if (input.existingAthleteId != null && input.existingAthleteId !== input.incomingAthleteId) {
    return { ok: false, reason: "different-athlete" };
  }
  return { ok: true };
}

export function parseOptionalAthleteId(value: string | null | undefined): bigint | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}
