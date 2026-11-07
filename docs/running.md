# Running the model

Production chat on `https://coach.milemarkerlabs.com` calls Ollama on this PC through a Cloudflare Tunnel. Three processes have to stay open, each in its own terminal, from the repository root. Start them in this order.

## 1. Ollama

Ollama listens on `http://127.0.0.1:11434`. The coach uses `qwen3.5:9b`.

```bash
ollama serve
```

If the Ollama app is already running, this command fails because port 11434 is taken. That is the server you need. Leave the app open.

Check:

```bash
curl -sS http://127.0.0.1:11434/api/tags
```

The JSON should include `qwen3.5:9b`.

## 2. Stream proxy

The Worker cannot read Ollama's raw stream. This proxy forwards `127.0.0.1:11435` to Ollama and sends the reply as an event stream.

```bash
node apps/api/scripts/ollama-stream.mjs
```

Leave it on `Ollama stream proxy on http://127.0.0.1:11435`. The process reads `OLLAMA_PROXY_TOKEN` from the environment or from `apps/api/.dev.vars`, and it refuses to start without one. A request without `Authorization: Bearer <that token>` gets `401`.

Check the local proxy with the token from `.dev.vars`. Do not print the token. `200` means the proxy can see Ollama.

## 3. Tunnel

`cloudflared` publishes the proxy at the hostname stored in the `OLLAMA_BASE_URL` secret. Cloudflare Access allows only the Worker service token. A request without `CF-Access-Client-Id` and `CF-Access-Client-Secret` does not reach this PC.

```bash
"$HOME/.cloudflared/cloudflared.exe" tunnel run --token "$(tr -d '\r\n' < "$HOME/.cloudflared/coach-ollama.token")"
```

Wait until the log says `Registered tunnel connection`. A later line, `Failed to refresh DNS local resolver`, is a local DNS timeout. The tunnel is still up when the connectivity table says `PASS`.

Check the public hostname with no credentials. `302` or `403` means Access is in front of the tunnel. `200` means the hostname is still open. `530` means `cloudflared` is not connected. Chat Coach reaches the model only after the Worker presents its Access service token and the proxy bearer token.

## Local site

The deployed site does not need this. Use it to work on the app at `http://localhost:3000`.

```bash
pnpm dev
```
