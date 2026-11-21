import { ArrowUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";

const MAX_LENGTH = 4000;
/** The counter appears once a message is this close to the limit. */
const COUNTER_FROM = MAX_LENGTH * 0.8;

/**
 * Floating glass composer. Enter sends, Shift+Enter adds a line. Grows with its content up to a limit.
 * A spectrum ring lights up on focus; the send button morphs into a spinner while Coach answers.
 */
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
  const showCounter = value.length >= COUNTER_FROM;

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
    <form onSubmit={submit} className={cn("group/composer relative", className)}>
      {/* Spectrum bloom and hairline, visible while the composer has focus */}
      <span
        className="pointer-events-none absolute -inset-1 rounded-[1.25rem] bg-spectrum opacity-0 blur-xl transition-opacity duration-500 group-focus-within/composer:opacity-25"
        aria-hidden="true"
      />
      <div
        className={cn(
          "glass relative flex items-end gap-2 rounded-2xl border border-border p-2 shadow-[0_12px_40px_-16px_rgb(var(--shade-rgb)/calc(0.8*var(--shade-alpha)))] transition-colors hover:border-border-hover",
          disabled && "opacity-70",
        )}
      >
        <span
          className="ring-spectrum pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-focus-within/composer:opacity-100"
          aria-hidden="true"
        />
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
          aria-describedby={id && !compact ? `${id}-hint` : undefined}
          className="relative max-h-52 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-faint disabled:cursor-not-allowed"
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          aria-label={sending ? "Coach is answering" : "Send message"}
          whileTap={canSend ? { scale: 0.88 } : undefined}
          whileHover={canSend ? { scale: 1.06 } : undefined}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-[background-color,box-shadow,color] duration-300",
            canSend || sending
              ? "bg-brand-gradient text-primary-foreground shadow-[0_6px_22px_-8px_rgb(var(--brand-rgb)/0.35)]"
              : "cursor-not-allowed bg-surface-2 text-faint",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {sending ? (
              <motion.span key="sending" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              </motion.span>
            ) : (
              <motion.span key="send" initial={{ y: 8, opacity: 0, rotate: -30 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -10, opacity: 0 }} transition={{ type: "spring", stiffness: 520, damping: 24 }}>
                <ArrowUp className="size-4" strokeWidth={2.6} aria-hidden="true" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {compact ? null : (
        <div id={id ? `${id}-hint` : undefined} className="mt-1.5 flex items-center justify-between gap-3 px-2 text-[11px] text-faint">
          <span className="hidden sm:inline">
            <kbd className="rounded border border-border bg-surface-2 px-1 font-sans text-[10px]">Enter</kbd> to send ·{" "}
            <kbd className="rounded border border-border bg-surface-2 px-1 font-sans text-[10px]">Shift</kbd>+
            <kbd className="rounded border border-border bg-surface-2 px-1 font-sans text-[10px]">Enter</kbd> for a new line
          </span>
          <AnimatePresence>
            {showCounter ? (
              <motion.span
                key="counter"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={cn("num ml-auto", value.length >= MAX_LENGTH ? "text-danger" : "text-warning")}
                aria-live="polite"
              >
                {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </form>
  );
}
