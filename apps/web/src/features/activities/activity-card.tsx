import type { ActivitySummary } from "@coach/shared";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { formatActivityDate, formatDistance, formatDuration, formatHeartRate } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { activityEffort, activitySport, activitySportLabel, SportBadge, sportTheme } from "./activity-meta.tsx";

/** A thin bar for the session's load against the heaviest one on screen. 0 to 1. */
export function EffortBar({ ratio, color, className }: { ratio: number; color: string; className?: string }) {
  const width = Math.max(4, Math.min(1, ratio) * 100);
  const reduce = useReducedMotion();
  return (
    <span className={cn("block h-1 w-full overflow-hidden rounded-full bg-surface-3/70", className)} aria-hidden="true">
      <motion.span
        className="block h-full origin-left rounded-full"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${color} 35%, transparent), ${color})`, boxShadow: `0 0 8px color-mix(in oklab, ${color} 60%, transparent)` }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}

/**
 * One activity as a tappable row. Used for the dashboard's recent list and as the
 * mobile replacement for table rows, so the same facts show in both places.
 */
export function ActivityCard({
  activity,
  showHeartRate = false,
  effort,
  className,
}: {
  activity: ActivitySummary;
  showHeartRate?: boolean;
  /** Load relative to the heaviest activity in view, 0 to 1. Shows a mini effort bar when set. */
  effort?: number | null;
  className?: string;
}) {
  const sport = activitySport(activity);
  const pace = activityEffort(activity);
  const primary = activity.distance ? formatDistance(activity.distance) : formatDuration(activity.movingTime);
  const secondary = [activity.distance ? formatDuration(activity.movingTime) : null, pace.value, showHeartRate && activity.averageHeartrate ? formatHeartRate(activity.averageHeartrate) : null]
    .filter(Boolean)
    .join(" · ");
  // The name shares its line only with the headline number; the other stats get their own line.
  // A right-hand stats column used to squeeze long names down to a letter on phones.
  return (
    <Link
      to={`/activities/${activity.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-surface-2/60 active:scale-[0.99] active:bg-surface-2",
        className,
      )}
    >
      <SportBadge sport={sport} className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activity.name ?? "Untitled activity"}</p>
          <span className="num shrink-0 font-display text-sm font-semibold text-foreground">{primary}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {activitySportLabel(activity)} · {formatActivityDate(activity.startDateLocal)}
        </p>
        {secondary ? <p className="num mt-0.5 truncate text-xs text-faint">{secondary}</p> : null}
        {effort != null ? <EffortBar ratio={effort} color={sportTheme(sport).color} className="mt-1.5 max-w-40" /> : null}
      </div>
      <ChevronRight className="size-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
    </Link>
  );
}
