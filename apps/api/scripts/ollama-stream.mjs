import { timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const upstream = "http://127.0.0.1:11434";
const port = 11435;
const token = readProxyToken();

if (!token) {
  console.error("OLLAMA_PROXY_TOKEN is required. Set it in apps/api/.dev.vars.");
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  if (!authorized(request, token)) {
    response.writeHead(401, { "content-type": "text/plain", "cache-control": "no-store" });
    response.end("Unauthorized");
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value == null || key === "host" || key === "content-length") continue;
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    headers.set("host", "127.0.0.1:11434");
    const upstreamResponse = await fetch(`${upstream}${request.url}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
    });
    const streaming = (request.url ?? "").startsWith("/api/chat");
    response.writeHead(upstreamResponse.status, {
      "content-type": streaming ? "text/event-stream; charset=utf-8" : upstreamResponse.headers.get("content-type") ?? "application/json",
      "cache-control": "no-cache, no-store, no-transform",
      "x-accel-buffering": "no",
    });
    if (!upstreamResponse.body) {
      response.end();
      return;
    }
    const reader = upstreamResponse.body.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      response.write(Buffer.from(chunk.value));
    }
    response.end();
  } catch (error) {
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain" });
    response.end(error instanceof Error ? error.message : "Ollama proxy failed");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Ollama stream proxy on http://127.0.0.1:${port}`);
});

function readProxyToken() {
  const fromEnv = process.env.OLLAMA_PROXY_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const file = resolve(dirname(fileURLToPath(import.meta.url)), "../.dev.vars");
  if (!existsSync(file)) return "";
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("OLLAMA_PROXY_TOKEN=")) continue;
    return trimmed.slice("OLLAMA_PROXY_TOKEN=".length).trim();
  }
  return "";
}

function authorized(request, expected) {
  const header = request.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice("Bearer ".length));
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}
