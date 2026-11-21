import type { SyncJob } from "@coach/shared";
import { cn } from "@/lib/utils.ts";

const meta: Record<SyncJob["status"], { label: string; className: string; dot: string; live: boolean }> = {
  pending: { label: "Waiting", className: "bg-warning/12 text-warning ring-warning/25", dot: "bg-warning", live: true },
  running: { label: "Running", className: "bg-flow/10 text-flow ring-flow/25", dot: "bg-flow", live: true },
  completed: { label: "Completed", className: "bg-success/12 text-success ring-success/25", dot: "bg-success", live: false },
  failed: { label: "Failed", className: "bg-danger/12 text-danger ring-danger/25", dot: "bg-danger", live: false },
  cancelled: { label: "Cancelled", className: "bg-surface-2 text-muted-foreground ring-border", dot: "bg-faint", live: false },
};

/** Job status with a dot that pulses while the job is still moving. */
export function StatusPill({ status, className }: { status: SyncJob["status"]; className?: string }) {
  const item = meta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", item.className, className)}>
      <span className="relative flex size-1.5" aria-hidden="true">
        {item.live ? <span className={cn("absolute inset-0 animate-ping-soft rounded-full", item.dot)} /> : null}
        <span className={cn("relative size-1.5 rounded-full", item.dot)} />
      </span>
      {item.label}
    </span>
  );
}
