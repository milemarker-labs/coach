import { Activity as ActivityIcon, ArrowRight, Clock, Mountain, Route } from "lucide-react";
import { Link } from "react-router";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { makeDelta } from "@/components/common/delta.tsx";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useDataMode } from "@/data/mode.ts";
import { ActivityCard } from "@/features/activities/activity-card.tsx";
import { percentChange } from "@/features/analytics/calculations/volume.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { TrainingLoadChart } from "@/features/analytics/charts/training-load-chart.tsx";
import { WeeklyMileageChart } from "@/features/analytics/charts/volume-chart.tsx";
import { useTrainingAnalytics } from "@/features/analytics/use-training-analytics.ts";
import { CoachEntryCard } from "@/features/coach/coach-entry-card.tsx";
import { CoachInsightCard } from "@/features/coach/coach-insight-card.tsx";
import { useCoachInsight } from "@/features/coach/use-coach-insight.ts";
import { MarkerHero } from "@/features/score/marker-hero.tsx";
import { useMarker } from "@/features/score/use-marker.ts";
import { SyncStatus } from "@/features/sync/sync-status.tsx";
import { TrainingFocusCard } from "@/features/training/training-focus-card.tsx";
import { formatHoursMinutes } from "@/lib/format.ts";

function greeting(now = new Date()): string {
  const hour = now.getHours();
  return hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function signedPercent(current: number, previous: number, goodWhen: "up" | "down" | "none" = "up") {
  const change = percentChange(current, previous);
  return change == null ? null : makeDelta(change, { suffix: "%", goodWhen });
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        <span className="h-px w-6 bg-gradient-to-r from-primary to-transparent" aria-hidden="true" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function DashboardPage() {
  const { auth } = useDataMode();
  const analytics = useTrainingAnalytics();
  const { marker, isLoading: markerLoading } = useMarker();
  const insight = useCoachInsight({ kind: "dashboard" });
  const loading = analytics.isLoading;
  const failed = analytics.isError;
  const { comparison, load7, fitness, weekly, observations } = analytics;
  const chartStatus = loading ? "loading" : failed ? "unavailable" : "ready";
  const metricsLoading = loading || (!failed && !comparison);
  const name = auth?.displayName?.split(" ")[0];
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const recent = [...analytics.activities].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)).slice(0, 5);
  const km = (meters: number) => (meters / 1000).toFixed(1);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={today}
        title={
          <>
            {greeting()}
            {name ? (
              <>
                , <span className="text-brand-gradient">{name}</span>
              </>
            ) : null}
          </>
        }
        description="Where your fitness stands, what to do today, and how the week is going."
        actions={<SyncStatus />}
      />
      <DemoBanner />

      {failed ? null : <MarkerHero marker={marker} loading={markerLoading} />}

      <section aria-labelledby="week-heading">
        <SectionTitle>
          <span id="week-heading">Last 7 days vs the 7 before</span>
        </SectionTitle>
        <MetricGroup label="Weekly overview">
          <MetricCard
            label="Activities"
            icon={ActivityIcon}
            accent="pulse"
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
            accent="flow"
            loading={metricsLoading}
            value={comparison && !failed ? formatHoursMinutes(comparison.current.movingTime) : null}
            delta={comparison ? signedPercent(comparison.current.movingTime, comparison.previous.movingTime) : null}
            hint={comparison ? `${formatHoursMinutes(comparison.previous.movingTime)} the week before` : undefined}
          />
          <MetricCard
            label="Elevation gain"
            icon={Mountain}
            accent="trail"
            loading={metricsLoading}
            unit="m"
            value={comparison && !failed ? Math.round(comparison.current.elevation).toLocaleString() : null}
            delta={comparison ? signedPercent(comparison.current.elevation, comparison.previous.elevation) : null}
            hint={comparison ? `${Math.round(comparison.previous.elevation).toLocaleString()} m the week before` : undefined}
          />
        </MetricGroup>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-12">
        <Stagger inView className="flex flex-col gap-6 xl:col-span-8">
          <StaggerItem>
            <TrainingLoadChart data={load7 ?? []} status={chartStatus} description="Daily load, last 7 days" />
          </StaggerItem>
          <StaggerItem>
            <FitnessFormChart data={fitness ?? []} status={chartStatus} />
          </StaggerItem>
          <StaggerItem>
            <WeeklyMileageChart data={weekly ?? []} status={chartStatus} />
          </StaggerItem>
        </Stagger>

        <Stagger inView delay={0.1} className="flex flex-col gap-6 xl:col-span-4">
          <StaggerItem>
            <CoachInsightCard
              insight={insight}
              stats={observations}
              statsLoading={loading}
              askPrompt="Walk me through how my last 7 days compare with the previous 7, and what I should do next."
            />
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Recent sessions</CardTitle>
                <Link to="/activities" className="group inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  View all
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
                      <Link to="/sync" className="text-xs font-semibold text-primary hover:underline">
                        Go to Data & Sync
                      </Link>
                    }
                  />
                ) : (
                  <Stagger as="ul" gap={0.05} className="space-y-0.5">
                    {recent.map((activity) => (
                      <StaggerItem as="li" key={activity.id}>
                        <ActivityCard activity={activity} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <TrainingFocusCard activities={analytics.activities} today={analytics.today} fitness={analytics.fitnessSummary ?? null} loading={loading} />
          </StaggerItem>
          <StaggerItem>
            <CoachEntryCard />
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  );
}
