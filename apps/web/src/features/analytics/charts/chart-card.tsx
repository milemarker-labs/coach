import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <CardHeader className="flex-wrap">
        <div className="min-w-0 space-y-0.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="mt-3 flex flex-1 flex-col gap-3">
        {headline && status === "ready" ? <div>{headline}</div> : null}
        <div style={{ height }} className="w-full min-w-0">
          {status === "loading" ? <ChartSkeleton height={height} /> : null}
          {status === "ready" ? children : null}
          {status === "empty" || status === "unavailable" ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border">
              <EmptyState
                icon={emptyIcon}
                title={status === "unavailable" ? "Not available" : emptyTitle}
                description={emptyDescription}
              />
            </div>
          ) : null}
        </div>
        {footer ? <div className="text-xs text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
