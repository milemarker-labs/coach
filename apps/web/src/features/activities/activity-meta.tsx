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
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-titanium", className)} aria-hidden="true">
      <Icon className="size-[18px]" />
    </span>
  );
}
