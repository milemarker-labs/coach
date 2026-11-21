import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils.ts";

const EASE = [0.16, 1, 0.3, 1] as const;

function formatter(decimals: number, grouping: boolean) {
  const intl = new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping });
  return (value: number) => intl.format(value);
}

/**
 * Counts up to `value` the first time it shows, then glides between values.
 * Writes text directly to the node so a running count never re-renders React.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  grouping = true,
  prefix = "",
  suffix = "",
  duration = 1.2,
  className,
}: {
  value: number;
  decimals?: number;
  grouping?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();
  const format = formatter(decimals, grouping);
  const render = (current: number) => `${prefix}${format(current)}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = render(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (current) => {
        node.textContent = render(current);
      },
    });
    from.current = value;
    return () => controls.stop();
    // `render` is rebuilt each render from the same inputs listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, grouping, prefix, suffix, duration, reduce]);

  return (
    <span ref={ref} className={cn("num", className)}>
      {render(reduce ? value : 0)}
    </span>
  );
}

const NUMERIC = /^([+\-−]?)(\d[\d,]*(?:\.\d+)?)$/;

/**
 * Takes a pre-formatted metric such as `42.6`, `+12`, `1,204` or `4h 12m`.
 * Plain numbers count up; anything else fades in as text.
 */
export function AnimatedValue({ text, className }: { text: string; className?: string }) {
  const match = NUMERIC.exec(text.trim());
  if (!match) return <span className={cn("num animate-fade-in", className)}>{text}</span>;
  const [, sign = "", digits = "0"] = match;
  const decimals = digits.includes(".") ? (digits.split(".")[1]?.length ?? 0) : 0;
  const value = Number(digits.replaceAll(",", ""));
  return <AnimatedNumber value={value} decimals={decimals} grouping={digits.includes(",")} prefix={sign} className={className} />;
}
