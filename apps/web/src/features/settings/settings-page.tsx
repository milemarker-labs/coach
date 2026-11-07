import type { AthleteProfile } from "@coach/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useDataMode } from "@/data/mode.ts";
import { RosterCard } from "@/features/athletes/roster-card.tsx";
import { ModelSelector } from "@/features/coach/model-selector.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";

const errors: Record<string, string> = {
  oauth_state: "The Strava connection was interrupted. Start it again.",
  access_denied: "Strava access was not granted.",
  athlete_locked: "The first Strava connection has to be the owner of this Coach.",
  roster_full: "Five athletes are already waiting or approved. The owner has to free a spot.",
  strava: "Strava could not complete the connection.",
};

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
      <PageHeader title="Settings" description="Strava tokens stay encrypted on the server. The browser only keeps a session cookie." />
      {error && errors[error] ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger" role="alert">
          {errors[error]}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="space-y-0.5">
              <CardTitle>{connected ? "Strava connected" : "Connect Strava"}</CardTitle>
              <CardDescription>Coach reads your activities. It never posts to Strava.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 space-y-3">
            <p className="text-sm text-platinum">{auth?.displayName ? `${auth.displayName} · athlete ${auth.athleteId}` : "No athlete is connected."}</p>
            {auth?.expiresAt ? <p className="text-xs text-muted-foreground">Access token expires {formatInstant(auth.expiresAt)}.</p> : null}
            {connected ? (
              <Button variant="outline" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
                Disconnect
              </Button>
            ) : (
              <Button asChild>
                <a href="/api/auth/strava">Connect Strava</a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-0.5">
              <CardTitle>Local model</CardTitle>
              <CardDescription>The model stays on this computer. The hosted worker does not call it.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 space-y-3">
            <ModelSelector models={ai.data?.models ?? []} value={ai.data?.model ?? null} reachable={ai.data?.reachable ?? false} loading={connected && ai.isLoading} />
            <p className="text-sm text-muted-foreground">
              {!connected ? "Connect Strava to check the model." : ai.data?.reachable ? `Ollama is running with ${ai.data.model}.` : (ai.data?.error ?? "Checking Ollama.")}
            </p>
          </CardContent>
        </Card>
      </div>

      {auth?.role === "owner" ? <RosterCard /> : null}
      {connected ? <ProfileCard /> : null}
    </div>
  );
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
  if (profile.isLoading) return <Skeleton className="h-72" />;
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
  return (
    <Card>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle>Athlete profile</CardTitle>
          <CardDescription>Used for the Coach's interpretations and your training focus. Leave a field empty if you do not know it.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-4 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Timezone" htmlFor="profile-timezone">
            <Input id="profile-timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
          </Field>
          <Field label="Max heart rate (bpm)" htmlFor="profile-max-hr">
            <Input id="profile-max-hr" {...number("maxHeartRate")} />
          </Field>
          <Field label="Threshold heart rate (bpm)" htmlFor="profile-threshold-hr">
            <Input id="profile-threshold-hr" {...number("thresholdHeartRate")} />
          </Field>
          <Field label="Resting heart rate (bpm)" htmlFor="profile-resting-hr">
            <Input id="profile-resting-hr" {...number("restingHeartRate")} />
          </Field>
          <Field label="Training days per week" htmlFor="profile-days" hint="Measured against your active days on the dashboard.">
            <Input id="profile-days" {...number("weeklyAvailabilityDays")} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Race goal" htmlFor="profile-goal">
            <Input id="profile-goal" value={form.raceGoal ?? ""} onChange={(event) => setForm({ ...form, raceGoal: event.target.value || null })} />
          </Field>
          <Field label="Race date" htmlFor="profile-race-date">
            <Input id="profile-race-date" type="date" value={form.targetRaceDate ?? ""} onChange={(event) => setForm({ ...form, targetRaceDate: event.target.value || null })} />
          </Field>
          <Field label="Race distance (km)" htmlFor="profile-race-distance">
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
        <Field label="Injury constraints" htmlFor="profile-injury">
          <Input id="profile-injury" value={form.injuryConstraints ?? ""} onChange={(event) => setForm({ ...form, injuryConstraints: event.target.value || null })} />
        </Field>
        <div className="flex items-center gap-3">
          <Button disabled={saving} onClick={() => onSave(form)}>
            {saving ? "Saving" : "Save profile"}
          </Button>
          <p className={failed ? "text-xs text-danger" : "text-xs text-success"} role="status">
            {failed ? "The profile could not be saved." : saved ? "Profile saved." : ""}
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
