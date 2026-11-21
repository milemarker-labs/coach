import type { MarkerScore } from "@coach/shared";
import { AlertTriangle, Compass, Gauge, MessageCircleQuestion, Sparkles, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useMarker } from "@/features/score/use-marker.ts";
import { cn } from "@/lib/utils.ts";
import { AIChatInput } from "./ai-chat-input.tsx";
import { AIMessage, ThinkingIndicator } from "./ai-message.tsx";
import { CoachOrb } from "./coach-orb.tsx";
import { ModelSelector } from "./model-selector.tsx";
import { smartSuggestions, type SuggestionKind } from "./suggestions.ts";
import { useCoachChat } from "./use-chat.ts";

const EASE = [0.16, 1, 0.3, 1] as const;

function greeting(now = new Date()): string {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/** True when the thread is scrolled to (or near) the bottom, so streaming never yanks a reader back down. */
function nearBottom(node: HTMLElement | null): boolean {
  if (!node) return true;
  return node.scrollTop + node.clientHeight >= node.scrollHeight - 240;
}

function scrollToEnd(node: HTMLElement | null, behavior: ScrollBehavior) {
  node?.scrollTo({ top: node.scrollHeight, behavior });
}

export function CoachPage() {
  const chat = useCoachChat();
  const { marker } = useMarker();
  const { auth } = useDataMode();
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const handedOff = useRef(false);
  const [streamedOnce, setStreamedOnce] = useState(false);

  // A question asked from the dashboard arrives as router state and is sent once the model is ready.
  const handoff = (location.state as { prompt?: string } | null)?.prompt;
  useEffect(() => {
    if (!handoff || handedOff.current || !chat.ready) return;
    handedOff.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void chat.send(handoff);
  }, [handoff, chat, location.pathname, navigate]);

  // Once a reply has streamed, the stored copy that replaces it should appear without an entrance.
  if (chat.pending && !streamedOnce) setStreamedOnce(true);

  // New messages glide into view; streamed text follows without smooth-scroll jitter.
  // The empty state stays at the top. A loaded conversation opens at its end; new turns glide in.
  const hasThread = chat.messages.length > 0 || chat.sending;
  const settled = useRef(false);
  useEffect(() => {
    if (!hasThread) return;
    scrollToEnd(threadRef.current, settled.current ? "smooth" : "auto");
    settled.current = true;
  }, [hasThread, chat.messages.length, chat.sending]);
  useEffect(() => {
    if (chat.pending && nearBottom(threadRef.current)) scrollToEnd(threadRef.current, "auto");
  }, [chat.pending]);

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

  const empty = chat.messages.length === 0 && !chat.pending && !chat.loadingHistory && !chat.sending;
  const working = chat.sending || Boolean(chat.pending);
  const lastIndex = chat.messages.length - 1;
  const firstName = auth?.displayName?.trim().split(" ")[0];

  const header = (
    <PageHeader
      eyebrow="Ask anything"
      title={
        <span className="flex items-center gap-3">
          <CoachOrb size={34} active={working} />
          Chat Coach
        </span>
      }
      description={<span className="hidden sm:inline">Answers use the activities stored in Coach. Numbers come from your data; the wording comes from a model.</span>}
      actions={<ModelSelector models={chat.status?.models ?? []} value={chat.status?.model ?? null} reachable={chat.status?.reachable ?? false} loading={chat.statusLoading} />}
    />
  );

  return (
    // Fills the frame the shell gives this route. Only the thread scrolls; the page never does.
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-5">
      {/* On phones the top bar already says Coach; once a chat is going, the thread gets that room. */}
      <div className={cn("shrink-0", !empty && "max-sm:hidden")}>{header}</div>
      <DemoBanner />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={threadRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)]">
        <div className="mx-auto w-full max-w-3xl space-y-7 py-4" aria-live="polite">
          {chat.loadingHistory ? (
            <div className="space-y-4" role="status" aria-label="Loading conversation">
              <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : null}

          <AnimatePresence>
            {empty ? (
              <Welcome
                key="welcome"
                marker={marker}
                name={firstName}
                blocker={blocker}
                disabled={inputDisabled}
                onAsk={(text) => void chat.send(text)}
              />
            ) : null}
          </AnimatePresence>

          {chat.messages.map((message, index) => (
            <AIMessage
              // Messages only ever append, so the index is a stable key. It also keeps the
              // optimistic question from re-animating when the stored copy replaces it.
              key={`${index}-${message.role}`}
              message={message}
              instant={streamedOnce && message.role === "assistant" && index === lastIndex}
              delay={streamedOnce ? 0 : Math.min(index, 8) * 0.05}
            />
          ))}

          <AnimatePresence>{chat.sending && !chat.pending ? <ThinkingIndicator key="thinking" /> : null}</AnimatePresence>
          {chat.pending ? <AIMessage message={{ role: "assistant", content: chat.pending, sources: [] }} streaming /> : null}

          <AnimatePresence>
            {chat.error ? (
              <motion.p
                key="error"
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {chat.error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        </div>

        <div className="mx-auto w-full max-w-3xl shrink-0 pt-2 pb-1">
          <AIChatInput id="coach-message" value={draft} onChange={setDraft} onSubmit={submit} disabled={inputDisabled} sending={chat.sending} placeholder={blocker ? (chat.connected ? "Coach is offline right now" : "Connect Strava to chat") : undefined} />
          {blocker && !empty ? <p className="mt-2 px-2 text-xs text-muted-foreground">{blocker}</p> : null}
        </div>
      </div>
    </div>
  );
}

const chipIcons: Record<SuggestionKind, LucideIcon> = {
  call: Compass,
  direction: Sparkles,
  score: Gauge,
  general: MessageCircleQuestion,
};

const chipTones: Record<SuggestionKind, string> = {
  call: "text-primary bg-primary-subtle",
  direction: "text-pulse bg-pulse-subtle",
  score: "text-flow bg-flow/10",
  general: "text-muted-foreground bg-surface-3",
};

function Welcome({
  marker,
  name,
  blocker,
  disabled,
  onAsk,
}: {
  marker: MarkerScore | null;
  name: string | undefined;
  blocker: string | null;
  disabled: boolean;
  onAsk: (text: string) => void;
}) {
  const reduce = useReducedMotion();
  const suggestions = smartSuggestions(marker);

  return (
    <motion.section
      aria-label="Start a conversation"
      className="relative flex flex-col items-center px-2 pt-6 pb-4 text-center sm:pt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16, filter: "blur(8px)", transition: { duration: 0.35 } }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-dots opacity-50 mask-radial" aria-hidden="true" />
      <motion.div
        className="relative"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
      >
        {/* Smaller on phones so the suggestions stay above the fold. */}
        <div className="-my-5 scale-[0.68] sm:my-0 sm:scale-100">
          <div className="animate-float">
            <CoachOrb size={152} />
          </div>
        </div>
      </motion.div>

      <motion.h2
        className="relative mt-6 text-[26px] sm:mt-12 leading-tight font-semibold tracking-tight sm:text-[32px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
      >
        {greeting()}
        {name ? `, ${name}` : ""}. <span className="text-brand-gradient">What are we working on?</span>
      </motion.h2>

      {marker ? (
        <motion.p
          className="relative mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.6, ease: EASE }}
        >
          Your {marker.name} is{" "}
          <span className="font-display font-semibold text-foreground">
            <AnimatedNumber value={marker.value} />
          </span>{" "}
          · <span className="font-medium text-spectrum">{marker.band.label}</span>. Today&apos;s call: <span className="font-medium text-foreground">{marker.call.title}</span>.
        </motion.p>
      ) : null}

      <motion.p
        className={cn("relative mt-2 text-xs", blocker ? "text-warning" : "text-faint")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {blocker ?? "Pick a question shaped by your numbers, or write your own below."}
      </motion.p>

      <motion.ul
        className="relative mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } } }}
      >
        {suggestions.map((suggestion) => {
          const Icon = chipIcons[suggestion.kind];
          return (
            <motion.li
              key={suggestion.text}
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 340, damping: 26 } },
              }}
            >
              <motion.button
                type="button"
                disabled={disabled}
                onClick={() => onAsk(suggestion.text)}
                whileHover={disabled ? undefined : { y: -3 }}
                whileTap={disabled ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="group flex h-full w-full items-start gap-3 rounded-2xl border border-border bg-card/70 p-3 text-left text-sm text-muted-foreground transition-[border-color,color,box-shadow] hover:border-border-hover hover:text-foreground hover:shadow-[0_14px_36px_-20px_rgb(var(--pulse-rgb)/0.7)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-110 group-hover:-rotate-6", chipTones[suggestion.kind])} aria-hidden="true">
                  <Icon className="size-3.5" />
                </span>
                <span className="pt-1 leading-snug">{suggestion.text}</span>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.section>
  );
}
