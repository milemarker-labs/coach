import { buildCoachMessages, createOllamaProvider, ollamaEndpoint, type ChatMessage } from "@coach/ai";
import { aiConversationSchema, aiStatusSchema, chatRequestSchema } from "@coach/shared";
import { and, asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "../db/index.ts";
import { aiConversations, aiMessages } from "../db/schema/index.ts";
import { databaseConnectionString, type AppBindings, type AppVariables } from "../env.ts";
import { requireUser } from "../middleware/session.ts";
import { buildCoachContext } from "../services/ai/context.ts";
import { safeErrorMessage } from "../services/errors.ts";

export const aiRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

aiRoutes.use("*", requireUser);

aiRoutes.get("/status", async (c) => {
  const endpoint = ollamaEndpoint({ baseUrl: c.env.OLLAMA_BASE_URL, model: c.env.OLLAMA_MODEL });
  if (!endpoint) {
    return c.json(aiStatusSchema.parse({ provider: "ollama", model: null, reachable: false, models: [], error: "Local model is not configured." }));
  }
  try {
    const models = await createOllamaProvider(endpoint).listModels();
    const installed = models.includes(endpoint.model);
    return c.json(
      aiStatusSchema.parse({
        provider: "ollama",
        model: endpoint.model,
        reachable: true,
        models,
        error: installed ? null : `${endpoint.model} is not installed in Ollama.`,
      }),
    );
  } catch (error) {
    return c.json(
      aiStatusSchema.parse({
        provider: "ollama",
        model: endpoint.model,
        reachable: false,
        models: [],
        error: safeErrorMessage(error),
      }),
    );
  }
});

aiRoutes.get("/conversations/latest", async (c) => {
  const db = await c.var.openDb();
  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, c.var.userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(1);
  if (!conversation) return c.json({ conversation: null });
  return c.json({ conversation: await serializeConversation(db, conversation) });
});

aiRoutes.post("/chat", async (c) => {
  const endpoint = ollamaEndpoint({ baseUrl: c.env.OLLAMA_BASE_URL, model: c.env.OLLAMA_MODEL });
  if (!endpoint) return c.json({ error: "The local model is only available when Coach is running on this machine." }, 503);
  const parsed = chatRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);

  const db = await c.var.openDb();
  const conversation = await openConversation(db, c.var.userId, parsed.data.conversationId, parsed.data.message);
  if (!conversation) return c.json({ error: "Conversation not found" }, 404);
  await db.insert(aiMessages).values({ conversationId: conversation.id, role: "user", content: parsed.data.message, sources: [] });
  const history = await loadHistory(db, conversation.id);
  const context = await buildCoachContext(db, c.var.userId);
  const sources = context.recentActivities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    sport: activity.sport,
    startedAt: activity.startedAt,
  }));
  const messages = buildCoachMessages(context, history);
  const provider = createOllamaProvider(endpoint);
  const connectionString = databaseConnectionString(c.env);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const stored = createDatabase(connectionString);
      let reply = "";
      try {
        send({ type: "meta", conversationId: conversation.id, sources });
        for await (const delta of provider.stream(messages)) {
          reply += delta;
          send({ type: "delta", text: delta });
        }
        const content = reply.trim() || "The local model did not return a reply.";
        await stored.db.insert(aiMessages).values({ conversationId: conversation.id, role: "assistant", content, sources });
        await stored.db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversation.id));
        send({ type: "done" });
      } catch (error) {
        send({ type: "error", error: safeErrorMessage(error) });
      } finally {
        await stored.close();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
});

async function openConversation(
  db: Awaited<ReturnType<AppVariables["openDb"]>>,
  userId: string,
  conversationId: string | undefined,
  message: string,
) {
  if (!conversationId) {
    const [created] = await db
      .insert(aiConversations)
      .values({ userId, title: message.slice(0, 80) })
      .returning();
    return created;
  }
  const [existing] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)))
    .limit(1);
  return existing;
}

async function loadHistory(db: Awaited<ReturnType<AppVariables["openDb"]>>, conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(desc(aiMessages.createdAt))
    .limit(12);
  return rows.reverse().flatMap((row) => {
    if (row.role !== "user" && row.role !== "assistant") return [];
    return [{ role: row.role, content: row.content }];
  });
}

async function serializeConversation(
  db: Awaited<ReturnType<AppVariables["openDb"]>>,
  conversation: typeof aiConversations.$inferSelect,
) {
  const messages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversation.id))
    .orderBy(asc(aiMessages.createdAt));
  return aiConversationSchema.parse({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
    messages: messages.flatMap((message) => {
      if (message.role !== "user" && message.role !== "assistant") return [];
      return [
        {
          id: message.id,
          role: message.role,
          content: message.content,
          sources: message.sources ?? [],
          createdAt: message.createdAt.toISOString(),
        },
      ];
    }),
  });
}
