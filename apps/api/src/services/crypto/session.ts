import { timingSafeEqual } from "./compare.ts";
import { base64UrlToBytes, bytesToBase64Url } from "./bytes.ts";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type SessionPayload = {
  userId: string;
  exp: number;
};

export async function signSession(userId: string, secret: string, now = Date.now()): Promise<string> {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ userId, exp: now + SESSION_TTL_MS } satisfies SessionPayload)));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySession(token: string, secret: string, now = Date.now()): Promise<string | null> {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = await sign(payload, secret);
  if (!(await timingSafeEqual(signature, expected))) return null;

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") return null;
  if (parsed.exp <= now) return null;
  return parsed.userId;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}
