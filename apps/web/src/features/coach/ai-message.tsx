import type { AiMessage as AiMessageData } from "@coach/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils.ts";
import { CoachOrb } from "./coach-orb.tsx";
import { parseCoachMarkdown, type Block, type Inline, type ListBlock } from "./markdown.ts";

const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } as const;

export function AIMessage({
  message,
  streaming = false,
  instant = false,
  delay = 0,
}: {
  message: Pick<AiMessageData, "role" | "content" | "sources">;
  streaming?: boolean;
  /** Skip the entrance, e.g. when a streamed reply is swapped for the stored one. */
  instant?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const skip = instant || reduce;

  if (message.role === "user") {
    return (
      <motion.div
        className="flex justify-end"
        initial={skip ? false : { opacity: 0, y: 14, x: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        transition={{ ...SPRING, delay }}
        style={{ transformOrigin: "bottom right" }}
      >
        <p className="max-w-[85%] rounded-2xl rounded-br-md border border-pulse/25 bg-[linear-gradient(135deg,rgb(var(--pulse-rgb)/0.22),rgb(var(--flow-rgb)/0.08))] px-4 py-2.5 text-sm whitespace-pre-wrap text-foreground shadow-[0_8px_30px_-18px_rgb(var(--pulse-rgb)/0.8)] sm:max-w-[70%]">
          {message.content}
        </p>
      </motion.div>
    );
  }

  const blocks = parseCoachMarkdown(message.content);
  return (
    <motion.div
      className="flex gap-3"
      initial={skip ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <CoachOrb size={28} active={streaming} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-3 text-sm leading-6 text-foreground [&_strong]:text-foreground">
          {blocks.length === 0 && streaming ? <Caret /> : <Blocks blocks={blocks} caret={streaming} />}
        </div>
      </div>
    </motion.div>
  );
}

/** Status lines while waiting for the first token. They describe real steps in the context build. */
const thinkingLines = [
  "Reading your last 7 days…",
  "Checking your load and form…",
  "Looking at your recent runs…",
  "Weighing your Marker…",
  "Putting it into words…",
];

export function ThinkingIndicator() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % thinkingLines.length), 1700);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <motion.div
      className="flex items-center gap-3"
      role="status"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <CoachOrb size={28} active />
      <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className="animate-shimmer absolute inset-0 truncate bg-[linear-gradient(90deg,var(--text-muted)_0%,var(--text)_45%,var(--brand-text)_55%,var(--text-muted)_100%)] bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {thinkingLines[index]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="sr-only">Coach is reading your training</span>
    </motion.div>
  );
}

function Blocks({ blocks, caret }: { blocks: Block[]; caret: boolean }) {
  return blocks.map((block, index) => {
    const last = caret && index === blocks.length - 1;
    if (block.kind === "paragraph") {
      return (
        <p key={index}>
          <Inlines nodes={block.children} caret={last} />
        </p>
      );
    }
    return <MessageList key={index} block={block} caret={last} />;
  });
}

function MessageList({ block, caret }: { block: ListBlock; caret: boolean }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag className={cn("space-y-1.5 pl-5", block.ordered ? "list-decimal marker:font-semibold marker:text-primary" : "list-disc marker:text-pulse")}>
      {block.items.map((item, index) => {
        const last = caret && index === block.items.length - 1;
        const nested = item.lists.length > 0;
        return (
          <li key={index} className="pl-1">
            <Inlines nodes={item.children} caret={last && !nested} />
            {nested ? <div className="mt-1">{item.lists.map((list, listIndex) => <MessageList key={listIndex} block={list} caret={last && listIndex === item.lists.length - 1} />)}</div> : null}
          </li>
        );
      })}
    </Tag>
  );
}

function Inlines({ nodes, caret }: { nodes: Inline[]; caret: boolean }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === "text") return node.text;
        if (node.kind === "break") return <br key={index} />;
        if (node.kind === "code") {
          return (
            <code key={index} className="rounded-md bg-surface-2 px-1.5 py-px font-mono text-[0.85em] text-accent-foreground">
              {node.text}
            </code>
          );
        }
        const Tag = node.kind === "strong" ? "strong" : "em";
        return (
          <Tag key={index} className={node.kind === "strong" ? "font-semibold" : undefined}>
            <Inlines nodes={node.children} caret={false} />
          </Tag>
        );
      })}
      {caret ? <Caret /> : null}
    </>
  );
}

function Caret() {
  return <span className="animate-caret ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 rounded-full bg-primary shadow-[0_0_10px_rgb(var(--brand-rgb)/0.4)]" aria-hidden="true" />;
}
