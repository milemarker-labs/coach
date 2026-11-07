import http from "node:http";

const upstream = "http://127.0.0.1:11434";
const port = 11435;

const server = http.createServer(async (request, response) => {
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
