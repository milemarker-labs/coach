/**
 * Plays a short conversation against the real coach model, with the real context for one athlete.
 * Same context builder, prompt and model endpoint as POST /api/ai/chat. Nothing is written.
 *
 *   pnpm --filter @coach/api coach:eval              # owner (JOURNAL_USER_ID)
 *   pnpm --filter @coach/api coach:eval -- <userId>
 *
 * Reads .dev.vars for DATABASE_URL and the OLLAMA_* settings. Prints replies, timings, and
 * a few automatic checks for the style rules (no raw metres, no headings, short casual replies).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCoachMessages, type ChatMessage } from "@coach/ai";
import { createDatabase } from "../src/db/index.ts";
import type { AppBindings } from "../src/env.ts";
import { coachModel } from "../src/services/ai/endpoint.ts";
import { buildCoachContext } from "../src/services/ai/context.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const line of readFileSync(resolve(root, ".dev.vars"), "utf8").split(/\r?\n/)) {
  const eq = line.indexOf("=");
  if (eq < 1 || line.trim().startsWith("#")) continue;
  env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const userId = process.argv.slice(2).find((arg) => arg !== "--") ?? env.JOURNAL_USER_ID;
if (!userId || !env.DATABASE_URL) throw new Error("Needs DATABASE_URL and a user id (argument or JOURNAL_USER_ID).");
const model = coachModel(env as unknown as AppBindings);
if (!model) throw new Error("The OLLAMA_* settings in .dev.vars do not describe a usable model.");

const turns = (process.env.COACH_EVAL_TURNS?.split("|") ?? [
  "What should my next long run look like?",
  "Good insights",
  "How did this week compare with last week?",
  "Am I ready for a hard session tomorrow?",
  "Why is my Marker what it is, and how do I raise it?",
  "My left knee has been a bit sore after runs. What should I do?",
]).map((text) => text.trim());

const { db, close } = createDatabase(env.DATABASE_URL);
try {
  const context = await buildCoachContext(db, userId, new Date(), "Asia/Kolkata");
  console.log(`model ${model.model} · today ${context.weekday} ${context.today} · ${context.recentActivities.length} recent activities · Marker ${context.marker?.value ?? "—"}\n`);
  // COACH_EVAL_FACTS=1 prints exactly what the model is told, to check its answers against.
  if (process.env.COACH_EVAL_FACTS) console.log(`${buildCoachMessages(context, [{ role: "user", content: "-" }])[0]?.content.split("TRAINING FACTS")[1] ?? ""}\n`);
  const history: ChatMessage[] = [];
  for (const text of turns) {
    history.push({ role: "user", content: text });
    const started = Date.now();
    const reply = (await model.provider.complete(buildCoachMessages(context, history))).trim();
    history.push({ role: "assistant", content: reply });
    const words = reply.split(/\s+/).filter(Boolean).length;
    const flags = [
      /\b\d{1,3}(,\d{3})+(\.\d+)? m\b|\b\d{4,} m\b/.test(reply) && "raw metres",
      /^#{1,6} |^\*\*[^*]+:\*\*\s*$/m.test(reply) && "heading",
      /\b\d{1,2}:\d{2} IST\b/.test(reply) && "clock time",
      /^(thanks|good|nice|great|ok)/i.test(text) && words > 70 && `long casual reply (${words} words)`,
    ].filter(Boolean);
    console.log(`> ${text}\n`);
    console.log(reply);
    console.log(`\n  [${((Date.now() - started) / 1000).toFixed(1)}s · ${words} words${flags.length ? ` · FLAGS: ${flags.join(", ")}` : " · style ok"}]\n${"─".repeat(72)}\n`);
  }
} finally {
  await close();
}
