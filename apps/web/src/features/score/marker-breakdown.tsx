import { SCORE_DESCRIPTIONS, type ScoreComponent, type ScoreComponentKey } from "@coach/shared";
import { Activity, Gauge, HeartPulse, Repeat, TrendingUp, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { cn } from "@/lib/utils.ts";

export const componentIcons: Record<ScoreComponentKey, LucideIcon> = {
  base: Activity,
  consistency: Repeat,
  balance: Gauge,
  momentum: TrendingUp,
  efficiency: HeartPulse,
};

function tone(value: number): string {
  if (value >= 70) return "from-flow to-primary";
  if (value >= 45) return "from-pulse to-flow";
  return "from-danger/80 to-pulse";
}

/** One bar per reading. Bars fill in sequence after the ring finishes its sweep. */
export function MarkerBreakdown({ components, compact = false, delay = 0.4, className }: { components: ScoreComponent[]; compact?: boolean; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <ul className={cn("space-y-3.5", className)}>
      {components.map((component, index) => {
        const Icon = componentIcons[component.key];
        const value = component.value;
        return (
          <motion.li
            key={component.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduce ? 0 : delay + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium text-foreground">{component.label}</span>
                <span className="text-[11px] text-faint">{Math.round(component.weight * 100)}%</span>
              </span>
              {value == null ? (
                <span className="text-xs text-faint">Not measurable yet</span>
              ) : (
                <AnimatedNumber value={value} className="font-display text-sm font-semibold text-foreground" />
              )}
            </div>
            <div className={cn("mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/70", value == null && "bg-[repeating-linear-gradient(90deg,var(--surface-3)_0_6px,transparent_6px_10px)]")}>
              {value != null ? (
                <motion.div
                  className={cn("h-full rounded-full bg-gradient-to-r", tone(value))}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.max(value, 3)}%` }}
                  transition={{ delay: reduce ? 0 : delay + 0.15 + index * 0.08, duration: reduce ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
                />
              ) : null}
            </div>
            {compact ? null : <p className="mt-1 text-xs text-muted-foreground">{component.detail}. <span className="text-faint">{SCORE_DESCRIPTIONS[component.key]}</span></p>}
          </motion.li>
        );
      })}
    </ul>
  );
}
