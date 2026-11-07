import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { JobPanel } from "@/features/sync/job-panel.tsx";
import { useJobRunner } from "@/features/sync/use-job-runner.ts";
import { ApiError, api } from "@/lib/api.ts";

export function ImportPage() {
  const queryClient = useQueryClient();
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const auth = useQuery({ queryKey: ["auth"], queryFn: api.authStatus });
  const status = useQuery({ queryKey: ["sync-status"], queryFn: api.syncStatus, enabled: auth.data?.connected === true });
  const jobId = overrideId ?? status.data?.activeJob?.id ?? status.data?.resumableJob?.id ?? null;
  const runner = useJobRunner(jobId);

  async function start(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const job = await api.startHistorical({
        ...(after ? { after } : {}),
        ...(before ? { before } : {}),
      });
      setOverrideId(job.id);
      queryClient.setQueryData(["job", job.id], job);
      void queryClient.invalidateQueries({ queryKey: ["sync-status"] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
      void queryClient.invalidateQueries({ queryKey: ["sports"] });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Import failed");
    }
  }

  const busy = runner.job?.status === "pending" || runner.job?.status === "running";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Historical import</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Runs, rides, swims, and every other Strava activity are saved together. Each request stores one page, then the screen asks for the next.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Date range</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={(event) => void start(event)}>
            <div className="space-y-2">
              <Label htmlFor="after">After</Label>
              <Input id="after" type="date" value={after} onChange={(event) => setAfter(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="before">Before</Label>
              <Input id="before" type="date" value={before} onChange={(event) => setBefore(event.target.value)} />
            </div>
            <Button type="submit" disabled={!auth.data?.connected || busy}>
              Start import
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">Leave both dates empty to import the accessible history.</p>
          {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
          {!auth.data?.connected ? <p className="mt-3 text-sm">Connect Strava in settings before importing.</p> : null}
        </CardContent>
      </Card>
      {runner.job ? <JobPanel job={runner.job} error={runner.error} /> : null}
    </div>
  );
}
