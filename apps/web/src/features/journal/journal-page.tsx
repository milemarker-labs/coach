import {
  SCORE_DESCRIPTIONS,
  SCORE_WEIGHTS,
  formatEffort,
  sportKey,
  sportLabel,
  type Journal,
  type JournalEntry,
  type JournalScore,
  type ScoreComponent,
  type ScoreComponentKey,
} from "@coach/shared";
import { Activity as ActivityIcon, Clock, Globe2, Mountain, Moon, Route } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SportBadge } from "@/features/activities/activity-meta.tsx";
import { formStatus } from "@/features/analytics/calculations/load.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { PublicFrame } from "@/features/landing/public-frame.tsx";
import { MarkerBreakdown } from "@/features/score/marker-breakdown.tsx";
import { WeekChange } from "@/features/score/marker-hero.tsx";
import { MarkerRing } from "@/features/score/marker-ring.tsx";
import { MarkerTrend } from "@/features/score/marker-trend.tsx";
import { formatDistance, formatDuration, formatElevation, formatHeartRate, formatHoursMinutes } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { formatJournalDay, formatJournalRange, journalDays, journalTotals, type JournalDay } from "./days.ts";
import { useJournal } from "./use-journal.ts";
import { WeekStrip } from "./week-strip.tsx";

const EASE = [0.16, 1, 0.3, 1] as const;

export function JournalPage() {
  const journal = useJournal();
  const name = journal.data?.name;

  useEffect(() => {
    document.title = name ? `${name} · Athletic journal` : "Athletic journal";
  }, [name]);

  return (
    <PublicFrame>
      {journal.isLoading ? (
        <div className="space-y-6 pt-4" role="status" aria-label="Loading the journal">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : journal.isError || !journal.data ? (
        <div className="pt-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-accent-foreground uppercase">Athletic journal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">This week</h1>
          <div className="mt-8 rounded-3xl border border-border bg-card/60">
            <EmptyState tone="danger" title="The journal could not be loaded" description="The last seven days are published from Coach. Try again in a moment." />
          </div>
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
  const restDays = days.filter((day) => day.activities.length === 0).length;

  return (
    <div className="space-y-10 pt-2">
      <Hero data={data} restDays={restDays} />

      <MetricGroup label="Last 7 days">
        <MetricCard label="Activities" icon={ActivityIcon} value={String(totals.count)} hint={`${7 - restDays} active days, ${restDays} rest`} />
        <MetricCard label="Distance" icon={Route} accent="flow" value={kilometers} unit="km" hint="All sports" />
        <MetricCard label="Moving time" icon={Clock} accent="pulse" value={formatHoursMinutes(totals.movingTime)} hint="Time on the move" />
        <MetricCard label="Elevation" icon={Mountain} accent="trail" value={Math.round(totals.elevation).toLocaleString()} unit="m" hint="Climbed" />
      </MetricGroup>

      {reading ? (
        <section className="space-y-4" aria-label="Fitness, fatigue and form">
          <MetricGroup label="Fitness, fatigue and form" className="md:grid-cols-3">
            <MetricCard label="Fitness (CTL)" value={String(Math.round(reading.current.fitness))} delta={makeDelta(reading.fitnessDelta, { goodWhen: "up" })} hint="Change in 7 days" />
            <MetricCard label="Fatigue (ATL)" value={String(Math.round(reading.current.fatigue))} delta={makeDelta(reading.fatigueDelta, { goodWhen: "none" })} hint="Change in 7 days" />
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

      <section aria-labelledby="days-heading">
        <h2 id="days-heading" className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Day by day
        </h2>
        <div className="relative mt-4 pl-6">
          <span className="absolute top-3 bottom-3 left-[7px] w-px bg-gradient-to-b from-primary/60 via-flow/40 to-pulse/20" aria-hidden="true" />
          <Stagger as="ol" inView className="space-y-3" gap={0.06}>
            {days.map((day, index) => (
              <DaySection key={day.date} day={day} first={index === 0} />
            ))}
          </Stagger>
        </div>
      </section>
      <p className="text-xs text-faint">Older sessions stay in the private archive.</p>
    </div>
  );
}

function Hero({ data, restDays }: { data: Journal; restDays: number }) {
  const score = data.score;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/70 p-5 sm:p-8">
      <div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-pulse/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30 mask-radial" aria-hidden="true" />

      <div className={cn("relative grid gap-8", score && "lg:grid-cols-[minmax(0,1fr)_auto]")}>
        <div className="flex min-w-0 flex-col">
          <motion.p
            className="text-[11px] font-semibold tracking-[0.22em] text-accent-foreground uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Athletic journal · public
          </motion.p>
          <motion.h1
            className="mt-3 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl"
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          >
            {data.name}
          </motion.h1>
          <motion.p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {formatJournalRange(data.from, data.to)}
            <span className="text-faint">·</span>
            <span className="inline-flex items-center gap-1">
              <Globe2 className="size-3.5" aria-hidden="true" />
              {data.timezone.replaceAll("_", " ")}
            </span>
          </motion.p>

          <div className="mt-auto pt-8">
            <div className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground">
              <span>The week at a glance</span>
              <span>{restDays === 0 ? "No rest days" : `${restDays} rest day${restDays === 1 ? "" : "s"}`}</span>
            </div>
            <WeekStrip days={journalDays(data)} height={88} />
          </div>
        </div>

        {score ? <ScorePanel score={score} /> : null}
      </div>
    </section>
  );
}

/** The public score. Directions stay private; this is the number, its parts and its trend. */
function ScorePanel({ score }: { score: JournalScore }) {
  const components: ScoreComponent[] = score.components
    .filter((component): component is JournalScore["components"][number] & { key: ScoreComponentKey } => component.key in SCORE_WEIGHTS)
    .map((component) => ({ ...component, weight: SCORE_WEIGHTS[component.key] }));

  return (
    <div className="flex w-full flex-col items-center gap-5 lg:w-[22rem]">
      <MarkerRing value={score.value} label={score.band.label} caption={score.name} size={220}>
        <WeekChange delta={score.delta7} />
      </MarkerRing>
      <div className="w-full">
        <MarkerTrend points={score.trend} height={56} />
        <p className="mt-1 text-center text-[11px] text-faint">Last {score.trend.length} days · confidence {score.confidence}</p>
      </div>
      {components.length > 0 ? (
        <details className="group w-full rounded-2xl border border-border bg-surface-2/40 px-4 py-3">
          <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground transition-colors marker:hidden group-open:text-foreground hover:text-foreground">
            What the {score.name} is made of
          </summary>
          <MarkerBreakdown components={components} compact delay={0} className="mt-4" />
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            {SCORE_DESCRIPTIONS.base} {SCORE_DESCRIPTIONS.consistency} Calculated from logged activities only.
          </p>
        </details>
      ) : null}
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

function DaySection({ day, first }: { day: JournalDay; first: boolean }) {
  const label = formatJournalDay(day.date);
  const rest = day.activities.length === 0;
  return (
    <StaggerItem as="li" className="relative">
      <span
        className={cn(
          "absolute top-5 -left-6 size-[15px] rounded-full border-2 border-background",
          rest ? "bg-surface-3" : first ? "bg-primary shadow-[0_0_14px_rgb(var(--brand-rgb)/0.35)]" : "bg-flow",
        )}
        aria-hidden="true"
      />
      <section
        className={cn(
          "grid gap-3 rounded-2xl border px-4 py-4 transition-colors sm:px-5 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6",
          rest ? "border-dashed border-border bg-transparent" : "border-border bg-card/60 hover:border-border-hover",
        )}
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">{label.weekday}</h3>
          <p className="text-xs text-muted-foreground">{label.date}</p>
        </div>
        {rest ? (
          <p className="flex items-center gap-2 py-1 text-sm text-faint">
            <Moon className="size-3.5" aria-hidden="true" />
            Rest
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {day.activities.map((activity) => (
              <JournalEntryRow key={activity.id} entry={activity} />
            ))}
          </ul>
        )}
      </section>
    </StaggerItem>
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
    <li className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
      <SportBadge sport={sport} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-foreground">{entry.name?.trim() || label}</p>
          <p className="num shrink-0 font-display text-sm font-semibold text-foreground">{primary}</p>
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
