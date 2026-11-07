import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type DeltaTone = "positive" | "negative" | "neutral";

export interface DeltaValue {
  /** Text shown next to the arrow, e.g. `+12%` or `+5`. */
  text: string;
  direction: "up" | "down" | "flat";
  /** Colors the delta. Not every increase is good news: more fatigue is not green. */
  tone: DeltaTone;
}

const toneClass: Record<DeltaTone, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted-foreground",
};

export function Delta({ delta, className }: { delta: DeltaValue; className?: string }) {
  const Icon = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 text-xs font-medium", toneClass[delta.tone], className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {delta.text}
    </span>
  );
}

/** Builds a delta from a signed number. `goodWhen` says which direction counts as positive. */
export function makeDelta(value: number, options: { suffix?: string; goodWhen?: "up" | "down" | "none"; decimals?: number } = {}): DeltaValue {
  const { suffix = "", goodWhen = "up", decimals = 0 } = options;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  if (rounded === 0) return { text: `0${suffix}`, direction: "flat", tone: "neutral" };
  const direction = rounded > 0 ? "up" : "down";
  const tone: DeltaTone = goodWhen === "none" ? "neutral" : direction === goodWhen ? "positive" : "negative";
  return { text: `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(decimals)}${suffix}`, direction, tone };
}
