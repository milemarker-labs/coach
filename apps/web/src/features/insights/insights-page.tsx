import { effortKind, sportLabel } from "@coach/shared";
import { Activity, Clock, HeartPulse, Mountain, Route, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Segmented } from "@/components/ui/segmented.tsx";
import { useActivityHistory } from "@/data/queries.ts";
import { activitySport } from "@/features/activities/activity-meta.tsx";
import { SportChips } from "@/features/activities/sport-chips.tsx";
import { addDays, todayKey } from "@/features/analytics/calculations/dates.ts";
import { effortSeries, heartRateSeries } from "@/features/analytics/calculations/effort.ts";
import { bucketVolume, inRange, summarize } from "@/features/analytics/calculations/volume.ts";
import { HeartRateChart } from "@/features/analytics/charts/heart-rate-chart.tsx";
import { PaceChart } from "@/features/analytics/charts/pace-chart.tsx";
import { ElevationChart, MonthlyMileageChart, WeeklyMileageChart } from "@/features/analytics/charts/volume-chart.tsx";
import { cn } from "@/lib/utils.ts";

type RangeKey = "90" | "180" | "365";

const rangeOptions = [
  { value: "90" as const, label: "3 months" },
  { value: "180" as const, label: "6 months" },
  { value: "365" as const, label: "12 months" },
];

const ALL = "all";

interface SummaryTile {
  label: string;
  icon: LucideIcon;
  accent: string;
  value: number | null;
  decimals?: number;
  unit?: string;
  missing?: string;
}

/** The range at a glance: totals that count up whenever the range or sport changes. */
function SummaryStrip({ tiles, loading }: { tiles: SummaryTile[]; loading: boolean }) {
  return (
    <Stagger className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0" gap={0.05}>
      {tiles.map((tile) => (
        <StaggerItem key={tile.label} className="min-w-[9.5rem] shrink-0 snap-start md:min-w-0">
          <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card/70 p-4 transition-colors hover:border-border-hover">
            <div className={cn("pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60", tile.accent)} aria-hidden="true" />
            <p className="relative flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <tile.icon className="size-3.5" aria-hidden="true" />
              {tile.label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : tile.value == null ? (
              <p className="relative mt-1 font-display text-2xl font-semibold text-faint" title={tile.missing}>
                —
              </p>
            ) : (
              <p className="relative mt-1 flex items-baseline gap-1">
                <AnimatedNumber value={tile.value} decimals={tile.decimals ?? 0} className="font-display text-[28px] leading-9 font-semibold tracking-tight" />
                {tile.unit ? <span className="text-sm text-muted-foreground">{tile.unit}</span> : null}
              </p>
            )}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function InsightsPage() {
  const history = useActivityHistory();
  const [range, setRange] = useState<RangeKey>("180");
  const [chosenSport, setChosenSport] = useState<string>(ALL);
  const today = todayKey();
  const days = Number(range);
  const from = addDays(today, -(days - 1));

  const analysis = useMemo(() => {
    const all = history.data ?? [];
    const inWindow = inRange(all, from, today);
    const counts = new Map<string, number>();
    for (const activity of inWindow) counts.set(activitySport(activity), (counts.get(activitySport(activity)) ?? 0) + 1);
    const sports = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const scoped = chosenSport === ALL ? inWindow : inWindow.filter((activity) => activitySport(activity) === chosenSport);
    const withHr = scoped.filter((activity) => (activity.averageHeartrate ?? 0) > 0);

    // Pace needs one sport. With "All sports" it follows the sport trained most that has a pace or speed.
    const paceSport = chosenSport !== ALL ? chosenSport : (sports.find(([sport]) => effortKind(sport) !== "duration")?.[0] ?? null);
    return {
      sports,
      totals: summarize(scoped),
      averageHeartrate: withHr.length > 0 ? withHr.reduce((sum, activity) => sum + (activity.averageHeartrate ?? 0), 0) / withHr.length : null,
      weekly: bucketVolume(scoped, "week", from, today),
      monthly: bucketVolume(scoped, "month", addDays(today, -(Math.max(days, 180) - 1)), today),
      paceSport,
      effort: paceSport ? effortSeries(inWindow, paceSport) : null,
      heartRate: heartRateSeries(inWindow, chosenSport === ALL ? null : chosenSport),
    };
  }, [history.data, from, today, chosenSport, days]);

  const status = history.isLoading ? "loading" : history.isError ? "unavailable" : "ready";
  const scopeLabel = chosenSport === ALL ? "All sports" : sportLabel(chosenSport);
  const { totals } = analysis;
  const summaryLoading = history.isLoading;
  const failed = history.isError;

  const tiles: SummaryTile[] = [
    { label: "Sessions", icon: Activity, accent: "bg-pulse", value: failed ? null : totals.count },
    { label: "Distance", icon: Route, accent: "bg-primary", value: failed ? null : Math.round(totals.distance / 100) / 10, decimals: 1, unit: "km" },
    { label: "Moving time", icon: Clock, accent: "bg-flow", value: failed ? null : Math.round(totals.movingTime / 360) / 10, decimals: 1, unit: "h" },
    { label: "Climbed", icon: Mountain, accent: "bg-trail", value: failed ? null : Math.round(totals.elevation), unit: "m" },
    {
      label: "Avg heart rate",
      icon: HeartPulse,
      accent: "bg-danger",
      value: failed || analysis.averageHeartrate == null ? null : Math.round(analysis.averageHeartrate),
      unit: "bpm",
      missing: "No heart rate recorded in this range",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Long view"
        title="Insights"
        description={`How your volume, pace, heart rate and climbing are changing. ${scopeLabel}, last ${rangeOptions.find((option) => option.value === range)?.label}.`}
        actions={<Segmented label="Range" options={rangeOptions} value={range} onChange={setRange} />}
      />
      <DemoBanner />

      <SportChips
        label="Sport"
        options={analysis.sports.map(([sport, count]) => ({ sport, count }))}
        value={chosenSport}
        allValue={ALL}
        onChange={setChosenSport}
      />

      <SummaryStrip tiles={tiles} loading={summaryLoading} />

      <Stagger key={`${range}-${chosenSport}`} className="grid gap-6 xl:grid-cols-2" inView gap={0.09}>
        <StaggerItem>
          <WeeklyMileageChart data={analysis.weekly} status={status} />
        </StaggerItem>
        <StaggerItem>
          <MonthlyMileageChart data={analysis.monthly} status={status} />
        </StaggerItem>
        <StaggerItem>
          <PaceChart series={analysis.effort} status={status} sportLabel={analysis.paceSport ? sportLabel(analysis.paceSport) : undefined} />
        </StaggerItem>
        <StaggerItem>
          <HeartRateChart points={analysis.heartRate} status={status} scope={scopeLabel} />
        </StaggerItem>
        <StaggerItem className="xl:col-span-2">
          <ElevationChart data={analysis.weekly} status={status} />
        </StaggerItem>
      </Stagger>
    </div>
  );
}
