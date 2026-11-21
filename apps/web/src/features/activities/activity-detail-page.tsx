import { cadenceUnit, type ActivitySummary } from "@coach/shared";
import { Activity, ArrowLeft, Clock, ExternalLink, Flame, HeartPulse, Mountain, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useParams } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { AnimatedValue } from "@/components/motion/animated-number.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { useActivityDetail, useActivityHistory } from "@/data/queries.ts";
import { activityLoad } from "@/features/analytics/calculations/load.ts";
import { SplitsChart } from "@/features/analytics/charts/splits-chart.tsx";
import { CoachInsightCard } from "@/features/coach/coach-insight-card.tsx";
import { useCoachInsight } from "@/features/coach/use-coach-insight.ts";
import { formatDuration, formatInstant, formatLocalClock } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { ActivityComparisonCard } from "./activity-comparison-card.tsx";
import { activityEffort, activitySport, activitySportLabel, sportIcon, sportTheme } from "./activity-meta.tsx";
import { SplitsTable } from "./splits-table.tsx";

const EASE = [0.16, 1, 0.3, 1] as const;

type Row = [label: string, value: string];

function DetailList({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-3">
        <dl className="grid grid-cols-2 gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface-2/30 px-3 py-2.5 transition-colors hover:border-border-hover hover:bg-surface-2/60">
              <dt className="text-[11px] text-faint">{label}</dt>
              <dd className="num mt-0.5 truncate font-display text-sm font-semibold text-foreground" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function rowsFrom(entries: (Row | false | null | undefined)[]): Row[] {
  return entries.filter((entry): entry is Row => Array.isArray(entry));
}

function performanceRows(row: ActivitySummary): Row[] {
  const cadence = cadenceUnit(activitySport(row));
  return rowsFrom([
    row.averageHeartrate != null && ["Average heart rate", `${Math.round(row.averageHeartrate)} bpm`],
    row.maxHeartrate != null && ["Max heart rate", `${Math.round(row.maxHeartrate)} bpm`],
    row.averageCadence != null && ["Cadence", `${Math.round(row.averageCadence)}${cadence ? ` ${cadence}` : ""}`],
    row.averageWatts != null && ["Average power", `${Math.round(row.averageWatts)} W`],
    row.weightedAverageWatts != null && ["Normalized power", `${Math.round(row.weightedAverageWatts)} W`],
    row.maxWatts != null && ["Max power", `${Math.round(row.maxWatts)} W`],
    row.kilojoules != null && ["Work", `${row.kilojoules.toFixed(0)} kJ`],
  ]);
}

function conditionRows(row: ActivitySummary): Row[] {
  return rowsFrom([
    row.elapsedTime != null && row.movingTime != null && ["Elapsed time", formatDuration(row.elapsedTime)],
    row.calories != null && ["Calories", Math.round(row.calories).toLocaleString()],
    row.sufferScore != null && ["Suffer score", String(row.sufferScore)],
    row.averageTemp != null && ["Temperature", `${row.averageTemp}°C`],
    row.trainer === true && ["Setting", "Indoor trainer"],
    row.commute === true && ["Commute", "Yes"],
    row.gearId ? (["Gear", row.gearId] as Row) : null,
  ]);
}

/** A big number in the hero. Null shows a dash and says why, never a zero. */
function HeroStat({ label, value, unit, missing, delay }: { label: string; value: string | null; unit?: string; missing: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease: EASE }} className="min-w-0">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      {value == null ? (
        <>
          <p className="font-display text-4xl leading-tight font-semibold text-faint sm:text-5xl">—</p>
          <p className="text-xs text-faint">{missing}</p>
        </>
      ) : (
        <p className="flex items-baseline gap-1.5">
          <AnimatedValue text={value} className="font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl" />
          {unit ? <span className="text-base font-medium text-muted-foreground">{unit}</span> : null}
        </p>
      )}
    </motion.div>
  );
}

function ActivityHero({ row }: { row: ActivitySummary }) {
  const reduce = useReducedMotion();
  const sport = activitySport(row);
  const theme = sportTheme(sport);
  const Icon = sportIcon(sport);
  const effort = activityEffort(row);
  const distance = row.distance ? (row.distance / 1000).toFixed(row.distance >= 10_000 ? 1 : 2) : null;

  return (
    <motion.header
      className="relative isolate overflow-hidden rounded-3xl border border-border bg-card/70 p-6 sm:p-8"
      initial={reduce ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* Tinted by sport: a wash, a slow orb and a grid that fades out. */}
      <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br via-transparent to-transparent", theme.wash)} aria-hidden="true" />
      <div
        className="absolute -top-32 -right-24 -z-10 size-96 animate-orb rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${theme.color}, transparent 65%)` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-dots opacity-50 mask-radial" aria-hidden="true" />
      <Icon className="absolute -right-6 -bottom-10 -z-10 size-56 -rotate-12 opacity-[0.05]" style={{ color: theme.color }} aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-2">
        <motion.span
          className={cn("grid size-12 place-items-center rounded-2xl ring-1 ring-inset", theme.tile)}
          initial={reduce ? false : { rotate: -20, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </motion.span>
        <div className="ml-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold" style={{ color: theme.color }}>
            {activitySportLabel(row)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatLocalClock(row.startDateLocal)}</span>
          {row.trainer ? <Badge>Indoor</Badge> : null}
          {row.commute ? <Badge>Commute</Badge> : null}
        </div>
      </div>

      <motion.h1
        className="mt-5 max-w-4xl text-3xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl"
        initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.08, duration: 0.7, ease: EASE }}
      >
        {row.name ?? "Untitled activity"}
      </motion.h1>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border/70 pt-6 sm:grid-cols-3">
        <HeroStat label="Distance" value={distance} unit="km" missing="Not recorded" delay={0.2} />
        <HeroStat label="Moving time" value={row.movingTime != null ? formatDuration(row.movingTime) : null} missing="Not recorded" delay={0.28} />
        <HeroStat label={effort.label} value={effort.value} missing="Not available for this sport" delay={0.36} />
      </div>
    </motion.header>
  );
}

export function ActivityDetailPage() {
  const { id } = useParams();
  const { mode } = useDataMode();
  const detail = useActivityDetail(id);
  const history = useActivityHistory();
  const insight = useCoachInsight(id ? { kind: "activity", id } : { kind: "dashboard" });

  const back = (
    <Link to="/activities" className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      All activities
    </Link>
  );

  if (detail.isLoading || mode === "loading") {
    return (
      <div className="space-y-6" role="status" aria-label="Loading activity">
        {back}
        <Skeleton className="h-72 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <EmptyState
            icon={Activity}
            tone="danger"
            title="Activity not found"
            description="It may have been removed, or the Coach API is unreachable."
            action={
              <Button variant="outline" size="sm" onClick={() => void detail.refetch()}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const { summary: row, splits } = detail.data;
  const load = activityLoad(row);
  const performance = performanceRows(row);
  const conditions = conditionRows(row);

  return (
    <div className="space-y-6">
      {back}
      <ActivityHero row={row} />
      <DemoBanner />

      <MetricGroup label="Activity summary">
        <MetricCard
          label="Avg heart rate"
          icon={HeartPulse}
          accent="trail"
          value={row.averageHeartrate != null ? String(Math.round(row.averageHeartrate)) : null}
          unit="bpm"
          hint={row.maxHeartrate ? `${Math.round(row.maxHeartrate)} bpm max` : undefined}
          unavailableHint="No heart rate recorded"
        />
        <MetricCard
          label="Elevation gain"
          icon={Mountain}
          accent="flow"
          value={row.totalElevationGain ? String(Math.round(row.totalElevationGain)) : null}
          unit="m"
          unavailableHint="Not recorded"
        />
        <MetricCard
          label="Training load"
          icon={Flame}
          accent="brand"
          value={load ? String(Math.round(load.value)) : null}
          unit="pts"
          hint={load?.basis === "effort" ? "Strava suffer score" : "Estimated from moving time"}
          unavailableHint="No moving time"
        />
        <MetricCard
          label="Elapsed time"
          icon={Clock}
          accent="pulse"
          value={row.elapsedTime != null ? formatDuration(row.elapsedTime) : null}
          hint={row.elapsedTime != null && row.movingTime != null ? `${formatDuration(Math.max(0, row.elapsedTime - row.movingTime))} stopped` : undefined}
          unavailableHint="Not recorded"
        />
      </MetricGroup>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <SplitsChart splits={splits} status="ready" />
          {splits && splits.length > 0 ? <SplitsTable splits={splits} /> : null}
        </div>
        <div className="space-y-6 xl:col-span-5">
          <ActivityComparisonCard activity={row} history={history.data ?? []} loading={history.isLoading} />
          <CoachInsightCard insight={insight} title="Coach analysis" askPrompt={`Analyse my activity "${row.name ?? "latest activity"}" on ${row.startDateLocal?.slice(0, 10) ?? "that day"}.`} />
        </div>
      </div>

      <Stagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" inView>
        {performance.length > 0 ? (
          <StaggerItem>
            <DetailList title="Performance" rows={performance} />
          </StaggerItem>
        ) : null}
        {conditions.length > 0 ? (
          <StaggerItem>
            <DetailList title="Conditions and effort" rows={conditions} />
          </StaggerItem>
        ) : null}
        <StaggerItem>
          <DetailList
            title="Record"
            rows={rowsFrom([
              ["Start time (UTC)", formatInstant(row.startDate)],
              ["Strava activity", row.stravaActivityId],
            ])}
          />
        </StaggerItem>
      </Stagger>

      {mode === "live" ? (
        <a
          href={`https://www.strava.com/activities/${row.stravaActivityId}`}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-strava/50 hover:text-foreground"
        >
          <Zap className="size-3.5 text-strava" aria-hidden="true" />
          View on Strava
          <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}
