import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDataMode } from "@/data/mode.ts";
import { ApiError, api } from "@/lib/api.ts";
import { useJobRunner } from "./use-job-runner.ts";

export type SyncPhase = "idle" | "syncing" | "success" | "error";

const SUCCESS_VISIBLE_MS = 6000;

/** Starts an incremental sync and reports its progress as idle, syncing, success or error. */
export function useSyncNow() {
  const queryClient = useQueryClient();
  const { mode } = useDataMode();
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef<string | null>(null);
  const runner = useJobRunner(jobId);

  const mutation = useMutation({
    mutationFn: api.syncNow,
    onMutate: () => setError(null),
    onSuccess: (job) => {
      setJobId(job.id);
      queryClient.setQueryData(["job", job.id], job);
    },
    onError: (caught: unknown) => {
      // A sync that is already running is not a failure: follow it instead.
      if (caught instanceof ApiError && caught.status === 409) {
        const running = (caught.body as { job?: { id?: string } } | null)?.job;
        if (running?.id) {
          setJobId(running.id);
          return;
        }
      }
      setError(caught instanceof ApiError ? caught.message : "Sync failed");
    },
  });

  const job = runner.job;
  const finished = job?.status === "completed" ? job : null;

  useEffect(() => {
    if (!finished || handled.current === finished.id) return;
    handled.current = finished.id;
    for (const key of ["activities", "sports", "sync-status", "sync-jobs"]) void queryClient.invalidateQueries({ queryKey: [key] });
    // Not cleared on re-render: refetching the job must not keep the success message on screen.
    window.setTimeout(() => setJobId(null), SUCCESS_VISIBLE_MS);
  }, [finished, queryClient]);

  let phase: SyncPhase = "idle";
  let message: string | null = null;
  if (error || runner.error || job?.status === "failed") {
    phase = "error";
    message = error ?? runner.error ?? job?.error ?? "Sync failed";
  } else if (mutation.isPending || job?.status === "pending" || job?.status === "running") {
    phase = "syncing";
    message = job ? `${job.recordsProcessed} activities saved` : null;
  } else if (finished) {
    phase = "success";
    message = finished.recordsProcessed === 0 ? "Already up to date" : `${finished.recordsProcessed} activities synced`;
  }

  return {
    start: () => mutation.mutate(),
    phase,
    message,
    /** Why syncing is not possible right now, or null when it is. */
    blockedReason: mode === "live" ? null : mode === "demo" ? "Connect Strava to sync" : "Loading",
    job,
  };
}
