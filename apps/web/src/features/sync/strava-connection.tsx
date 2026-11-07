import { Zap } from "lucide-react";
import { useDataMode } from "@/data/mode.ts";
import { useSyncStatus } from "@/data/queries.ts";
import { formatRelative } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";

/** Compact Strava connection indicator for the bottom of the sidebar. */
export function StravaConnection({ className }: { className?: string }) {
  const { mode, auth } = useDataMode();
  const status = useSyncStatus();
  const connected = mode === "live";
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-strava text-white" aria-hidden="true">
        <Zap className="size-4 fill-current" />
      </span>
      <div className="min-w-0 text-xs">
        <p className="truncate font-medium text-foreground">Strava{auth?.displayName ? ` · ${auth.displayName}` : ""}</p>
        <p className={cn("flex items-center gap-1.5", connected ? "text-success" : "text-muted-foreground")}>
          <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-faint")} aria-hidden="true" />
          {mode === "loading" ? "Checking" : connected ? "Connected" : "Not connected"}
        </p>
        {connected ? <p className="truncate text-muted-foreground">Synced {formatRelative(status.data?.lastSyncedAt ?? null)}</p> : null}
      </div>
    </div>
  );
}
