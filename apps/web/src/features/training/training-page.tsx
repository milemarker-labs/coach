import { Flame, Gauge, HeartPulse, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { makeDelta } from "@/components/common/delta.tsx";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { addDays } from "@/features/analytics/calculations/dates.ts";
import { dailyLoad, formStatus } from "@/features/analytics/calculations/load.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { TrainingLoadChart } from "@/features/analytics/charts/training-load-chart.tsx";
import { useTrainingAnalytics } from "@/features/analytics/use-training-analytics.ts";
import { CoachInsightCard } from "@/features/coach/coach-insight-card.tsx";
import { useCoachInsight } from "@/features/coach/use-coach-insight.ts";
import { DirectionsList } from "@/features/score/directions-list.tsx";
import { MarkerPanel } from "@/features/score/marker-hero.tsx";
import { TodayCallCard } from "@/features/score/today-call.tsx";
import { useMarker } from "@/features/score/use-marker.ts";
import { TrainingFocusCard } from "./training-focus-card.tsx";

export function TrainingPage() {
  const analytics = useTrainingAnalytics();
  const { marker, isLoading: markerLoading } = useMarker();
  const insight = useCoachInsight({ kind: "long-term" });
  const { fitnessSummary, fitness } = analytics;
  const status = analytics.isLoading ? "loading" : analytics.isError ? "unavailable" : "ready";
  const form = fitnessSummary ? formStatus(fitnessSummary.current.form) : null;
  const load28 = useMemo(() => dailyLoad(analytics.activities, addDays(analytics.today, -27), analytics.today), [analytics.activities, analytics.today]);
  const metricsLoading = analytics.isLoading;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="The long view" title="Training" description="Your Marker in full, the load behind it, and where the next weeks should go." />
      <DemoBanner />

      {markerLoading || !marker ? (
        analytics.isError ? null : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" role="status" aria-label="Loading your score">
            <Skeleton className="h-[30rem] rounded-3xl" />
            <Skeleton className="h-[30rem] rounded-2xl" />
          </div>
        )
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <MarkerPanel marker={marker} detailed />
          <div className="flex flex-col gap-4">
            <TodayCallCard call={marker.call} />
            <div className="rounded-2xl border border-border bg-card/70 p-2">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Directions</p>
              <DirectionsList directions={marker.directions} />
            </div>
          </div>
        </div>
      )}

      <MetricGroup label="Fitness, fatigue and form">
        <MetricCard
          label="Fitness (CTL)"
          icon={TrendingUp}
          loading={metricsLoading}
          value={fitnessSummary ? String(Math.round(fitnessSummary.current.fitness)) : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.fitnessDelta, { goodWhen: "up" }) : null}
          hint="42-day load average"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="Fatigue (ATL)"
          icon={HeartPulse}
          accent="pulse"
          loading={metricsLoading}
          value={fitnessSummary ? String(Math.round(fitnessSummary.current.fatigue)) : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.fatigueDelta, { goodWhen: "none" }) : null}
          hint="7-day load average"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="Form (TSB)"
          icon={Gauge}
          accent="flow"
          loading={metricsLoading}
          value={fitnessSummary ? `${Math.round(fitnessSummary.current.form) > 0 ? "+" : ""}${Math.round(fitnessSummary.current.form)}` : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.formDelta, { goodWhen: "none" }) : null}
          aside={form ? <Badge tone={form.tone}>{form.label}</Badge> : null}
          hint="Fitness minus fatigue"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="28-day load"
          icon={Flame}
          accent="trail"
          loading={metricsLoading}
          unit="pts"
          value={analytics.isError ? null : String(Math.round(load28.reduce((sum, day) => sum + day.load, 0)))}
          hint="Total over the last 28 days"
        />
      </MetricGroup>

      <Stagger inView className="space-y-6">
        <StaggerItem>
          <FitnessFormChart data={fitness ?? []} status={status} height={300} />
        </StaggerItem>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-12">
          <StaggerItem className="xl:col-span-7">
            <TrainingLoadChart data={load28} status={status} description="Daily load, last 28 days" />
          </StaggerItem>
          <StaggerItem className="space-y-6 xl:col-span-5">
            <TrainingFocusCard activities={analytics.activities} today={analytics.today} fitness={fitnessSummary ?? null} loading={analytics.isLoading} />
            <CoachInsightCard insight={insight} title="Coach's long view" askPrompt="What patterns do you see in my last 8 weeks of training?" />
          </StaggerItem>
        </div>
      </Stagger>
    </div>
  );
}
