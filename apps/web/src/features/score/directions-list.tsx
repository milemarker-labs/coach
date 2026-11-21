import type { Direction, DirectionTone } from "@coach/shared";
import { BatteryCharging, ChevronRight, Compass, Gauge, Rocket, Trophy, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { cn } from "@/lib/utils.ts";

const tones: Record<DirectionTone, { icon: LucideIcon; className: string; label: string }> = {
  push: { icon: Rocket, className: "text-primary bg-primary-subtle ring-primary/20", label: "Push" },
  hold: { icon: Gauge, className: "text-flow bg-flow/10 ring-flow/20", label: "Adjust" },
  recover: { icon: BatteryCharging, className: "text-pulse bg-pulse-subtle ring-pulse/25", label: "Recover" },
  praise: { icon: Trophy, className: "text-success bg-success/10 ring-success/20", label: "Keep" },
};

/** The plan: a short list of what to do next, each one a door into the chat. */
export function DirectionsList({ directions, className }: { directions: Direction[]; className?: string }) {
  if (directions.length === 0) {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground", className)}>
        <Compass className="size-4 shrink-0" aria-hidden="true" />
        Nothing to change. Keep training the way you are.
      </div>
    );
  }
  return (
    <Stagger as="ul" className={cn("space-y-2", className)} delay={0.3}>
      {directions.map((direction) => {
        const tone = tones[direction.tone];
        const Icon = tone.icon;
        return (
          <StaggerItem as="li" key={direction.id}>
            <Link
              to="/coach"
              state={{ prompt: `${direction.title}: ${direction.detail} How should I put this into practice this week?` }}
              className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-surface-2/60"
            >
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset", tone.className)} aria-hidden="true">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{direction.title}</span>
                  <span className="text-[10px] font-semibold tracking-wider text-faint uppercase">{tone.label}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{direction.detail}</span>
              </span>
              <ChevronRight className="mt-2 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
