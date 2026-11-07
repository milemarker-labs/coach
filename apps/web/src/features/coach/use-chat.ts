import type { AiConversation, AiMessage } from "@coach/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useDataMode } from "@/data/mode.ts";
import { ApiError, api } from "@/lib/api.ts";

type ConversationCache = { conversation: AiConversation | null };

/** Latest conversation plus a `send` that streams the reply into `pending` as it arrives. */
export function useCoachChat() {
  const queryClient = useQueryClient();
  const { mode } = useDataMode();
  const connected = mode === "live";
  const status = useQuery({ queryKey: ["ai-status"], queryFn: api.aiStatus, enabled: connected });
  const latest = useQuery({ queryKey: ["ai-conversation"], queryFn: api.latestConversation, enabled: connected });
  const [pending, setPending] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversation = latest.data?.conversation ?? null;

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending) return;
      setError(null);
      setSending(true);
      setPending("");
      const optimistic: AiMessage = { id: "pending-user", role: "user", content: message, sources: [], createdAt: new Date().toISOString() };
      queryClient.setQueryData(["ai-conversation"], (current: ConversationCache | undefined): ConversationCache => ({
        conversation: {
          id: current?.conversation?.id ?? "pending",
          title: current?.conversation?.title ?? message.slice(0, 80),
          updatedAt: new Date().toISOString(),
          messages: [...(current?.conversation?.messages ?? []), optimistic],
        },
      }));
      try {
        await api.chat(
          { message, ...(conversation?.id && conversation.id !== "pending" ? { conversationId: conversation.id } : {}) },
          {
            onMeta: (meta) => {
              queryClient.setQueryData(["ai-conversation"], (current: ConversationCache | undefined): ConversationCache => ({
                conversation: {
                  id: meta.conversationId,
                  title: current?.conversation?.title ?? message.slice(0, 80),
                  updatedAt: new Date().toISOString(),
                  messages: current?.conversation?.messages ?? [optimistic],
                },
              }));
            },
            onDelta: (delta) => setPending((value) => value + delta),
          },
        );
        await queryClient.invalidateQueries({ queryKey: ["ai-conversation"] });
        setPending("");
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "The model did not answer.");
        setPending("");
      } finally {
        setSending(false);
      }
    },
    [conversation, queryClient, sending],
  );

  return {
    connected,
    ready: connected && status.data?.reachable === true,
    status: status.data ?? null,
    statusLoading: connected && status.isLoading,
    messages: conversation?.messages ?? [],
    loadingHistory: connected && latest.isLoading,
    pending,
    sending,
    error,
    send,
  };
}
