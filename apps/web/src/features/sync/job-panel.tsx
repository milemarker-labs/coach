import type { SyncJob } from "@coach/shared";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, type BadgeTone } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";

const statusTone: Record<SyncJob["status"], BadgeTone> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

export function JobPanel({ job, error }: { job: SyncJob; error: string | null }) {
  const queryClient = useQueryClient();
  const active = job.status === "pending" || job.status === "running";

  async function cancel() {
    const next = await api.cancelJob(job.id);
    queryClient.setQueryData(["job", next.id], next);
    void queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    void queryClient.invalidateQueries({ queryKey: ["sync-jobs"] });
  }

  async function resume() {
    const next = await api.continueJob(job.id);
    queryClient.setQueryData(["job", next.id], next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job.jobType === "historical" ? "Historical import" : "Recent sync"}</CardTitle>
        <Badge tone={statusTone[job.status]}>{job.status}</Badge>
      </CardHeader>
      <CardContent className="mt-3 space-y-3">
        <p className="num text-sm text-muted-foreground">
          Page {job.page} · {job.recordsProcessed} activities saved
        </p>
        {job.status === "pending" && job.retryAfter ? (
          <p className="text-sm text-warning">Waiting for Strava until {formatInstant(job.retryAfter)}.</p>
        ) : null}
        {job.error ? <p className="text-sm text-danger">{job.error}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          {job.status === "failed" ? <Button onClick={() => void resume()}>Resume</Button> : null}
          {active ? (
            <Button variant="outline" onClick={() => void cancel()}>
              Cancel
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
