import { sportLabel, type AiMessage as AiMessageData } from "@coach/shared";
import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { parseCoachMarkdown, type Block, type Inline, type ListBlock } from "./markdown.ts";

export function AIMessage({ message, streaming = false }: { message: Pick<AiMessageData, "role" | "content" | "sources">; streaming?: boolean }) {
  if (message.role === "user") {
    return (
      <div className="animate-fade-in flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-sm whitespace-pre-wrap text-platinum sm:max-w-[70%]">{message.content}</p>
      </div>
    );
  }
  const blocks = parseCoachMarkdown(message.content);
  return (
    <div className="animate-fade-in flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary-subtle text-primary" aria-hidden="true">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-3 text-sm leading-6 text-platinum">
          {blocks.length === 0 && streaming ? <Caret /> : <Blocks blocks={blocks} caret={streaming} />}
        </div>
        {message.sources.length > 0 && !streaming ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Based on</p>
            <ul className="flex flex-wrap gap-1.5">
              {message.sources.slice(0, 6).map((source) => (
                <li key={source.id}>
                  <Link
                    to={`/activities/${source.id}`}
                    className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border-hover hover:text-platinum")}
                  >
                    <span className="truncate">{source.name}</span>
                    <span className="shrink-0 text-faint">
                      · {sportLabel(source.sport)} · {sourceWhen(source.startedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
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
    <Tag className={cn("space-y-1 pl-5 marker:text-faint", block.ordered ? "list-decimal" : "list-disc")}>
      {block.items.map((item, index) => {
        const last = caret && index === block.items.length - 1;
        const nested = item.lists.length > 0;
        return (
          <li key={index}>
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
            <code key={index} className="rounded bg-surface-2 px-1 py-px font-mono text-[0.85em] text-titanium">
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
  return <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary" aria-hidden="true" />;
}

function sourceWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${day}, ${time} IST`;
}
