import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const envFile = resolve(apiRoot, ".env");

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (env[key] === undefined) env[key] = value;
  }
}

const databaseUrl = env.DATABASE_URL;
if (databaseUrl) ensureDevVar(resolve(apiRoot, ".dev.vars"), "DATABASE_URL", databaseUrl);

const child = spawn(process.execPath, ["--experimental-strip-types", "src/node.ts"], {
  cwd: apiRoot,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

function ensureDevVar(file, key, value) {
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const lines = current.split(/\r?\n/);
  if (lines.some((line) => line.startsWith(`${key}=`) && line.slice(key.length + 1).trim() !== "")) return;
  const kept = lines.filter((line) => !line.startsWith(`${key}=`));
  while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();
  kept.push(`${key}=${value}`, "");
  writeFileSync(file, kept.join("\n"));
}
