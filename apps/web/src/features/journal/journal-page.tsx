import { formatEffort, sportKey, sportLabel, type Journal, type JournalEntry } from "@coach/shared";
import { Activity as ActivityIcon, Clock, Mountain, Route } from "lucide-react";
import { useEffect } from "react";
import { makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SportBadge } from "@/features/activities/activity-meta.tsx";
import { formStatus } from "@/features/analytics/calculations/load.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { PublicFrame } from "@/features/landing/public-frame.tsx";
import { formatDistance, formatDuration, formatElevation, formatHeartRate, formatHoursMinutes } from "@/lib/format.ts";
import { formatJournalDay, formatJournalRange, journalDays, journalTotals, type JournalDay } from "./days.ts";
import { useJournal } from "./use-journal.ts";

export function JournalPage() {
  const journal = useJournal();
  const name = journal.data?.name;

  useEffect(() => {
    document.title = name ? `${name} · Athletic journal` : "Athletic journal";
  }, [name]);

  return (
    <PublicFrame>
      <header className="max-w-3xl">
        <p className="text-xs font-medium tracking-[0.18em] text-accent-foreground uppercase">Athletic journal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-platinum sm:text-5xl">{name ?? "This week"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {journal.data ? (
            <>
              {formatJournalRange(journal.data.from, journal.data.to)}
              <span className="text-faint"> · </span>
              {journal.data.timezone.replaceAll("_", " ")}
            </>
          ) : (
            "The last seven days."
          )}
        </p>
      </header>

      {journal.isLoading ? (
        <div className="mt-10 space-y-4" role="status" aria-label="Loading the journal">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : journal.isError || !journal.data ? (
        <div className="mt-8">
          <EmptyState tone="danger" title="The journal could not be loaded" description="The last seven days are published from Coach. Try again in a moment." />
        </div>
      ) : (
        <JournalBody data={journal.data} />
      )}
    </PublicFrame>
  );
}

function JournalBody({ data }: { data: Journal }) {
  const totals = journalTotals(data.activities);
  const days = journalDays(data);
  const kilometers = (totals.distance / 1000).toFixed(1);
  const reading = fitnessReading(data);

  return (
    <div className="mt-10 space-y-10">
      <MetricGroup label="Last 7 days">
        <MetricCard label="Activities" icon={ActivityIcon} value={String(totals.count)} hint="Sessions in this window" />
        <MetricCard label="Distance" icon={Route} value={kilometers} unit="km" hint="All sports" />
        <MetricCard label="Moving time" icon={Clock} value={formatHoursMinutes(totals.movingTime)} hint="Time on the move" />
        <MetricCard label="Elevation" icon={Mountain} value={Math.round(totals.elevation).toLocaleString()} unit="m" hint="Climbed" />
      </MetricGroup>

      {reading ? (
        <section className="space-y-4">
          <MetricGroup label="Fitness, fatigue and form">
            <MetricCard
              label="Fitness (CTL)"
              value={String(Math.round(reading.current.fitness))}
              delta={makeDelta(reading.fitnessDelta, { goodWhen: "up" })}
              hint="Change in 7 days"
            />
            <MetricCard
              label="Fatigue (ATL)"
              value={String(Math.round(reading.current.fatigue))}
              delta={makeDelta(reading.fatigueDelta, { goodWhen: "none" })}
              hint="Change in 7 days"
            />
            <MetricCard
              label="Form (TSB)"
              value={signed(reading.current.form)}
              delta={makeDelta(reading.formDelta, { goodWhen: "none" })}
              aside={<Badge tone={reading.status.tone}>{reading.status.label}</Badge>}
              hint="Fitness minus fatigue"
            />
          </MetricGroup>
          <FitnessFormChart data={data.fitness} status="ready" />
        </section>
      ) : null}

      <div>
        {days.map((day) => (
          <DaySection key={day.date} day={day} />
        ))}
      </div>
      <p className="text-xs text-faint">Older sessions stay in the private archive.</p>
    </div>
  );
}

function fitnessReading(data: Journal) {
  const current = data.fitness.at(-1);
  const earlier = data.fitness.at(-8) ?? data.fitness[0];
  if (!current || !earlier) return null;
  return {
    current,
    fitnessDelta: current.fitness - earlier.fitness,
    fatigueDelta: current.fatigue - earlier.fatigue,
    formDelta: current.form - earlier.form,
    status: formStatus(current.form),
  };
}

function signed(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function DaySection({ day }: { day: JournalDay }) {
  const label = formatJournalDay(day.date);
  return (
    <section className="grid gap-3 border-t border-border py-5 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-sm font-medium text-platinum">{label.weekday}</h2>
        <p className="text-xs text-muted-foreground">{label.date}</p>
      </div>
      {day.activities.length === 0 ? (
        <p className="py-1 text-sm text-faint">Rest</p>
      ) : (
        <ul>
          {day.activities.map((activity) => (
            <JournalEntryRow key={activity.id} entry={activity} />
          ))}
        </ul>
      )}
    </section>
  );
}

function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  const sport = sportKey(entry.sportType, entry.activityType);
  const label = sportLabel(sport);
  const effort = formatEffort(sport, entry.averageSpeed);
  const duration = entry.movingTime ?? entry.elapsedTime;
  const primary = entry.distance ? formatDistance(entry.distance) : formatDuration(duration);
  const clock = wallClock(entry.startDateLocal);
  const details = [
    label,
    clock,
    entry.distance ? formatDuration(duration) : null,
    effort.value === "—" ? null : effort.value,
    entry.totalElevationGain ? formatElevation(entry.totalElevationGain) : null,
    entry.averageHeartrate ? formatHeartRate(entry.averageHeartrate) : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <li className="flex gap-3 py-3">
      <SportBadge sport={sport} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-platinum">{entry.name?.trim() || label}</p>
          <p className="num shrink-0 text-sm font-semibold text-platinum">{primary}</p>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{details.join(" · ")}</p>
      </div>
    </li>
  );
}

function wallClock(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 19)}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date);
}
