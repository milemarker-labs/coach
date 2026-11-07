export function safeErrorMessage(error: unknown): string {
  return scrub(errorText(error)).slice(0, 500);
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      const code = "code" in current && typeof current.code === "string" ? current.code : "";
      if (code) parts.push(code);
      current = "cause" in current ? current.cause : undefined;
      continue;
    }
    parts.push(String(current));
    break;
  }
  return parts.filter(Boolean).join(": ");
}

function scrub(message: string): string {
  return message
    .replace(/bearer\s+\S+/gi, "bearer [redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .replace(/access_token=\S+/gi, "access_token=[redacted]")
    .replace(/refresh_token=\S+/gi, "refresh_token=[redacted]");
}
