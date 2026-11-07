import { effortKind, sportLabel } from "@coach/shared";
import { useMemo, useState } from "react";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Segmented } from "@/components/ui/segmented.tsx";
import { Select } from "@/components/ui/select.tsx";
import { useActivityHistory } from "@/data/queries.ts";
import { activitySport } from "@/features/activities/activity-meta.tsx";
import { addDays, todayKey } from "@/features/analytics/calculations/dates.ts";
import { effortSeries, heartRateSeries } from "@/features/analytics/calculations/effort.ts";
import { bucketVolume, inRange } from "@/features/analytics/calculations/volume.ts";
import { HeartRateChart } from "@/features/analytics/charts/heart-rate-chart.tsx";
import { PaceChart } from "@/features/analytics/charts/pace-chart.tsx";
import { ElevationChart, MonthlyMileageChart, WeeklyMileageChart } from "@/features/analytics/charts/volume-chart.tsx";

type RangeKey = "90" | "180" | "365";

const rangeOptions = [
  { value: "90" as const, label: "3 months" },
  { value: "180" as const, label: "6 months" },
  { value: "365" as const, label: "12 months" },
];

const ALL = "all";

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

    // Pace needs one sport. With "All sports" it follows the sport trained most that has a pace or speed.
    const paceSport = chosenSport !== ALL ? chosenSport : (sports.find(([sport]) => effortKind(sport) !== "duration")?.[0] ?? null);
    return {
      sports,
      weekly: bucketVolume(scoped, "week", from, today),
      monthly: bucketVolume(scoped, "month", addDays(today, -(Math.max(days, 180) - 1)), today),
      paceSport,
      effort: paceSport ? effortSeries(inWindow, paceSport) : null,
      heartRate: heartRateSeries(inWindow, chosenSport === ALL ? null : chosenSport),
    };
  }, [history.data, from, today, chosenSport, days]);

  const status = history.isLoading ? "loading" : history.isError ? "unavailable" : "ready";
  const scopeLabel = chosenSport === ALL ? "All sports" : sportLabel(chosenSport);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="How your volume, pace, heart rate and climbing are changing."
        actions={
          <>
            <div className="space-y-1.5">
              <Label htmlFor="insights-sport">Sport</Label>
              <div className="w-44">
                <Select id="insights-sport" value={chosenSport} onChange={(event) => setChosenSport(event.target.value)}>
                  <option value={ALL}>All sports</option>
                  {analysis.sports.map(([sport, count]) => (
                    <option key={sport} value={sport}>
                      {sportLabel(sport)} ({count})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground">Range</span>
              <div>
                <Segmented label="Range" options={rangeOptions} value={range} onChange={setRange} className="h-9" />
              </div>
            </div>
          </>
        }
      />
      <DemoBanner />

      <div className="grid gap-6 xl:grid-cols-2">
        <WeeklyMileageChart data={analysis.weekly} status={status} />
        <MonthlyMileageChart data={analysis.monthly} status={status} />
        <PaceChart series={analysis.effort} status={status} sportLabel={analysis.paceSport ? sportLabel(analysis.paceSport) : undefined} />
        <HeartRateChart points={analysis.heartRate} status={status} scope={scopeLabel} />
        <ElevationChart data={analysis.weekly} status={status} className="xl:col-span-2" />
      </div>
    </div>
  );
}
