import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { cadenceUnit, formatEffort, sportKey, sportLabel } from "@coach/shared";
import { api } from "@/lib/api.ts";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatInstant,
  formatLocalClock,
} from "@/lib/format.ts";

export function ActivityDetailPage() {
  const { id = "" } = useParams();
  const activity = useQuery({ queryKey: ["activity", id], queryFn: () => api.activity(id), enabled: id.length > 0 });

  if (activity.isLoading) return <p>Loading activity…</p>;
  if (!activity.data) return <p>Activity not found.</p>;

  const row = activity.data;
  const sport = sportKey(row.sportType, row.activityType);
  const effort = formatEffort(sport, row.averageSpeed);
  const cadence = cadenceUnit(sport);
  const fields = [
    ["Sport", sportLabel(sport)],
    ["Local time", formatLocalClock(row.startDateLocal)],
    ["Start", formatInstant(row.startDate)],
    ["Distance", formatDistance(row.distance)],
    ["Moving time", formatDuration(row.movingTime)],
    ["Elapsed time", formatDuration(row.elapsedTime)],
    [effort.label, effort.value],
    ["Elevation", formatElevation(row.totalElevationGain)],
    ["Average heart rate", formatHeartRate(row.averageHeartrate)],
    ["Max heart rate", formatHeartRate(row.maxHeartrate)],
    ["Cadence", row.averageCadence == null ? "—" : cadence ? `${Math.round(row.averageCadence)} ${cadence}` : String(Math.round(row.averageCadence))],
    ["Power", row.averageWatts == null ? "—" : `${Math.round(row.averageWatts)} W`],
    ["Calories", row.calories == null ? "—" : `${Math.round(row.calories)}`],
    ["Suffer score", row.sufferScore == null ? "—" : String(row.sufferScore)],
    ["Temperature", row.averageTemp == null ? "—" : `${row.averageTemp}°`],
    ["Gear", row.gearId ?? "—"],
    ["Strava id", row.stravaActivityId],
  ];

  return (
    <div className="space-y-6">
      <Link className="text-sm underline-offset-4 hover:underline" to="/activities">
        All activities
      </Link>
      <h1 className="text-4xl">{row.name ?? "Untitled activity"}</h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-mono text-lg">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
