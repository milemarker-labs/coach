import { formatEffort, sportKey, sportLabel, type ActivitySummary } from "@coach/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { api } from "@/lib/api.ts";
import { formatDistance, formatDuration, formatLocalClock } from "@/lib/format.ts";

export function ActivitiesPage() {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const auth = useQuery({ queryKey: ["auth"], queryFn: api.authStatus });
  const sports = useQuery({
    queryKey: ["sports"],
    queryFn: api.sports,
    enabled: auth.data?.connected === true,
  });
  const list = useQuery({
    queryKey: ["activities", { type, from, to, sort, offset, limit }],
    queryFn: () => api.activities({ type, from, to, sort, offset, limit }),
    enabled: auth.data?.connected === true,
  });
  const total = list.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Activities</h1>
        <p className="mt-2 text-muted-foreground">{total} stored activities</p>
      </header>
      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setOffset(0);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="sport">Sport</Label>
          <select
            id="sport"
            className="h-10 w-full rounded-md border bg-card px-3 text-sm"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">All sports</option>
            {sports.data?.sports.map((item) => (
              <option key={item.sport} value={item.sport}>
                {sportLabel(item.sport)} ({item.count})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setOffset(0);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setOffset(0);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">Sort</Label>
          <select
            id="sort"
            className="h-10 w-full rounded-md border bg-card px-3 text-sm"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value === "asc" ? "asc" : "desc");
              setOffset(0);
            }}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </form>
      <ul className="divide-y rounded-lg border bg-card">
        {list.data?.activities.map((activity) => (
          <li key={activity.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto]">
            <div>
              <Link className="font-medium underline-offset-4 hover:underline" to={`/activities/${activity.id}`}>
                {activity.name ?? "Untitled activity"}
              </Link>
              <p className="text-sm text-muted-foreground">
                {sportLabel(sportKey(activity.sportType, activity.activityType))} · {formatLocalClock(activity.startDateLocal)}
              </p>
            </div>
            <p className="font-mono text-sm">
              {activitySummary(activity)}
            </p>
          </li>
        ))}
        {auth.data && !auth.data.connected ? <li className="px-4 py-6 text-sm text-muted-foreground">Connect Strava in settings to see activities.</li> : null}
        {list.data && list.data.activities.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">No activities match these filters.</li> : null}
      </ul>
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - limit))}>
          Previous
        </Button>
        <Button variant="outline" disabled={offset + limit >= total} onClick={() => setOffset((value) => value + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function activitySummary(activity: ActivitySummary): string {
  const sport = sportKey(activity.sportType, activity.activityType);
  const effort = formatEffort(sport, activity.averageSpeed);
  const parts = [formatDistance(activity.distance), formatDuration(activity.movingTime)];
  if (effort.value !== "—") parts.push(effort.value);
  return parts.join(" · ");
}
