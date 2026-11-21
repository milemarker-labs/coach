import { History } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useSyncJobs } from "@/data/queries.ts";
import { formatInstant } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { jobTitle } from "./job-title.ts";
import { StatusPill } from "./status-pill.tsx";

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
      <CardContent className="mt-3">
        {mode === "demo" ? (
          <EmptyState icon={History} title="No sync history" description="Connect Strava to sync activities. Each sync is listed here." />
        ) : jobs.isLoading ? (
          <ListSkeleton rows={4} />
        ) : jobs.isError ? (
          <EmptyState icon={History} tone="danger" title="Sync history could not be loaded" description="Check that the Coach API is running, then reload." />
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="Nothing synced yet" description="Run a sync or import your history to start the record." />
        ) : (
          <div className="relative pl-5">
            <span className="absolute top-2 bottom-2 left-[5px] w-px bg-border" aria-hidden="true" />
            <Stagger as="ol" className="space-y-1" gap={0.04}>
              {rows.map((job) => (
                <StaggerItem as="li" key={job.id} className="relative">
                  <span
                    className={cn(
                      "absolute top-4 -left-5 size-[11px] rounded-full border-2 border-card",
                      job.status === "completed" ? "bg-success" : job.status === "failed" ? "bg-danger" : job.status === "cancelled" ? "bg-faint" : "bg-flow",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{jobTitle(job)}</p>
                      <p className="text-xs text-muted-foreground">{formatInstant(job.createdAt)}</p>
                      {job.error ? <p className="mt-1 text-xs text-danger">{job.error}</p> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="num text-xs text-muted-foreground">{job.recordsProcessed} activities</span>
                      <StatusPill status={job.status} />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
