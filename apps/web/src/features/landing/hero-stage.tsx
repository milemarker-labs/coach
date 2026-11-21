import { computeMarker } from "@coach/shared";
import { Feather, Gauge, HeartPulse, Repeat, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { mockActivities } from "@/data/mock/activities.ts";
import { todayKey } from "@/features/analytics/calculations/dates.ts";
import { MarkerRing } from "@/features/score/marker-ring.tsx";
import { toScoreActivity } from "@/features/score/use-marker.ts";
import { cn } from "@/lib/utils.ts";

interface Chip {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}

/**
 * The Marker, running on the generated demo history through the same engine the archive uses.
 * Stat chips orbit the ring; each one counter-rotates so its text stays upright.
 */
export function HeroStage({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const marker = useMemo(() => computeMarker(mockActivities().map(toScoreActivity), todayKey()), []);
  const part = (key: string) => marker.components.find((c) => c.key === key)?.value;

  const chips: Chip[] = [
    { icon: Repeat, label: "Consistency", value: String(part("consistency") ?? "—"), tone: "text-primary" },
    { icon: Gauge, label: "Balance", value: String(part("balance") ?? "—"), tone: "text-flow" },
    { icon: TrendingUp, label: "Momentum", value: String(part("momentum") ?? "—"), tone: "text-pulse" },
    { icon: HeartPulse, label: "Efficiency", value: part("efficiency") != null ? String(part("efficiency")) : "n/a", tone: "text-trail" },
  ];
  const radius = 172;

  return (
    <div className={cn("relative mx-auto grid aspect-square w-full max-w-[26rem] place-items-center", className)}>
      {/* Halo */}
      <div className="absolute inset-[12%] rounded-full bg-spectrum opacity-20 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-[4%] rounded-full border border-dashed border-border" aria-hidden="true" />
      <div className="absolute inset-[18%] rounded-full border border-border/60" aria-hidden="true" />

      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <MarkerRing value={marker.value} label={marker.band.label} caption="Sample Marker" size={236}>
          <span className="mt-2 rounded-full bg-warning/12 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-warning uppercase">Demo athlete</span>
        </MarkerRing>
      </motion.div>

      {/* Orbiting chips */}
      <motion.div
        className="pointer-events-none absolute inset-0 hidden sm:block"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        {chips.map((chip, index) => {
          const angle = (index / chips.length) * Math.PI * 2 - Math.PI / 4;
          return (
            <div
              key={chip.label}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `translate(-50%, -50%) translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)` }}
            >
              <motion.div
                animate={reduce ? undefined : { rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <motion.div
                  className="glass flex items-center gap-2 rounded-full border border-border-hover px-3 py-1.5 shadow-lg shadow-shade/40"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.12, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <chip.icon className={cn("size-3.5", chip.tone)} />
                  <span className="text-[11px] text-muted-foreground">{chip.label}</span>
                  <span className="num font-display text-xs font-semibold text-foreground">{chip.value}</span>
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Today's call, pinned under the ring */}
      <motion.div
        className="glass absolute -bottom-2 left-1/2 flex w-[min(19rem,92%)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-border-hover px-4 py-3 shadow-2xl shadow-shade/50 sm:-bottom-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary" aria-hidden="true">
          {marker.call.kind === "rest" || marker.call.kind === "easy" ? <Feather className="size-4" /> : <Zap className="size-4" />}
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Today&apos;s call · sample</span>
          <span className="block truncate text-sm font-semibold text-foreground">{marker.call.title}</span>
        </span>
        {marker.call.minutes ? <span className="num ml-auto shrink-0 font-display text-sm font-semibold text-primary">{marker.call.minutes}′</span> : null}
      </motion.div>
    </div>
  );
}
