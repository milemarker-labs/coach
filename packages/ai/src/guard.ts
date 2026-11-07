export interface OllamaEndpoint {
  baseUrl: string;
  model: string;
}

export function ollamaEndpoint(input: { baseUrl?: string; model?: string; allowedHost?: string }): OllamaEndpoint | null {
  const raw = input.baseUrl?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const loopback = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]";
  const allowedHost = input.allowedHost?.trim().toLowerCase();
  const allowedTunnel = url.protocol === "https:" && Boolean(allowedHost) && url.hostname === allowedHost;
  if (!loopback && !allowedTunnel) return null;
  const model = input.model?.trim() || "qwen3.5:9b";
  if (!/^[\w.:-]+$/.test(model)) return null;
  return { baseUrl: url.origin, model };
}
