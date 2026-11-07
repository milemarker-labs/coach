import { ArrowUpRight, Calculator, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Observation } from "@/features/analytics/calculations/observations.ts";
import { cn } from "@/lib/utils.ts";
import type { useCoachInsight } from "./use-coach-insight.ts";

const toneClass = { positive: "text-success", negative: "text-danger", neutral: "text-platinum" } as const;

/**
 * Coach's Take. Two clearly separate parts:
 *  - the AI interpretation, labelled as model output
 *  - plain calculations over stored activities, labelled as calculated
 */
export function CoachInsightCard({
  insight,
  stats,
  statsLoading = false,
  askPrompt,
  title = "Coach's Take",
  className,
}: {
  insight: ReturnType<typeof useCoachInsight>;
  stats?: Observation[];
  statsLoading?: boolean;
  /** Pre-fills the chat when the athlete follows the link below. */
  askPrompt?: string;
  title?: string;
  className?: string;
}) {
  const ai = insight.insight;
  return (
    <Card className={cn("flex flex-col border-primary/25 hover:border-primary/40", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          {title}
        </h2>
        <Badge tone="bronze">AI-generated</Badge>
      </div>

      <div className="space-y-3 px-5 pt-3 pb-4">
        {insight.loading ? (
          <div className="space-y-2" role="status" aria-label="Loading interpretation">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
        ) : ai ? (
          <>
            <p className="text-[15px] leading-snug font-semibold text-platinum">{ai.headline}</p>
            <p className="text-sm text-muted-foreground">{ai.summary}</p>
            {ai.concerns.length > 0 ? <p className="text-sm text-warning">{ai.concerns.join(" ")}</p> : null}
            {ai.recommendation ? (
              <div className="rounded-lg bg-primary-subtle px-3 py-2.5">
                <p className="text-sm font-medium text-platinum">{ai.recommendation.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{ai.recommendation.description}</p>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">Confidence: {ai.confidence}. Interpretations can be wrong; check them against the numbers.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {!insight.enabled ? "The AI interpretation needs a connected Strava account." : (insight.error ?? "Not enough stored training to interpret yet.")}
          </p>
        )}
      </div>

      {stats ? (
        <div className="mt-auto border-t border-border px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calculator className="size-3.5" aria-hidden="true" />
              Calculated from your activities
            </p>
          </div>
          {statsLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading statistics">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : stats.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activities in the last two weeks to compare.</p>
          ) : (
            <dl className="space-y-1.5">
              {stats.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-3 text-sm" title={item.detail}>
                  <dt className="truncate text-muted-foreground">{item.label}</dt>
                  <dd className={cn("num shrink-0 font-semibold", toneClass[item.tone])}>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ) : null}

      {askPrompt ? (
        <Link
          to="/coach"
          state={{ prompt: askPrompt }}
          className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs font-medium text-primary transition-colors hover:bg-primary-subtle"
        >
          Ask Coach about this
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </Card>
  );
}
