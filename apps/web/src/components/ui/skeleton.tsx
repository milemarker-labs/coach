import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

/** A shimmering placeholder. The sweep reads as "working", not "broken". */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--surface-2)_0%,var(--surface-3)_50%,var(--surface-2)_100%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
