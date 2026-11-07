import { createOllamaProvider, ollamaEndpoint, type AIProvider } from "@coach/ai";
import type { AppBindings } from "../../env.ts";

export interface CoachModel {
  provider: AIProvider;
  model: string;
  baseUrl: string;
}

export function coachModel(env: AppBindings): CoachModel | null {
  const endpoint = ollamaEndpoint({
    baseUrl: env.OLLAMA_BASE_URL,
    model: env.OLLAMA_MODEL,
    allowedHost: env.OLLAMA_ALLOWED_HOST,
  });
  if (!endpoint) return null;
  return {
    ...endpoint,
    provider: createOllamaProvider({ ...endpoint, headers: ollamaRequestHeaders(env) }),
  };
}

export function ollamaRequestHeaders(env: Pick<AppBindings, "OLLAMA_PROXY_TOKEN" | "CF_ACCESS_CLIENT_ID" | "CF_ACCESS_CLIENT_SECRET">): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = env.OLLAMA_PROXY_TOKEN?.trim();
  if (token) headers.authorization = `Bearer ${token}`;
  const clientId = env.CF_ACCESS_CLIENT_ID?.trim();
  const clientSecret = env.CF_ACCESS_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    headers["cf-access-client-id"] = clientId;
    headers["cf-access-client-secret"] = clientSecret;
  }
  return headers;
}
