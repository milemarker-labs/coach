import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { ChartSkeleton } from "@/components/common/loading-skeleton.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

export type ChartStatus = "ready" | "loading" | "empty" | "unavailable";

export interface ChartCardProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** A headline number shown above the chart. */
  headline?: ReactNode;
  status: ChartStatus;
  /** Chart height in pixels. The loading and empty states keep the same height. */
  height?: number;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyIcon?: LucideIcon;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Shared frame for every chart: title, optional controls, and consistent loading/empty/unavailable states. */
export function ChartCard({
  title,
  description,
  actions,
  headline,
  status,
  height = 240,
  emptyTitle = "No data in this range",
  emptyDescription,
  emptyIcon = BarChart3,
  footer,
  className,
  children,
}: ChartCardProps) {
  const reduce = useReducedMotion();
  return (
    <Card className={cn("group/chart relative flex min-w-0 flex-col overflow-hidden", className)}>
      {/* A hairline of light along the top edge that brightens on hover. */}
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-40 transition-opacity duration-500 group-hover/chart:opacity-100"
        aria-hidden="true"
      />
      <CardHeader className="flex-wrap">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_rgb(var(--brand-rgb)/0.25)]" aria-hidden="true" />
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="mt-3 flex flex-1 flex-col gap-3">
        {headline && status === "ready" ? (
          <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {headline}
          </motion.div>
        ) : null}
        <div style={{ height }} className="w-full min-w-0">
          {status === "loading" ? <ChartSkeleton height={height} /> : null}
          {status === "ready" ? (
            <motion.div className="size-full" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {children}
            </motion.div>
          ) : null}
          {status === "empty" || status === "unavailable" ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-dots">
              <EmptyState icon={emptyIcon} title={status === "unavailable" ? "Not available" : emptyTitle} description={emptyDescription} />
            </div>
          ) : null}
        </div>
        {footer ? <div className="text-xs leading-relaxed text-faint">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
