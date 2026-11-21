import type { ActivitySummary } from "@coach/shared";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { activityLoad } from "@/features/analytics/calculations/load.ts";
import { formatActivityDate, formatDistance, formatDuration, formatElevation, formatHeartRate } from "@/lib/format.ts";
import { ActivityCard, EffortBar } from "./activity-card.tsx";
import { activityEffort, activitySport, activitySportLabel, SportBadge, sportTheme } from "./activity-meta.tsx";

const dash = <span className="text-faint">—</span>;
const EASE = [0.16, 1, 0.3, 1] as const;

/** Each activity's load against the heaviest one in the list, so the bars compare like with like. */
function effortRatios(activities: ActivitySummary[]): Map<string, number> {
  const loads = activities.map((activity) => [activity.id, activityLoad(activity)?.value ?? 0] as const);
  const max = Math.max(...loads.map(([, value]) => value), 1);
  return new Map(loads.map(([id, value]) => [id, value / max]));
}

/**
 * Table on wide screens, cards on narrow ones. Rendering both from the same data keeps the
 * mobile list from being a squeezed desktop table. Rows rise in one after another.
 */
export function ActivityTable({ activities }: { activities: ActivitySummary[] }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const ratios = effortRatios(activities);
  const rowMotion = (index: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(index, 14) * 0.035, duration: 0.45, ease: EASE } };

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wider text-faint uppercase">
              <th className="px-5 py-3.5 font-semibold">Activity</th>
              <th className="px-3 py-3.5 font-semibold">Date</th>
              <th className="px-3 py-3.5 font-semibold">Effort</th>
              <th className="px-3 py-3.5 text-right font-semibold">Distance</th>
              <th className="px-3 py-3.5 text-right font-semibold">Time</th>
              <th className="px-3 py-3.5 text-right font-semibold">Pace / speed</th>
              <th className="px-3 py-3.5 text-right font-semibold">Heart rate</th>
              <th className="px-5 py-3.5 text-right font-semibold">Elevation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activities.map((activity, index) => {
              const effort = activityEffort(activity);
              const sport = activitySport(activity);
              return (
                <motion.tr
                  key={activity.id}
                  {...rowMotion(index)}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) return;
                    void navigate(`/activities/${activity.id}`);
                  }}
                  className="group cursor-pointer transition-colors hover:bg-surface-2/50"
                >
                  <td className="relative px-5 py-3">
                    <span
                      className="absolute top-2 bottom-2 left-0 w-0.5 origin-center scale-y-0 rounded-full transition-transform duration-300 group-hover:scale-y-100"
                      style={{ background: sportTheme(sport).color }}
                      aria-hidden="true"
                    />
                    <Link to={`/activities/${activity.id}`} className="flex items-center gap-3">
                      <SportBadge sport={sport} className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
                      <span className="min-w-0">
                        <span className="block max-w-72 truncate font-medium text-foreground group-hover:underline group-hover:decoration-border-hover group-hover:underline-offset-4">
                          {activity.name ?? "Untitled activity"}
                        </span>
                        <span className="block text-xs text-muted-foreground">{activitySportLabel(activity)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatActivityDate(activity.startDateLocal)}</td>
                  <td className="w-28 px-3 py-3">
                    <EffortBar ratio={ratios.get(activity.id) ?? 0} color={sportTheme(sport).color} />
                  </td>
                  <td className="num px-3 py-3 text-right font-display font-semibold text-foreground">{activity.distance ? formatDistance(activity.distance) : dash}</td>
                  <td className="num px-3 py-3 text-right text-foreground">{formatDuration(activity.movingTime)}</td>
                  <td className="num px-3 py-3 text-right text-foreground">{effort.value ?? dash}</td>
                  <td className="num px-3 py-3 text-right text-foreground">{activity.averageHeartrate ? formatHeartRate(activity.averageHeartrate) : dash}</td>
                  <td className="num px-5 py-3 text-right text-foreground">{activity.totalElevationGain ? formatElevation(activity.totalElevationGain) : dash}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {activities.map((activity, index) => (
          <motion.li key={activity.id} {...rowMotion(index)}>
            <ActivityCard activity={activity} showHeartRate effort={ratios.get(activity.id) ?? 0} className="rounded-none" />
          </motion.li>
        ))}
      </ul>
    </>
  );
}
