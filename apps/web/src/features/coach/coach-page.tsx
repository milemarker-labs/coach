import { MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AIChatInput } from "./ai-chat-input.tsx";
import { AIMessage } from "./ai-message.tsx";
import { ModelSelector } from "./model-selector.tsx";
import { suggestedQuestions } from "./suggestions.ts";
import { useCoachChat } from "./use-chat.ts";

export function CoachPage() {
  const chat = useCoachChat();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const handedOff = useRef(false);

  // A question asked from the dashboard arrives as router state and is sent once the model is ready.
  const handoff = (location.state as { prompt?: string } | null)?.prompt;
  useEffect(() => {
    if (!handoff || handedOff.current || !chat.ready) return;
    handedOff.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void chat.send(handoff);
  }, [handoff, chat, location.pathname, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat.messages.length, chat.pending]);

  const inputDisabled = !chat.connected || !chat.ready;
  const blocker = !chat.connected
    ? "Connect Strava to chat about your training."
    : chat.status && !chat.status.reachable
      ? (chat.status.error ?? "The local model is not reachable.")
      : null;

  function submit() {
    const text = draft;
    setDraft("");
    void chat.send(text);
  }

  const empty = chat.messages.length === 0 && !chat.pending && !chat.loadingHistory;

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6 lg:min-h-[calc(100dvh-4rem)]">
      <PageHeader
        title="Chat Coach"
        description="Answers use the activities stored in Coach. Numbers come from your data; the wording comes from a model."
        actions={<ModelSelector models={chat.status?.models ?? []} value={chat.status?.model ?? null} reachable={chat.status?.reachable ?? false} loading={chat.statusLoading} />}
      />
      <DemoBanner />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex-1 space-y-6 pb-6" aria-live="polite">
          {chat.loadingHistory ? (
            <div className="space-y-4" role="status" aria-label="Loading conversation">
              <Skeleton className="ml-auto h-10 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : null}
          {empty ? (
            <EmptyState
              icon={Sparkles}
              title="Ask Coach about your training"
              description={blocker ?? "Pick a question to start, or write your own below."}
              action={
                <ul className="mt-1 flex max-w-xl flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        disabled={inputDisabled}
                        onClick={() => void chat.send(question)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-titanium transition-colors hover:border-border-hover hover:text-platinum active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              }
              className="py-16"
            />
          ) : null}
          {chat.messages.map((message) => (
            <AIMessage key={message.id} message={message} />
          ))}
          {chat.sending && !chat.pending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
              <MessageSquare className="size-3.5 animate-pulse" aria-hidden="true" />
              Coach is reading your training
            </div>
          ) : null}
          {chat.pending ? <AIMessage message={{ role: "assistant", content: chat.pending, sources: [] }} streaming /> : null}
          {chat.error ? <p className="text-sm text-danger" role="alert">{chat.error}</p> : null}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-14 -mx-4 border-t border-border bg-background px-4 py-3 md:bottom-0 md:-mx-6 md:px-6 lg:mx-0 lg:border-0 lg:px-0 lg:pb-0">
          <AIChatInput id="coach-message" value={draft} onChange={setDraft} onSubmit={submit} disabled={inputDisabled} sending={chat.sending} placeholder={blocker ?? undefined} />
          {blocker && !empty ? <p className="mt-2 text-xs text-muted-foreground">{blocker}</p> : null}
        </div>
      </div>
    </div>
  );
}
