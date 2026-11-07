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

Leave it on `Ollama stream proxy on http://127.0.0.1:11435`.

Check:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:11435/api/tags
```

`200` means the proxy can see Ollama.

## 3. Tunnel

`cloudflared` publishes the proxy at `https://ollama.example.com`.

```bash
"$HOME/.cloudflared/cloudflared.exe" tunnel run --token "$(tr -d '\r\n' < "$HOME/.cloudflared/coach-ollama.token")"
```

Wait until the log says `Registered tunnel connection`. A later line, `Failed to refresh DNS local resolver`, is a local DNS timeout. The tunnel is still up when the connectivity table says `PASS`.

Check:

```bash
curl -sS https://ollama.example.com/api/tags
```

`200` and a model list means the site can reach the model. `530` means `cloudflared` is not connected. Refresh Chat Coach after this check succeeds.

## Local site

The deployed site does not need this. Use it to work on the app at `http://localhost:3000`.

```bash
pnpm dev
```
