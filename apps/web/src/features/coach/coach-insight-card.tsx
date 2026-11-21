import { AlertTriangle, ArrowUpRight, Calculator, Target } from "lucide-react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { AnimatedValue } from "@/components/motion/animated-number.tsx";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Observation } from "@/features/analytics/calculations/observations.ts";
import { cn } from "@/lib/utils.ts";
import { CoachOrb } from "./coach-orb.tsx";
import type { useCoachInsight } from "./use-coach-insight.ts";

const toneClass = { positive: "text-success", negative: "text-danger", neutral: "text-foreground" } as const;

/** A 1px border drawn with a mask, so its moving spectrum shows through only at the edge. */
const borderMask: CSSProperties = {
  padding: 1,
  backgroundImage: "linear-gradient(90deg, var(--pulse), var(--flow), var(--brand), var(--flow), var(--pulse))",
  backgroundSize: "200% 100%",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

const LEADING_NUMBER = /^([+\-−]?\d[\d,]*(?:\.\d+)?)(.*)$/;

/** Counts up the number at the front of a calculated value ("+18%", "12.4 km") and keeps the rest as text. */
function StatValue({ text }: { text: string }) {
  const match = LEADING_NUMBER.exec(text);
  if (!match) return <>{text}</>;
  return (
    <>
      <AnimatedValue text={match[1] ?? ""} />
      {match[2]}
    </>
  );
}

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
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold tracking-tight">
          <CoachOrb size={22} active={insight.loading} />
          {title}
        </h2>
        <Badge tone="pulse">AI-generated</Badge>
      </div>

      <div className="px-4 pt-4 pb-4">
        <div className="relative min-w-0 rounded-xl bg-[linear-gradient(160deg,rgb(var(--pulse-rgb)/0.09),rgb(var(--flow-rgb)/0.03)_45%,transparent)] p-4 [overflow-wrap:anywhere]">
          <span className="animate-gradient-pan pointer-events-none absolute inset-0 rounded-xl opacity-50" style={borderMask} aria-hidden="true" />
          {insight.loading ? (
            <div className="space-y-2" role="status" aria-label="Loading interpretation">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
            </div>
          ) : ai ? (
            <Stagger className="relative space-y-3" gap={0.08}>
              <StaggerItem>
                <p className="font-display text-base leading-snug font-semibold text-foreground">{ai.headline}</p>
              </StaggerItem>
              <StaggerItem>
                <p className="text-sm leading-relaxed text-muted-foreground">{ai.summary}</p>
              </StaggerItem>
              {ai.concerns.length > 0 ? (
                <StaggerItem>
                  <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {ai.concerns.join(" ")}
                  </p>
                </StaggerItem>
              ) : null}
              {ai.recommendation ? (
                <StaggerItem>
                  <div className="flex gap-3 rounded-lg bg-primary-subtle px-3 py-2.5 ring-1 ring-primary/15 ring-inset">
                    <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ai.recommendation.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{ai.recommendation.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ) : null}
              <StaggerItem>
                <p className="text-[11px] text-faint">Confidence: {ai.confidence}. Interpretations can be wrong; check them against the numbers.</p>
              </StaggerItem>
            </Stagger>
          ) : (
            <p className="relative text-sm text-muted-foreground">
              {!insight.enabled ? "The AI interpretation needs a connected Strava account." : (insight.error ?? "Not enough stored training to interpret yet.")}
            </p>
          )}
        </div>
      </div>

      {stats ? (
        <div className="mt-auto border-t border-border px-5 py-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            <Calculator className="size-3.5" aria-hidden="true" />
            Calculated from your activities
          </p>
          {statsLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading statistics">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : stats.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activities in the last two weeks to compare.</p>
          ) : (
            <Stagger as="dl" className="space-y-2" gap={0.06} delay={0.1}>
              {stats.map((item) => (
                <StaggerItem key={item.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm" title={item.detail}>
                    <dt className="truncate text-muted-foreground">{item.label}</dt>
                    <dd className={cn("num shrink-0 font-display font-semibold", toneClass[item.tone])}>
                      <StatValue text={item.value} />
                    </dd>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      ) : null}

      {askPrompt ? (
        <Link
          to="/coach"
          state={{ prompt: askPrompt }}
          className="group flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-subtle"
        >
          Ask Coach about this
          <motion.span className="inline-flex" whileHover={{ x: 2, y: -2 }}>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </motion.span>
        </Link>
      ) : null}
    </Card>
  );
}
