import { Activity as ActivityIcon, Clock, Mountain, Route } from "lucide-react";
import { Link } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useDataMode } from "@/data/mode.ts";
import { ActivityCard } from "@/features/activities/activity-card.tsx";
import { baselineWeeklyDistance, percentChange } from "@/features/analytics/calculations/volume.ts";
import { formStatus } from "@/features/analytics/calculations/load.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { TrainingLoadChart } from "@/features/analytics/charts/training-load-chart.tsx";
import { WeeklyMileageChart } from "@/features/analytics/charts/volume-chart.tsx";
import { useTrainingAnalytics } from "@/features/analytics/use-training-analytics.ts";
import { CoachEntryCard } from "@/features/coach/coach-entry-card.tsx";
import { CoachInsightCard } from "@/features/coach/coach-insight-card.tsx";
import { useCoachInsight } from "@/features/coach/use-coach-insight.ts";
import { SyncStatus } from "@/features/sync/sync-status.tsx";
import { TrainingFocusCard } from "@/features/training/training-focus-card.tsx";
import { formatHoursMinutes } from "@/lib/format.ts";

function greeting(now = new Date()): string {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function signedPercent(current: number, previous: number, goodWhen: "up" | "down" | "none" = "up") {
  const change = percentChange(current, previous);
  return change == null ? null : makeDelta(change, { suffix: "%", goodWhen });
}

export function DashboardPage() {
  const { auth } = useDataMode();
  const analytics = useTrainingAnalytics();
  const insight = useCoachInsight({ kind: "dashboard" });
  const loading = analytics.isLoading;
  const failed = analytics.isError;
  const { comparison, fitnessSummary, load7, fitness, weekly, observations } = analytics;
  const chartStatus = loading ? "loading" : failed ? "unavailable" : "ready";
  const metricsLoading = loading || (!failed && !comparison);
  const name = auth?.displayName?.split(" ")[0];

  const baseline = baselineWeeklyDistance(analytics.activities, analytics.today);
  const recent = [...analytics.activities].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)).slice(0, 5);
  const status = fitnessSummary ? formStatus(fitnessSummary.current.form) : null;

  const km = (meters: number) => (meters / 1000).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        description="Here is your training overview and coaching insight."
        actions={<SyncStatus />}
      />
      <DemoBanner />

      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 xl:grid-cols-12">
        {/* Left column on desktop */}
        <div className="contents xl:col-span-8 xl:flex xl:flex-col xl:gap-6">
          <div className="order-1 md:col-span-2 xl:order-none">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Last 7 days, compared with the 7 days before</p>
            <MetricGroup label="Weekly overview">
              <MetricCard
                label="Activities"
                icon={ActivityIcon}
                loading={metricsLoading}
                value={comparison && !failed ? String(comparison.current.count) : null}
                delta={comparison && comparison.previous.count > 0 ? makeDelta(comparison.current.count - comparison.previous.count, { goodWhen: "none" }) : null}
                hint={comparison ? `${comparison.previous.count} the week before` : undefined}
              />
              <MetricCard
                label="Distance"
                icon={Route}
                loading={metricsLoading}
                unit="km"
                value={comparison && !failed ? km(comparison.current.distance) : null}
                delta={comparison ? signedPercent(comparison.current.distance, comparison.previous.distance) : null}
                hint={comparison ? `${km(comparison.previous.distance)} km the week before` : undefined}
              />
              <MetricCard
                label="Moving time"
                icon={Clock}
                loading={metricsLoading}
                value={comparison && !failed ? formatHoursMinutes(comparison.current.movingTime) : null}
                delta={comparison ? signedPercent(comparison.current.movingTime, comparison.previous.movingTime) : null}
                hint={comparison ? `${formatHoursMinutes(comparison.previous.movingTime)} the week before` : undefined}
              />
              <MetricCard
                label="Elevation gain"
                icon={Mountain}
                loading={metricsLoading}
                unit="m"
                value={comparison && !failed ? Math.round(comparison.current.elevation).toLocaleString() : null}
                delta={comparison ? signedPercent(comparison.current.elevation, comparison.previous.elevation) : null}
                hint={comparison ? `${Math.round(comparison.previous.elevation).toLocaleString()} m the week before` : undefined}
              />
            </MetricGroup>
          </div>

          <TrainingLoadChart
            data={load7 ?? []}
            status={chartStatus}
            description="Daily load, last 7 days"
            className="order-3 md:order-2 md:col-span-2 xl:order-none"
          />

          <div className="order-5 md:col-span-2 xl:order-none">
            <MetricGroup label="Fitness, fatigue and form">
              <MetricCard
                label="Fitness (CTL)"
                loading={metricsLoading}
                value={fitnessSummary && !failed ? String(Math.round(fitnessSummary.current.fitness)) : null}
                delta={fitnessSummary ? makeDelta(fitnessSummary.fitnessDelta, { goodWhen: "up" }) : null}
                hint="Change in 7 days"
                unavailableHint="Needs several weeks of data"
              />
              <MetricCard
                label="Fatigue (ATL)"
                loading={metricsLoading}
                value={fitnessSummary && !failed ? String(Math.round(fitnessSummary.current.fatigue)) : null}
                delta={fitnessSummary ? makeDelta(fitnessSummary.fatigueDelta, { goodWhen: "none" }) : null}
                hint="Change in 7 days"
                unavailableHint="Needs several weeks of data"
              />
              <MetricCard
                label="Form (TSB)"
                loading={metricsLoading}
                value={fitnessSummary && !failed ? `${Math.round(fitnessSummary.current.form) > 0 ? "+" : ""}${Math.round(fitnessSummary.current.form)}` : null}
                delta={fitnessSummary ? makeDelta(fitnessSummary.formDelta, { goodWhen: "none" }) : null}
                aside={status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
                hint="Fitness minus fatigue"
                unavailableHint="Needs several weeks of data"
              />
              <MetricCard
                label="Weekly volume"
                icon={Route}
                loading={metricsLoading}
                unit="km"
                value={baseline != null && !failed ? km(baseline) : null}
                delta={comparison && baseline != null ? signedPercent(comparison.current.distance, baseline) : null}
                hint={baseline != null && comparison ? `4-week average. Last 7 days: ${km(comparison.current.distance)} km` : undefined}
                unavailableHint="No earlier weeks to average"
              />
            </MetricGroup>
          </div>

          <FitnessFormChart data={fitness ?? []} status={chartStatus} className="order-6 md:col-span-2 xl:order-none" />

          <WeeklyMileageChart data={weekly ?? []} status={chartStatus} className="order-7 md:col-span-2 xl:order-none" />
        </div>

        {/* Right column on desktop */}
        <div className="contents xl:col-span-4 xl:flex xl:flex-col xl:gap-6">
          <CoachInsightCard
            insight={insight}
            stats={observations}
            statsLoading={loading}
            askPrompt="Walk me through how my last 7 days compare with the previous 7, and what I should do next."
            className="order-2 md:order-3 md:col-span-1 xl:order-none"
          />

          <Card className="order-4 md:col-span-1 xl:order-none">
            <CardHeader>
              <CardTitle>Recent activities</CardTitle>
              <Link to="/activities" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="mt-2 px-2">
              {loading ? (
                <ListSkeleton rows={5} className="px-3" />
              ) : failed ? (
                <EmptyState tone="danger" title="Activities could not be loaded" description="Check that the Coach API is running." />
              ) : recent.length === 0 ? (
                <EmptyState
                  title="No activities yet"
                  description="Sync Strava or import your history to fill the dashboard."
                  action={
                    <Link to="/sync" className="text-xs font-medium text-primary hover:underline">
                      Go to Data & Sync
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((activity) => (
                    <li key={activity.id}>
                      <ActivityCard activity={activity} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <TrainingFocusCard
            activities={analytics.activities}
            today={analytics.today}
            fitness={fitnessSummary ?? null}
            loading={loading}
            className="order-8 md:col-span-1 xl:order-none"
          />
          <CoachEntryCard className="order-9 md:col-span-1 xl:order-none" />
        </div>
      </div>
    </div>
  );
}
