import { cadenceUnit, type ActivitySummary } from "@coach/shared";
import { Activity, ArrowLeft, Clock, Flame, HeartPulse, Mountain, Route, Zap } from "lucide-react";
import { Link, useParams } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
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
import { formatDuration, formatElevation, formatInstant, formatLocalClock } from "@/lib/format.ts";
import { ActivityComparisonCard } from "./activity-comparison-card.tsx";
import { activityEffort, activitySport, activitySportLabel, SportBadge } from "./activity-meta.tsx";
import { SplitsTable } from "./splits-table.tsx";

type Row = [label: string, value: string];

function DetailList({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <dl className="divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="num text-right font-medium text-platinum">{value}</dd>
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

export function ActivityDetailPage() {
  const { id } = useParams();
  const { mode } = useDataMode();
  const detail = useActivityDetail(id);
  const history = useActivityHistory();
  const insight = useCoachInsight(id ? { kind: "activity", id } : { kind: "dashboard" });

  const back = (
    <Link to="/activities" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-platinum">
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      All activities
    </Link>
  );

  if (detail.isLoading || mode === "loading") {
    return (
      <div className="space-y-6" role="status" aria-label="Loading activity">
        {back}
        <Skeleton className="h-9 w-1/2" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
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
  const sport = activitySport(row);
  const effort = activityEffort(row);
  const load = activityLoad(row);
  const performance = performanceRows(row);
  const conditions = conditionRows(row);
  const heartRateScope = row.averageHeartrate != null ? `${Math.round(row.averageHeartrate)}` : null;

  return (
    <div className="space-y-6">
      {back}
      <header className="flex items-start gap-3">
        <SportBadge sport={sport} className="mt-1 size-11" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">{row.name ?? "Untitled activity"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{activitySportLabel(row)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatLocalClock(row.startDateLocal)}</span>
            {row.trainer ? <Badge>Indoor</Badge> : null}
            {row.commute ? <Badge>Commute</Badge> : null}
          </p>
        </div>
      </header>
      <DemoBanner />

      <MetricGroup label="Activity summary" className="md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Distance" icon={Route} value={row.distance ? (row.distance / 1000).toFixed(row.distance >= 10_000 ? 1 : 2) : null} unit="km" unavailableHint="Not recorded" />
        <MetricCard label="Moving time" icon={Clock} value={row.movingTime != null ? formatDuration(row.movingTime) : null} hint={row.elapsedTime ? `${formatDuration(row.elapsedTime)} elapsed` : undefined} />
        <MetricCard label={effort.label} icon={Activity} value={effort.value} unavailableHint="Not available for this sport" />
        <MetricCard label="Avg heart rate" icon={HeartPulse} value={heartRateScope} unit="bpm" hint={row.maxHeartrate ? `${Math.round(row.maxHeartrate)} bpm max` : undefined} unavailableHint="No heart rate recorded" />
        <MetricCard label="Elevation gain" icon={Mountain} value={row.totalElevationGain ? formatElevation(row.totalElevationGain).replace(" m", "") : null} unit="m" unavailableHint="Not recorded" />
        <MetricCard
          label="Training load"
          icon={Flame}
          value={load ? String(Math.round(load.value)) : null}
          unit="pts"
          hint={load?.basis === "effort" ? "Strava suffer score" : "Estimated from moving time"}
          unavailableHint="No moving time"
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DetailList title="Performance" rows={performance} />
        <DetailList title="Conditions and effort" rows={conditions} />
        <DetailList
          title="Record"
          rows={rowsFrom([
            ["Start time (UTC)", formatInstant(row.startDate)],
            ["Strava activity", row.stravaActivityId],
          ])}
        />
      </div>

      {mode === "live" ? (
        <a
          href={`https://www.strava.com/activities/${row.stravaActivityId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-platinum"
        >
          <Zap className="size-3.5 text-strava" aria-hidden="true" />
          View on Strava
        </a>
      ) : null}
    </div>
  );
}
