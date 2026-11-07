import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { JobPanel } from "@/features/sync/job-panel.tsx";
import { useJobRunner } from "@/features/sync/use-job-runner.ts";
import { ApiError, api } from "@/lib/api.ts";
import { formatDistance, formatDuration, formatInstant, formatLocalClock } from "@/lib/format.ts";
import { sportKey, sportLabel } from "@coach/shared";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const auth = useQuery({ queryKey: ["auth"], queryFn: api.authStatus });
  const status = useQuery({ queryKey: ["sync-status"], queryFn: api.syncStatus, enabled: auth.data?.connected === true });
  const sports = useQuery({
    queryKey: ["sports"],
    queryFn: api.sports,
    enabled: auth.data?.connected === true,
  });
  const recent = useQuery({
    queryKey: ["activities", { limit: 5 }],
    queryFn: () => api.activities({ limit: 5, sort: "desc" }),
    enabled: auth.data?.connected === true,
  });
  const runner = useJobRunner(jobId);
  const syncNow = useMutation({
    mutationFn: api.syncNow,
    onSuccess: (job) => {
      setSyncError(null);
      setJobId(job.id);
      queryClient.setQueryData(["job", job.id], job);
      void queryClient.invalidateQueries({ queryKey: ["sync-status"] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
      void queryClient.invalidateQueries({ queryKey: ["sports"] });
    },
    onError: (error: unknown) => {
      setSyncError(error instanceof ApiError ? error.message : "Sync failed");
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Training desk</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Runs, rides, swims, and the rest of the Strava history. Charts by sport come after this record is reliable.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Strava</p>
            <CardTitle>{auth.data?.connected ? "Connected" : "Not connected"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{auth.data?.displayName ?? "Connect an athlete in settings."}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Activities</p>
            <CardTitle className="font-mono">{status.data?.activityCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {sports.data && sports.data.sports.length > 0
                ? sports.data.sports.map((item) => `${sportLabel(item.sport)} ${item.count}`).join(" · ")
                : "Every sport Strava returns, one row per activity."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Last sync</p>
            <CardTitle className="text-2xl">{formatInstant(status.data?.lastSyncedAt ?? null)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button disabled={!auth.data?.connected || syncNow.isPending} onClick={() => syncNow.mutate()}>
              Sync now
            </Button>
          </CardContent>
        </Card>
      </div>
      {syncError ? <p className="text-sm text-destructive">{syncError}</p> : null}
      {runner.job ? <JobPanel job={runner.job} error={runner.error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Recent activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.data && recent.data.activities.length > 0 ? (
            <ul className="divide-y">
              {recent.data.activities.map((activity) => (
                <li key={activity.id} className="flex items-baseline justify-between gap-4 py-3">
                  <div>
                    <Link className="font-medium underline-offset-4 hover:underline" to={`/activities/${activity.id}`}>
                      {activity.name ?? "Untitled activity"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        {sportLabel(sportKey(activity.sportType, activity.activityType))} · {formatLocalClock(activity.startDateLocal)}
                      </p>
                  </div>
                  <p className="font-mono text-sm">
                    {formatDistance(activity.distance)} · {formatDuration(activity.movingTime)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No activities yet. <Link className="underline" to="/import">Import history</Link> after Strava is connected.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
