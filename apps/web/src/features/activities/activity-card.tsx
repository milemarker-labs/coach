import type { ActivitySummary } from "@coach/shared";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { formatActivityDate, formatDistance, formatDuration, formatHeartRate } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { activityEffort, activitySport, activitySportLabel, SportBadge } from "./activity-meta.tsx";

/**
 * One activity as a tappable row. Used for the dashboard's recent list and as the
 * mobile replacement for table rows, so the same facts show in both places.
 */
export function ActivityCard({ activity, showHeartRate = false, className }: { activity: ActivitySummary; showHeartRate?: boolean; className?: string }) {
  const effort = activityEffort(activity);
  return (
    <Link
      to={`/activities/${activity.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-2/60 active:bg-surface-2",
        className,
      )}
    >
      <SportBadge sport={activitySport(activity)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-platinum">{activity.name ?? "Untitled activity"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {activitySportLabel(activity)} · {formatActivityDate(activity.startDateLocal)}
        </p>
      </div>
      <dl className="num flex shrink-0 flex-col items-end gap-0.5 text-right text-xs">
        <dd className="text-sm font-semibold text-platinum">{activity.distance ? formatDistance(activity.distance) : formatDuration(activity.movingTime)}</dd>
        <dd className="text-muted-foreground">
          {[activity.distance ? formatDuration(activity.movingTime) : null, effort.value, showHeartRate && activity.averageHeartrate ? formatHeartRate(activity.averageHeartrate) : null]
            .filter(Boolean)
            .join(" · ")}
        </dd>
      </dl>
      <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
