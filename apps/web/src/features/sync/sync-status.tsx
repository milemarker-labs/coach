import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useSyncStatus } from "@/data/queries.ts";
import { formatInstant } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { useSyncNow, type SyncPhase } from "./use-sync-now.ts";

const labels: Record<SyncPhase, string> = {
  idle: "Sync now",
  syncing: "Syncing",
  success: "Synced",
  error: "Retry sync",
};

/** Sync button with its own feedback: loading, success and failure, plus the last sync time. */
export function SyncStatus({ className }: { className?: string }) {
  const { mode } = useDataMode();
  const status = useSyncStatus();
  const sync = useSyncNow();
  const busy = sync.phase === "syncing";
  const Icon = sync.phase === "success" ? Check : sync.phase === "error" ? AlertTriangle : RefreshCw;

  const detail =
    sync.message ??
    (mode === "demo"
      ? "Demo data, not synced"
      : status.data?.lastSyncedAt
        ? `Last sync: ${formatInstant(status.data.lastSyncedAt)}`
        : status.isLoading
          ? "Checking last sync"
          : "Never synced");

  return (
    <div className={cn("flex flex-col gap-1.5 sm:items-end", className)}>
      <Button
        variant={sync.phase === "idle" || busy ? "default" : "outline"}
        onClick={sync.start}
        disabled={busy || sync.blockedReason != null}
        title={sync.blockedReason ?? undefined}
        className={cn("min-w-32", sync.phase === "success" && "border-success/40 text-success", sync.phase === "error" && "border-danger/40 text-danger")}
      >
        {busy ? <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%]" aria-hidden="true" /> : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={sync.phase}
            className="relative flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Icon className={cn("size-4", busy && "animate-spin")} aria-hidden="true" />
            {labels[sync.phase]}
          </motion.span>
        </AnimatePresence>
      </Button>
      <p
        className={cn("text-xs", sync.phase === "error" ? "text-danger" : sync.phase === "success" ? "text-success" : "text-muted-foreground")}
        role="status"
        aria-live="polite"
      >
        {detail}
      </p>
    </div>
  );
}
