import type { SyncJob } from "@coach/shared";
import { History } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { Badge, type BadgeTone } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useSyncJobs } from "@/data/queries.ts";
import { formatInstant } from "@/lib/format.ts";

const statusTone: Record<SyncJob["status"], BadgeTone> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

export function SyncHistory() {
  const { mode } = useDataMode();
  const jobs = useSyncJobs();
  const rows = jobs.data?.jobs ?? [];
  return (
    <Card>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle>Sync history</CardTitle>
          <CardDescription>The 20 most recent syncs and imports</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-2">
        {mode === "demo" ? (
          <EmptyState icon={History} title="No sync history" description="Connect Strava to sync activities. Each sync is listed here." />
        ) : jobs.isLoading ? (
          <ListSkeleton rows={4} />
        ) : jobs.isError ? (
          <EmptyState icon={History} tone="danger" title="Sync history could not be loaded" description="Check that the Coach API is running, then reload." />
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="Nothing synced yet" description="Run a sync or import your history to start the record." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{job.jobType === "historical" ? "Historical import" : "Recent sync"}</p>
                  <p className="text-xs text-muted-foreground">{formatInstant(job.createdAt)}</p>
                  {job.error ? <p className="mt-1 text-xs text-danger">{job.error}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-xs text-muted-foreground">{job.recordsProcessed} activities</span>
                  <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
