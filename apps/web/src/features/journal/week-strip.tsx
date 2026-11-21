import { motion, useReducedMotion } from "motion/react";
import { formatHoursMinutes } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { formatJournalDay, journalTotals, type JournalDay } from "./days.ts";

/**
 * Seven columns, oldest on the left. Bar height is time on the move; rest days keep
 * their column with a quiet dot, so a rest never disappears from the week.
 */
export function WeekStrip({ days, height = 96, className }: { days: JournalDay[]; height?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ordered = [...days].reverse();
  const minutes = ordered.map((day) => journalTotals(day.activities).movingTime / 60);
  const max = Math.max(30, ...minutes);

  return (
    <ol className={cn("grid grid-cols-7 gap-1.5 sm:gap-2", className)} aria-label="Time on the move each day">
      {ordered.map((day, index) => {
        const value = minutes[index] ?? 0;
        const rest = day.activities.length === 0;
        const label = formatJournalDay(day.date);
        const today = index === ordered.length - 1;
        return (
          <li key={day.date} className="flex flex-col items-center gap-2">
            <div className="relative flex w-full items-end justify-center" style={{ height }}>
              {rest ? (
                <motion.span
                  className="mb-1 size-1.5 rounded-full bg-faint"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reduce ? 0 : 0.2 + index * 0.06 }}
                  aria-hidden="true"
                />
              ) : (
                <motion.span
                  className={cn("w-full max-w-9 origin-bottom rounded-lg bg-gradient-to-t", today ? "from-flow to-primary" : "from-pulse/70 to-flow/80")}
                  style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: reduce ? 0 : 0.15 + index * 0.07, duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                />
              )}
            </div>
            <span className={cn("text-[11px] font-medium", today ? "text-primary" : "text-muted-foreground")}>{label.weekday.slice(0, 3)}</span>
            <span className="sr-only">
              {label.weekday} {label.date}: {rest ? "rest" : `${day.activities.length} session${day.activities.length === 1 ? "" : "s"}, ${formatHoursMinutes(value * 60)}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
