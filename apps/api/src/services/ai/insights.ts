import { coachModel } from "./endpoint.ts";
import { coachInsightSchema, type CoachInsight } from "@coach/shared";
import { and, eq } from "drizzle-orm";
import { aiInsights } from "../../db/schema/index.ts";
import type { Database } from "../../db/index.ts";
import type { AppBindings } from "../../env.ts";
import { PROMPT_VERSION, activityPrompt, dashboardPrompt } from "./prompts.ts";

export async function cachedInsight(
  db: Database,
  env: AppBindings,
  input: { userId: string; kind: string; subjectKey: string; context: unknown; prompt: "dashboard" | "activity"; refresh: boolean },
): Promise<{ insight: CoachInsight | null; error: string | null; cached: boolean }> {
  const endpoint = coachModel(env);
  const contextHash = await hashContext(input.context);
  const [existing] = await db
    .select()
    .from(aiInsights)
    .where(and(eq(aiInsights.userId, input.userId), eq(aiInsights.kind, input.kind), eq(aiInsights.subjectKey, input.subjectKey)))
    .limit(1);
  if (existing && existing.contextHash === contextHash && existing.promptVersion === PROMPT_VERSION && !input.refresh) {
    const parsed = coachInsightSchema.safeParse(existing.response);
    if (parsed.success) return { insight: filterEvidence(parsed.data, input.context), error: null, cached: true };
  }
  if (!endpoint) return { insight: null, error: "The local model is only available when Coach is running on this machine.", cached: false };
  const provider = endpoint.provider;
  const system = input.prompt === "dashboard" ? dashboardPrompt(input.context) : activityPrompt(input.context);
  let lastError = "The model did not return a valid coaching response.";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const content = await provider.complete([
      { role: "system", content: attempt === 0 ? system : `${system}\nThe previous response was invalid: ${lastError}. Return only the JSON object.` },
      { role: "user", content: "Interpret this training context." },
    ]);
    const parsed = coachInsightSchema.safeParse(parseJson(content));
    if (!parsed.success) {
      lastError = parsed.error.issues.map((issue) => issue.message).join("; ");
      continue;
    }
    const insight = filterEvidence(parsed.data, input.context);
    const supportingActivityIds = insight.evidence.map((item) => item.activityId);
    if (existing) {
      await db
        .update(aiInsights)
        .set({
          contextHash,
          promptVersion: PROMPT_VERSION,
          provider: "ollama",
          model: endpoint.model,
          response: insight,
          supportingActivityIds,
          confidence: insight.confidence,
          generatedAt: new Date(),
        })
        .where(eq(aiInsights.id, existing.id));
    } else {
      await db.insert(aiInsights).values({
        userId: input.userId,
        kind: input.kind,
        subjectKey: input.subjectKey,
        contextHash,
        promptVersion: PROMPT_VERSION,
        provider: "ollama",
        model: endpoint.model,
        response: insight,
        supportingActivityIds,
        confidence: insight.confidence,
      });
    }
    return { insight, error: null, cached: false };
  }
  return { insight: null, error: lastError, cached: false };
}

function filterEvidence(insight: CoachInsight, context: unknown): CoachInsight {
  const allowed = new Set(collectIds(context));
  return { ...insight, evidence: insight.evidence.filter((item) => allowed.has(item.activityId)) };
}

function collectIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectIds);
  if (value != null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => (key === "id" && typeof entry === "string" ? [entry] : collectIds(entry)));
  }
  return [];
}

function parseJson(content: string): unknown {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function hashContext(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
