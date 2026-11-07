import type { SyncJob } from "@coach/shared";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";
import { useQueryClient } from "@tanstack/react-query";

export function JobPanel({ job, error }: { job: SyncJob; error: string | null }) {
  const queryClient = useQueryClient();
  const active = job.status === "pending" || job.status === "running";

  async function cancel() {
    const next = await api.cancelJob(job.id);
    queryClient.setQueryData(["job", next.id], next);
    void queryClient.invalidateQueries({ queryKey: ["sync-status"] });
  }

  async function resume() {
    const next = await api.continueJob(job.id);
    queryClient.setQueryData(["job", next.id], next);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{job.jobType === "historical" ? "Historical import" : "Recent sync"}</CardTitle>
          <Badge>{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-sm">
          Page {job.page} · {job.recordsProcessed} activities saved
        </p>
        {job.status === "pending" && job.retryAfter ? (
          <p className="text-sm text-muted-foreground">Waiting for Strava until {formatInstant(job.retryAfter)}.</p>
        ) : null}
        {job.error ? <p className="text-sm text-destructive">{job.error}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          {job.status === "failed" ? (
            <Button onClick={() => void resume()}>Resume</Button>
          ) : null}
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
