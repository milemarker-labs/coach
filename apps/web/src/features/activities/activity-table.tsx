import type { ActivitySummary } from "@coach/shared";
import { Link } from "react-router";
import { formatActivityDate, formatDistance, formatDuration, formatElevation, formatHeartRate } from "@/lib/format.ts";
import { ActivityCard } from "./activity-card.tsx";
import { activityEffort, activitySport, activitySportLabel, SportBadge } from "./activity-meta.tsx";

const dash = <span className="text-faint">—</span>;

/**
 * Table on wide screens, cards on narrow ones. Rendering both from the same data keeps the
 * mobile list from being a squeezed desktop table.
 */
export function ActivityTable({ activities }: { activities: ActivitySummary[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 text-right font-medium">Distance</th>
              <th className="px-3 py-3 text-right font-medium">Time</th>
              <th className="px-3 py-3 text-right font-medium">Pace / speed</th>
              <th className="px-3 py-3 text-right font-medium">Heart rate</th>
              <th className="px-4 py-3 text-right font-medium">Elevation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activities.map((activity) => {
              const effort = activityEffort(activity);
              return (
                <tr key={activity.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <Link to={`/activities/${activity.id}`} className="flex items-center gap-3">
                      <SportBadge sport={activitySport(activity)} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-platinum hover:underline">{activity.name ?? "Untitled activity"}</span>
                        <span className="block text-xs text-muted-foreground">{activitySportLabel(activity)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatActivityDate(activity.startDateLocal)}</td>
                  <td className="num px-3 py-3 text-right font-medium text-platinum">{activity.distance ? formatDistance(activity.distance) : dash}</td>
                  <td className="num px-3 py-3 text-right text-platinum">{formatDuration(activity.movingTime)}</td>
                  <td className="num px-3 py-3 text-right text-platinum">{effort.value ?? dash}</td>
                  <td className="num px-3 py-3 text-right text-platinum">{activity.averageHeartrate ? formatHeartRate(activity.averageHeartrate) : dash}</td>
                  <td className="num px-4 py-3 text-right text-platinum">{activity.totalElevationGain ? formatElevation(activity.totalElevationGain) : dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {activities.map((activity) => (
          <li key={activity.id}>
            <ActivityCard activity={activity} showHeartRate className="rounded-none" />
          </li>
        ))}
      </ul>
    </>
  );
}
