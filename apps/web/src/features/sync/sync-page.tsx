import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarRange, Database, Download, KeyRound, Timer, type LucideIcon } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useSyncStatus } from "@/data/queries.ts";
import { ApiError, api } from "@/lib/api.ts";
import { formatInstant, formatRelative } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { JobPanel } from "./job-panel.tsx";
import { StravaConnection } from "./strava-connection.tsx";
import { SyncHistory } from "./sync-history.tsx";
import { SyncStatus } from "./sync-status.tsx";
import { useJobRunner } from "./use-job-runner.ts";

/** The path every activity takes: Strava, then the Coach store, then the screens. */
function Pipeline({ connected }: { connected: boolean }) {
  const stages = [
    { icon: Download, label: "Strava", sub: "Activities API" },
    { icon: Database, label: "Coach store", sub: "Stored once" },
    { icon: ArrowRight, label: "Every screen", sub: "Calculated here" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 px-4 py-4">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
      <ol className="relative flex items-center justify-between gap-2">
        {stages.map((stage, index) => (
          <li key={stage.label} className="flex flex-1 items-center gap-2">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
                  index === 0 ? "bg-strava/15 text-strava ring-strava/30" : index === 1 ? "bg-pulse-subtle text-pulse ring-pulse/25" : "bg-primary-subtle text-primary ring-primary/20",
                )}
                aria-hidden="true"
              >
                <stage.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">{stage.label}</span>
                <span className="block truncate text-[11px] text-faint">{stage.sub}</span>
              </span>
            </span>
            {index < stages.length - 1 ? (
              <span className="relative mx-1 hidden h-px flex-1 overflow-hidden bg-border sm:block" aria-hidden="true">
                {connected ? <span className="absolute inset-0 animate-gradient-pan bg-[linear-gradient(90deg,transparent_0%,var(--flow)_25%,transparent_50%)] bg-[length:200%_100%]" /> : null}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ConnectionFact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2/50">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="num text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

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

  const activityCount = connected ? status.data?.activityCount : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data pipeline"
        title="Data & Sync"
        description="Strava activities are stored here first. Everything Coach shows is calculated from that stored record."
        actions={<SyncStatus />}
      />
      <DemoBanner />
      <Pipeline connected={connected} />

      <div className="grid gap-6 xl:grid-cols-12">
        <Stagger className="space-y-6 xl:col-span-8">
          <StaggerItem>
            <Card>
              <CardHeader>
                <div className="space-y-0.5">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarRange className="size-4 text-primary" aria-hidden="true" />
                    Historical import
                  </CardTitle>
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
                    <Download className={cn("size-4", busy && "animate-bounce")} aria-hidden="true" />
                    {busy ? "Importing" : "Start import"}
                  </Button>
                </form>
                {formError ? (
                  <p className="mt-3 text-sm text-danger" role="alert">
                    {formError}
                  </p>
                ) : null}
                {!connected ? <p className="mt-3 text-sm text-muted-foreground">Connect Strava to import activities.</p> : null}
              </CardContent>
            </Card>
          </StaggerItem>
          {runner.job ? (
            <StaggerItem>
              <JobPanel job={runner.job} error={runner.error} />
            </StaggerItem>
          ) : null}
          <StaggerItem>
            <SyncHistory />
          </StaggerItem>
        </Stagger>

        <div className="space-y-6 xl:col-span-4">
          <Card className="overflow-hidden">
            <div className="relative border-b border-border px-5 pt-5 pb-5">
              <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-pulse/20 blur-3xl" aria-hidden="true" />
              <p className="relative text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Activities stored</p>
              <p className="relative mt-1 font-display text-5xl font-semibold tracking-tight">
                {activityCount != null ? <AnimatedNumber value={activityCount} /> : <span className="text-faint">—</span>}
              </p>
              <p className="relative mt-1 text-xs text-muted-foreground">{!connected ? "Nothing stored yet" : status.data?.lastSyncedAt ? `Last synced ${formatRelative(status.data.lastSyncedAt).toLowerCase()}` : "Never synced"}</p>
            </div>
            <CardContent className="mt-4 space-y-4">
              <StravaConnection className="border-0 bg-surface-2/70" />
              <dl className="-mx-3 space-y-0.5 text-sm">
                <ConnectionFact icon={Timer} label="Last sync">
                  {connected ? formatInstant(status.data?.lastSyncedAt ?? null) : "—"}
                </ConnectionFact>
                {auth?.expiresAt ? (
                  <ConnectionFact icon={KeyRound} label="Token refreshes">
                    {formatInstant(auth.expiresAt)}
                  </ConnectionFact>
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
