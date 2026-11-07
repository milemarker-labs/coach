import { sportLabel, type AiMessage as AiMessageData } from "@coach/shared";
import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function AIMessage({ message, streaming = false }: { message: Pick<AiMessageData, "role" | "content" | "sources">; streaming?: boolean }) {
  if (message.role === "user") {
    return (
      <div className="animate-fade-in flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-sm whitespace-pre-wrap text-platinum sm:max-w-[70%]">{message.content}</p>
      </div>
    );
  }
  return (
    <div className="animate-fade-in flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary-subtle text-primary" aria-hidden="true">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm leading-6 whitespace-pre-wrap text-platinum">
          {message.content}
          {streaming ? <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary" aria-hidden="true" /> : null}
        </p>
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
                      · {sportLabel(source.sport)} · {source.startedAt.slice(0, 10)}
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
