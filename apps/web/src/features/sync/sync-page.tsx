import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useSyncStatus } from "@/data/queries.ts";
import { ApiError, api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { JobPanel } from "./job-panel.tsx";
import { StravaConnection } from "./strava-connection.tsx";
import { SyncHistory } from "./sync-history.tsx";
import { SyncStatus } from "./sync-status.tsx";
import { useJobRunner } from "./use-job-runner.ts";

export function SyncPage() {
  const queryClient = useQueryClient();
  const { mode, auth } = useDataMode();
  const status = useSyncStatus();
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const jobId = overrideId ?? status.data?.activeJob?.id ?? status.data?.resumableJob?.id ?? null;
  const runner = useJobRunner(jobId);
  const connected = mode === "live";
  const busy = runner.job?.status === "pending" || runner.job?.status === "running";

  async function start(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const job = await api.startHistorical({ ...(after ? { after } : {}), ...(before ? { before } : {}) });
      setOverrideId(job.id);
      queryClient.setQueryData(["job", job.id], job);
      for (const key of ["sync-status", "sync-jobs", "activities", "sports"]) void queryClient.invalidateQueries({ queryKey: [key] });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Import failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Data & Sync" description="Strava activities are stored here first. Everything Coach shows is calculated from that stored record." actions={<SyncStatus />} />
      <DemoBanner />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card>
            <CardHeader>
              <div className="space-y-0.5">
                <CardTitle>Historical import</CardTitle>
                <CardDescription>Each request stores one page of activities, then asks for the next. Leave both dates empty to import everything Strava allows.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(event) => void start(event)}>
                <div className="space-y-1.5">
                  <Label htmlFor="import-after">After</Label>
                  <Input id="import-after" type="date" value={after} max={before || undefined} onChange={(event) => setAfter(event.target.value)} disabled={!connected} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="import-before">Before</Label>
                  <Input id="import-before" type="date" value={before} min={after || undefined} onChange={(event) => setBefore(event.target.value)} disabled={!connected} />
                </div>
                <Button type="submit" disabled={!connected || busy}>
                  {busy ? "Importing" : "Start import"}
                </Button>
              </form>
              {formError ? <p className="mt-3 text-sm text-danger" role="alert">{formError}</p> : null}
              {!connected ? <p className="mt-3 text-sm text-muted-foreground">Connect Strava to import activities.</p> : null}
            </CardContent>
          </Card>
          {runner.job ? <JobPanel job={runner.job} error={runner.error} /> : null}
          <SyncHistory />
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
            </CardHeader>
            <CardContent className="mt-3 space-y-4">
              <StravaConnection className="border-0 bg-surface-2 px-3" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Activities stored</dt>
                  <dd className="num font-medium text-platinum">{connected ? (status.data?.activityCount ?? "—") : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Last sync</dt>
                  <dd className="num text-right font-medium text-platinum">{connected ? formatInstant(status.data?.lastSyncedAt ?? null) : "—"}</dd>
                </div>
                {auth?.expiresAt ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Token refreshes</dt>
                    <dd className="num text-right font-medium text-platinum">{formatInstant(auth.expiresAt)}</dd>
                  </div>
                ) : null}
              </dl>
              {connected ? (
                <Link to="/settings" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                  Manage connection
                </Link>
              ) : (
                <a href="/api/auth/strava" className={cn(buttonVariants({ size: "sm" }), "w-full")}>
                  Connect Strava
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
