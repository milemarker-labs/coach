import type { SyncJob } from "@coach/shared";
import { useQueryClient } from "@tanstack/react-query";
import { CloudDownload, Layers } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { jobTitle } from "./job-title.ts";
import { StatusPill } from "./status-pill.tsx";

/**
 * The job Strava is working through. Strava does not say how many pages remain, so while a
 * job runs the bar is a moving sweep rather than a made-up percentage.
 */
function JobProgress({ status }: { status: SyncJob["status"] }) {
  const reduce = useReducedMotion();
  const active = status === "pending" || status === "running";
  const done = status === "completed";
  return (
    <div
      className="relative h-2 overflow-hidden rounded-full bg-surface-3/70"
      role="progressbar"
      aria-label="Sync progress"
      aria-valuemin={0}
      aria-valuemax={100}
      {...(done ? { "aria-valuenow": 100 } : {})}
    >
      {active ? (
        <>
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgb(var(--flow-rgb)/0.35)_50%,transparent_100%)] bg-[length:200%_100%]" />
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-pulse via-flow to-primary"
            initial={{ left: "-33%" }}
            animate={reduce ? { left: "33%" } : { left: ["-33%", "100%"] }}
            transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        <motion.div
          className={cn("h-full rounded-full", done ? "bg-gradient-to-r from-flow to-primary" : status === "failed" ? "bg-danger/70" : "bg-faint")}
          initial={{ width: "0%" }}
          animate={{ width: done ? "100%" : "40%" }}
          transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  );
}

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
    <Card className={cn("animate-fade-in overflow-hidden", active && "ring-spectrum")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudDownload className={cn("size-4", active ? "text-flow" : "text-muted-foreground")} aria-hidden="true" />
          {jobTitle(job)}
        </CardTitle>
        <StatusPill status={job.status} />
      </CardHeader>
      <CardContent className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-2/60 px-3 py-2.5">
            <p className="text-[11px] text-faint">Activities saved</p>
            <AnimatedNumber value={job.recordsProcessed} className="font-display text-2xl font-semibold" />
          </div>
          <div className="rounded-xl bg-surface-2/60 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] text-faint">
              <Layers className="size-3" aria-hidden="true" />
              Page
            </p>
            <AnimatedNumber value={job.page} className="font-display text-2xl font-semibold" />
          </div>
        </div>
        <JobProgress status={job.status} />
        <div aria-live="polite" className="space-y-1">
          {job.status === "pending" && job.retryAfter ? <p className="text-sm text-warning">Waiting for Strava until {formatInstant(job.retryAfter)}.</p> : null}
          {job.error ? <p className="text-sm text-danger">{job.error}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
        {job.status === "failed" || active ? (
          <div className="flex gap-2">
            {job.status === "failed" ? <Button onClick={() => void resume()}>Resume</Button> : null}
            {active ? (
              <Button variant="outline" onClick={() => void cancel()}>
                Cancel
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
