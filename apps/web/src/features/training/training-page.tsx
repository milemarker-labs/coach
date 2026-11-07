import { makeDelta } from "@/components/common/delta.tsx";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { addDays } from "@/features/analytics/calculations/dates.ts";
import { dailyLoad, formStatus } from "@/features/analytics/calculations/load.ts";
import { FitnessFormChart } from "@/features/analytics/charts/fitness-form-chart.tsx";
import { TrainingLoadChart } from "@/features/analytics/charts/training-load-chart.tsx";
import { useTrainingAnalytics } from "@/features/analytics/use-training-analytics.ts";
import { CoachInsightCard } from "@/features/coach/coach-insight-card.tsx";
import { useCoachInsight } from "@/features/coach/use-coach-insight.ts";
import { TrainingFocusCard } from "./training-focus-card.tsx";
import { useMemo } from "react";

export function TrainingPage() {
  const analytics = useTrainingAnalytics();
  const insight = useCoachInsight({ kind: "long-term" });
  const { fitnessSummary, fitness } = analytics;
  const status = analytics.isLoading ? "loading" : analytics.isError ? "unavailable" : "ready";
  const form = fitnessSummary ? formStatus(fitnessSummary.current.form) : null;
  const load28 = useMemo(() => dailyLoad(analytics.activities, addDays(analytics.today, -27), analytics.today), [analytics.activities, analytics.today]);
  const metricsLoading = analytics.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Training" description="Fitness, fatigue and form built from your load, with the long view of how training is going." />
      <DemoBanner />

      <MetricGroup label="Fitness, fatigue and form">
        <MetricCard
          label="Fitness (CTL)"
          loading={metricsLoading}
          value={fitnessSummary ? String(Math.round(fitnessSummary.current.fitness)) : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.fitnessDelta, { goodWhen: "up" }) : null}
          hint="42-day load average"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="Fatigue (ATL)"
          loading={metricsLoading}
          value={fitnessSummary ? String(Math.round(fitnessSummary.current.fatigue)) : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.fatigueDelta, { goodWhen: "none" }) : null}
          hint="7-day load average"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="Form (TSB)"
          loading={metricsLoading}
          value={fitnessSummary ? `${Math.round(fitnessSummary.current.form) > 0 ? "+" : ""}${Math.round(fitnessSummary.current.form)}` : null}
          delta={fitnessSummary ? makeDelta(fitnessSummary.formDelta, { goodWhen: "none" }) : null}
          aside={form ? <Badge tone={form.tone}>{form.label}</Badge> : null}
          hint="Fitness minus fatigue"
          unavailableHint="Needs several weeks of data"
        />
        <MetricCard
          label="28-day load"
          loading={metricsLoading}
          unit="pts"
          value={analytics.isError ? null : String(Math.round(load28.reduce((sum, day) => sum + day.load, 0)))}
          hint="Total over the last 28 days"
        />
      </MetricGroup>

      <FitnessFormChart data={fitness ?? []} status={status} height={300} />

      <div className="grid gap-6 xl:grid-cols-12">
        <TrainingLoadChart data={load28} status={status} description="Daily load, last 28 days" className="xl:col-span-7" />
        <div className="space-y-6 xl:col-span-5">
          <TrainingFocusCard activities={analytics.activities} today={analytics.today} fitness={fitnessSummary ?? null} loading={analytics.isLoading} />
          <CoachInsightCard insight={insight} title="Coach's long view" askPrompt="What patterns do you see in my last 8 weeks of training?" />
        </div>
      </div>
    </div>
  );
}
