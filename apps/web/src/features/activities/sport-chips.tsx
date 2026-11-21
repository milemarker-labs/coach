import { sportLabel } from "@coach/shared";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils.ts";
import { sportIcon, sportTheme } from "./activity-meta.tsx";

export interface SportChipOption {
  sport: string;
  count: number;
}

/**
 * Horizontally scrolling sport filter. The active pill glides between chips.
 * `value` is "" (or `allValue`) for every sport.
 */
export function SportChips({
  options,
  value,
  onChange,
  allValue = "",
  allCount,
  label = "Sport",
  className,
}: {
  options: SportChipOption[];
  value: string;
  onChange: (sport: string) => void;
  allValue?: string;
  allCount?: number;
  label?: string;
  className?: string;
}) {
  const layoutId = useId();
  const total = allCount ?? options.reduce((sum, option) => sum + option.count, 0);
  const chips = [{ sport: allValue, count: total }, ...options];

  return (
    <div role="radiogroup" aria-label={label} className={cn("scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0", className)}>
      {chips.map((chip) => {
        const all = chip.sport === allValue;
        const active = chip.sport === value;
        const Icon = all ? null : sportIcon(chip.sport);
        const theme = all ? null : sportTheme(chip.sport);
        return (
          <button
            key={chip.sport || "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(chip.sport)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[color,border-color,transform] duration-200 active:scale-95",
              active ? "border-transparent text-primary-foreground" : "border-border bg-card/60 text-muted-foreground hover:border-border-hover hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-brand-gradient shadow-[0_6px_20px_-8px_rgb(var(--brand-rgb)/0.35)]"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
                aria-hidden="true"
              />
            ) : null}
            {Icon ? <Icon className="relative size-3.5" style={active ? undefined : { color: theme?.color }} aria-hidden="true" /> : null}
            <span className="relative">{all ? "All sports" : sportLabel(chip.sport)}</span>
            <span className={cn("num relative rounded-full px-1.5 text-[10px]", active ? "bg-black/15" : "bg-surface-2 text-faint")}>{chip.count}</span>
          </button>
        );
      })}
    </div>
  );
}
