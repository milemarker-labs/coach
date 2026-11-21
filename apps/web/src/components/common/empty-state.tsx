import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

/** Used for empty, unavailable and failed states, so missing data never looks like zero. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-in flex flex-col items-center justify-center gap-3 px-6 py-10 text-center", className)}>
      <div className="relative">
        <div className={cn("absolute inset-0 rounded-2xl blur-xl", tone === "danger" ? "bg-danger/25" : "bg-pulse/20")} aria-hidden="true" />
        <div
          className={cn(
            "relative flex size-12 animate-float items-center justify-center rounded-2xl ring-1 ring-inset",
            tone === "danger" ? "bg-danger/12 text-danger ring-danger/25" : "bg-surface-2 text-muted-foreground ring-border",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">{title}</p>
        {description ? <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
