import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils.ts";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Compact single-choice toggle. The active pill glides between options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full border border-border bg-input p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn("relative rounded-full px-3 py-1 text-xs font-semibold transition-colors", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {active ? (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-brand-gradient" transition={{ type: "spring", stiffness: 500, damping: 38 }} aria-hidden="true" />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
