import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

/**
 * Row of metric cards. On phones it scrolls sideways with snap points so every card keeps
 * a readable size; from tablet width it becomes a grid.
 */
export function MetricGroup({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0",
        "[&>*]:min-w-[10.5rem] [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
