import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";

const MAX_LENGTH = 4000;

/** Message box. Enter sends, Shift+Enter adds a line. Grows with its content up to a limit. */
export function AIChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  sending = false,
  placeholder = "Ask about your training, recovery, or next workout",
  compact = false,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !sending && value.trim().length > 0;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, compact ? 96 : 200)}px`;
  }, [value, compact]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canSend) onSubmit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex items-end gap-2 rounded-xl border border-border bg-input p-2 transition-colors focus-within:border-primary/60 hover:border-border-hover",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Message Coach
      </label>
      <textarea
        id={id}
        ref={ref}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          "max-h-52 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-platinum outline-none placeholder:text-faint disabled:opacity-50",
        )}
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label={sending ? "Coach is answering" : "Send message"}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary bg-metal-bronze text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:bg-none disabled:text-faint disabled:hover:brightness-100"
      >
        {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />}
      </button>
    </form>
  );
}
