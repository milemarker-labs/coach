import { formatEffort, sportKey, sportLabel, type ActivitySummary } from "@coach/shared";
import { Activity, Bike, Dumbbell, Footprints, Mountain, Waves, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const icons: Record<string, LucideIcon> = {
  Run: Footprints,
  VirtualRun: Footprints,
  TrailRun: Footprints,
  Walk: Footprints,
  Hike: Mountain,
  Ride: Bike,
  VirtualRide: Bike,
  MountainBikeRide: Bike,
  GravelRide: Bike,
  EBikeRide: Bike,
  Swim: Waves,
  WeightTraining: Dumbbell,
  Workout: Dumbbell,
};

export function sportIcon(sport: string): LucideIcon {
  return icons[sport] ?? Activity;
}

export interface SportTheme {
  /** CSS color for strokes, glows and bars. */
  color: string;
  /** Icon tile: tinted background, icon color and ring. */
  tile: string;
  /** Soft wash for hero bands, as a Tailwind `from-*` class. */
  wash: string;
}

const themes = {
  run: { color: "var(--brand)", tile: "bg-primary-subtle text-primary ring-primary/20", wash: "from-primary/25" },
  ride: { color: "var(--flow)", tile: "bg-flow/10 text-flow ring-flow/20", wash: "from-flow/25" },
  swim: { color: "var(--info)", tile: "bg-info/12 text-info ring-info/20", wash: "from-info/25" },
  hike: { color: "var(--trail)", tile: "bg-trail/10 text-trail ring-trail/20", wash: "from-trail/25" },
  strength: { color: "var(--pulse)", tile: "bg-pulse-subtle text-pulse ring-pulse/25", wash: "from-pulse/30" },
  other: { color: "var(--text-secondary)", tile: "bg-surface-2 text-muted-foreground ring-border", wash: "from-pulse/20" },
} satisfies Record<string, SportTheme>;

const families: Record<string, keyof typeof themes> = {
  Run: "run",
  VirtualRun: "run",
  TrailRun: "run",
  Walk: "hike",
  Hike: "hike",
  Ride: "ride",
  VirtualRide: "ride",
  MountainBikeRide: "ride",
  GravelRide: "ride",
  EBikeRide: "ride",
  Swim: "swim",
  WeightTraining: "strength",
  Workout: "strength",
  Yoga: "strength",
  Crossfit: "strength",
};

/** Each sport family gets its own color so a list reads at a glance. */
export function sportTheme(sport: string): SportTheme {
  return themes[families[sport] ?? "other"];
}

export function activitySport(activity: Pick<ActivitySummary, "sportType" | "activityType">): string {
  return sportKey(activity.sportType, activity.activityType);
}

export function activitySportLabel(activity: Pick<ActivitySummary, "sportType" | "activityType">): string {
  return sportLabel(activitySport(activity));
}

/** Pace for foot sports, speed for cycling, nothing for duration-only sports. */
export function activityEffort(activity: ActivitySummary): { label: string; value: string | null } {
  const effort = formatEffort(activitySport(activity), activity.averageSpeed);
  return { label: effort.label, value: effort.value === "—" ? null : effort.value };
}

export function SportBadge({ sport, className }: { sport: string; className?: string }) {
  const Icon = sportIcon(sport);
  const theme = sportTheme(sport);
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", theme.tile, className)} aria-hidden="true">
      <Icon className="size-[18px]" />
    </span>
  );
}
