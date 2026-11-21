import { cn } from "@/lib/utils.ts";

/** Gradient bar for progress against a real target. `value` is 0 to 1. Grows in on mount. */
export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3/70", className)}
    >
      <div
        className="h-full origin-left animate-[coach-grow_900ms_var(--ease-out-expo)_both] rounded-full bg-gradient-to-r from-pulse via-flow to-primary transition-[width] duration-700"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
