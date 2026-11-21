import type { AthleteProfile } from "@coach/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, Check, Cpu, Flag, HeartPulse, Lock, ShieldAlert, UserRound, Zap, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { RosterCard } from "@/features/athletes/roster-card.tsx";
import { ModelSelector } from "@/features/coach/model-selector.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";

const errors: Record<string, string> = {
  oauth_state: "The Strava connection was interrupted. Start it again.",
  access_denied: "Strava access was not granted.",
  athlete_locked: "The first Strava connection has to be the owner of this Coach.",
  roster_full: "Five athletes are already waiting or approved. The owner has to free a spot.",
  strava: "Strava could not complete the connection.",
};

function IconTitle({ icon: Icon, tone, children }: { icon: LucideIcon; tone: string; children: ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2.5">
      <span className={cn("grid size-8 place-items-center rounded-xl ring-1 ring-inset", tone)} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      {children}
    </CardTitle>
  );
}

export function SettingsPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { mode, auth } = useDataMode();
  const connected = mode === "live";
  const ai = useQuery({ queryKey: ["ai-status"], queryFn: api.aiStatus, enabled: connected });
  const disconnect = useMutation({
    mutationFn: api.disconnect,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      await queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });
  const error = params.get("error");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Your setup"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden="true" />
            Strava tokens stay encrypted on the server. The browser only keeps a session cookie.
          </span>
        }
      />
      {error && errors[error] ? (
        <p className="animate-pop-in flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
          {errors[error]}
        </p>
      ) : null}

      <Stagger className="grid gap-6 xl:grid-cols-2">
        <StaggerItem>
          <Card className="h-full overflow-hidden">
            <CardHeader>
              <div className="space-y-1">
                <IconTitle icon={Zap} tone="bg-strava/15 text-strava ring-strava/30">
                  {connected ? "Strava connected" : "Connect Strava"}
                </IconTitle>
                <CardDescription>Coach reads your activities. It never posts to Strava.</CardDescription>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                  connected ? "bg-success/12 text-success ring-success/25" : "bg-surface-2 text-muted-foreground ring-border",
                )}
              >
                <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-faint")} aria-hidden="true" />
                {connected ? "Live" : "Offline"}
              </span>
            </CardHeader>
            <CardContent className="mt-5 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-2/60 px-4 py-3">
                <span className="grid size-10 place-items-center rounded-full bg-spectrum font-display text-sm font-semibold text-primary-foreground" aria-hidden="true">
                  {initials(auth?.displayName) ?? <UserRound className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{auth?.displayName ?? "No athlete is connected."}</p>
                  {auth?.displayName ? <p className="num text-xs text-muted-foreground">Athlete {auth.athleteId}</p> : null}
                </div>
              </div>
              {auth?.expiresAt ? <p className="text-xs text-muted-foreground">Access token expires {formatInstant(auth.expiresAt)}.</p> : null}
              {connected ? (
                <Button variant="outline" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
                  {disconnect.isPending ? "Disconnecting" : "Disconnect"}
                </Button>
              ) : (
                <Button asChild>
                  <a href="/api/auth/strava">Connect Strava</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full overflow-hidden">
            <CardHeader>
              <div className="space-y-1">
                <IconTitle icon={Cpu} tone="bg-pulse-subtle text-pulse ring-pulse/25">
                  Local model
                </IconTitle>
                <CardDescription>The model stays on this computer. The hosted worker does not call it.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-5 space-y-3">
              <ModelSelector models={ai.data?.models ?? []} value={ai.data?.model ?? null} reachable={ai.data?.reachable ?? false} loading={connected && ai.isLoading} />
              <p className="text-sm text-muted-foreground">
                {!connected ? "Connect Strava to check the model." : ai.data?.reachable ? `Ollama is running with ${ai.data.model}.` : (ai.data?.error ?? "Checking Ollama.")}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>

      {auth?.role === "owner" ? <RosterCard /> : null}
      {connected ? <ProfileCard /> : null}
    </div>
  );
}

function initials(name: string | null | undefined): string | null {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return null;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileCard() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const save = useMutation({
    mutationFn: api.saveProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["coach-insight"] });
    },
  });
  if (profile.isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  if (!profile.data) return null;
  return <ProfileFields initial={profile.data} saving={save.isPending} saved={save.isSuccess} failed={save.isError} onSave={(value) => save.mutate(value)} />;
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Group({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-border bg-surface-2/30 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </fieldset>
  );
}

function ProfileFields({
  initial,
  saving,
  saved,
  failed,
  onSave,
}: {
  initial: AthleteProfile;
  saving: boolean;
  saved: boolean;
  failed: boolean;
  onSave: (value: AthleteProfile) => void;
}) {
  const [form, setForm] = useState(initial);
  const number = (key: "maxHeartRate" | "thresholdHeartRate" | "restingHeartRate" | "weeklyAvailabilityDays") => ({
    value: form[key] ?? "",
    inputMode: "numeric" as const,
    onChange: (event: { target: { value: string } }) => setForm({ ...form, [key]: numberOrNull(event.target.value) }),
  });
  const result = failed ? "failed" : saved ? "saved" : null;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <IconTitle icon={UserRound} tone="bg-primary-subtle text-primary ring-primary/20">
            Athlete profile
          </IconTitle>
          <CardDescription>Used for the Coach&apos;s interpretations, your training focus and the race taper in your directions. Leave a field empty if you do not know it.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-5 space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <Group icon={HeartPulse} title="Heart rate" description="Thresholds the Coach uses to read effort.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Max (bpm)" htmlFor="profile-max-hr">
                <Input id="profile-max-hr" {...number("maxHeartRate")} />
              </Field>
              <Field label="Threshold (bpm)" htmlFor="profile-threshold-hr">
                <Input id="profile-threshold-hr" {...number("thresholdHeartRate")} />
              </Field>
              <Field label="Resting (bpm)" htmlFor="profile-resting-hr">
                <Input id="profile-resting-hr" {...number("restingHeartRate")} />
              </Field>
            </div>
          </Group>
          <Group icon={Flag} title="Race goal" description="Within two weeks of race day, your directions switch to a taper.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Race goal" htmlFor="profile-goal">
                <Input id="profile-goal" value={form.raceGoal ?? ""} onChange={(event) => setForm({ ...form, raceGoal: event.target.value || null })} />
              </Field>
              <Field label="Race date" htmlFor="profile-race-date">
                <Input id="profile-race-date" type="date" value={form.targetRaceDate ?? ""} onChange={(event) => setForm({ ...form, targetRaceDate: event.target.value || null })} />
              </Field>
              <Field label="Distance (km)" htmlFor="profile-race-distance">
                <Input
                  id="profile-race-distance"
                  inputMode="decimal"
                  value={form.targetDistanceMeters != null ? form.targetDistanceMeters / 1000 : ""}
                  onChange={(event) => {
                    const km = numberOrNull(event.target.value);
                    setForm({ ...form, targetDistanceMeters: km != null && km > 0 ? km * 1000 : null });
                  }}
                />
              </Field>
            </div>
          </Group>
        </div>
        <Group icon={CalendarDays} title="Life around training" description="Where you are, how often you can train, and anything to work around.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Timezone" htmlFor="profile-timezone">
              <Input id="profile-timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
            </Field>
            <Field label="Training days per week" htmlFor="profile-days" hint="Measured against your active days on the dashboard.">
              <Input id="profile-days" {...number("weeklyAvailabilityDays")} />
            </Field>
            <Field label="Injury constraints" htmlFor="profile-injury">
              <Input id="profile-injury" value={form.injuryConstraints ?? ""} onChange={(event) => setForm({ ...form, injuryConstraints: event.target.value || null })} />
            </Field>
          </div>
        </Group>
        <div className="flex items-center gap-3 pt-1">
          <Button disabled={saving} onClick={() => onSave(form)}>
            {saving ? "Saving" : "Save profile"}
          </Button>
          <p className="min-h-5 text-xs" role="status">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.span
                  key={result}
                  className={cn("inline-flex items-center gap-1.5", result === "failed" ? "text-danger" : "text-success")}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {result === "saved" ? <Check className="size-3.5" aria-hidden="true" /> : <AlertTriangle className="size-3.5" aria-hidden="true" />}
                  {result === "failed" ? "The profile could not be saved." : "Profile saved."}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
