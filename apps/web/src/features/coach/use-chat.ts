import type { AiConversation, AiMessage } from "@coach/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataMode } from "@/data/mode.ts";
import { ApiError, api } from "@/lib/api.ts";

type ConversationCache = { conversation: AiConversation | null };

const REVEAL_TICK_MS = 16;

/** Characters to show on this tick. Small backlogs type out slowly, large ones catch up fast. */
function revealStep(remaining: number): number {
  return Math.max(2, Math.ceil(remaining / 50));
}

/** Latest conversation plus a `send` that types the reply into `pending` as it arrives. */
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
  // The reply can arrive in one piece. Text lands in `received` and is revealed from there.
  const received = useRef("");
  const shown = useRef(0);
  const ticker = useRef<number | null>(null);

  const stopReveal = useCallback(() => {
    if (ticker.current !== null) window.clearInterval(ticker.current);
    ticker.current = null;
  }, []);

  const startReveal = useCallback(() => {
    received.current = "";
    shown.current = 0;
    stopReveal();
    ticker.current = window.setInterval(() => {
      const remaining = received.current.length - shown.current;
      if (remaining <= 0) return;
      shown.current += revealStep(remaining);
      setPending(received.current.slice(0, shown.current));
    }, REVEAL_TICK_MS);
  }, [stopReveal]);

  const finishReveal = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const check = () => (shown.current >= received.current.length ? resolve() : window.setTimeout(check, REVEAL_TICK_MS));
        check();
      }),
    [],
  );

  useEffect(() => stopReveal, [stopReveal]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending) return;
      setError(null);
      setSending(true);
      setPending("");
      startReveal();
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
            onDelta: (delta) => {
              received.current += delta;
            },
          },
        );
        await finishReveal();
        await queryClient.invalidateQueries({ queryKey: ["ai-conversation"] });
        setPending("");
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "The model did not answer.");
        setPending("");
      } finally {
        stopReveal();
        setSending(false);
      }
    },
    [conversation, finishReveal, queryClient, sending, startReveal, stopReveal],
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
