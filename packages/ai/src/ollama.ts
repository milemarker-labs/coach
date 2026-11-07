import type { AIProvider, ChatMessage } from "./types.ts";

export interface OllamaOptions {
  baseUrl: string;
  model: string;
}

/** Enough room for a full coaching reply. The server default was cutting answers off mid-sentence. */
const GENERATION = { num_predict: 1536 };

export function createOllamaProvider(options: OllamaOptions): AIProvider {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  return {
    async complete(messages: ChatMessage[]) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: options.model, messages, stream: false, think: false, options: GENERATION }),
      });
      if (!response.ok) throw new Error(ollamaError(response.status, await response.text()));
      const body = (await response.json()) as { message?: { content?: string } };
      return body.message?.content ?? "";
    },
    async listModels() {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama model list failed (${response.status})`);
      const body = (await response.json()) as { models?: { name?: string }[] };
      return (body.models ?? []).map((model) => model.name).filter((name): name is string => Boolean(name));
    },
    async *stream(messages: ChatMessage[]) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: options.model,
          messages,
          stream: true,
          think: false,
          options: GENERATION,
        }),
      });
      if (!response.ok || !response.body) {
        const detail = await response.text();
        throw new Error(ollamaError(response.status, detail));
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let emitted = false;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const text = nextDelta(line, emitted);
          if (text === null) continue;
          emitted = true;
          yield text;
        }
      }
      const tail = nextDelta(buffer, emitted);
      if (tail) yield tail;
    },
  };
}

export function contentFromLine(line: string): string {
  const chunk = readChunk(line);
  if (!chunk || chunk.done) return "";
  return chunk.content;
}

function nextDelta(line: string, alreadyEmitted: boolean): string | null {
  const chunk = readChunk(line);
  if (!chunk || chunk.content.length === 0) return null;
  if (chunk.done && alreadyEmitted) return null;
  return chunk.content;
}

function readChunk(line: string): { content: string; done: boolean } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!isRecord(payload)) return null;
  const message = isRecord(payload.message) ? payload.message : null;
  return {
    done: payload.done === true,
    content: typeof message?.content === "string" ? message.content : "",
  };
}

function ollamaError(status: number, detail: string): string {
  try {
    const body = JSON.parse(detail) as { error?: string };
    if (body.error) return body.error.slice(0, 300);
  } catch {
    // The body was not JSON.
  }
  return `Ollama request failed (${status})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}
