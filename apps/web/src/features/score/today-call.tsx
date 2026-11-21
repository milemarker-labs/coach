import type { CallKind, TodayCall } from "@coach/shared";
import { ArrowUpRight, Feather, Footprints, Moon, Mountain, Zap, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { cn } from "@/lib/utils.ts";

const kinds: Record<CallKind, { icon: LucideIcon; label: string; glow: string; chip: string }> = {
  rest: { icon: Moon, label: "Recover", glow: "from-pulse/35", chip: "text-pulse bg-pulse-subtle" },
  easy: { icon: Feather, label: "Easy", glow: "from-flow/30", chip: "text-flow bg-flow/10" },
  steady: { icon: Footprints, label: "Steady", glow: "from-flow/25", chip: "text-flow bg-flow/10" },
  quality: { icon: Zap, label: "Quality", glow: "from-primary/35", chip: "text-primary bg-primary-subtle" },
  long: { icon: Mountain, label: "Long", glow: "from-primary/30", chip: "text-primary bg-primary-subtle" },
};

/** Intensity as five bars that light up in turn. */
function IntensityMeter({ level }: { level: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-end gap-1" role="img" aria-label={`Intensity ${level} of 4`}>
      {[0, 1, 2, 3, 4].map((bar) => (
        <motion.span
          key={bar}
          className={cn("w-1.5 rounded-full", bar <= level ? "bg-primary" : "bg-surface-3")}
          style={{ height: 6 + bar * 4 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: reduce ? 0 : 0.5 + bar * 0.08, type: "spring", stiffness: 420, damping: 18 }}
        />
      ))}
    </div>
  );
}

/** Today's direction: one session type, why, and how long. */
export function TodayCallCard({ call, className }: { call: TodayCall; className?: string }) {
  const kind = kinds[call.kind];
  const Icon = kind.icon;
  const prompt = `Plan today's session for me. Coach's call is "${call.title}"${call.minutes ? `, about ${call.minutes} minutes` : ""}. Give me the structure, the effort to aim for, and what to watch for.`;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5", className)}>
      <div className={cn("pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-gradient-to-br to-transparent blur-2xl", kind.glow)} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Today&apos;s call</p>
          <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", kind.chip)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {kind.label}
          </span>
        </div>
        <motion.span
          className="grid size-12 place-items-center rounded-2xl border border-border bg-surface-2"
          initial={{ rotate: -12, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.2 }}
          aria-hidden="true"
        >
          <Icon className="size-6 text-foreground" />
        </motion.span>
      </div>
      <h3 className="relative mt-4 text-xl leading-tight font-semibold text-balance">{call.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{call.reason}</p>
      <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-5">
          <div>
            <p className="text-[11px] text-faint">Duration</p>
            <p className="num font-display text-lg font-semibold">{call.minutes ? `${call.minutes} min` : "Off"}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-faint">Intensity</p>
            <IntensityMeter level={call.intensity} />
          </div>
        </div>
        <Link
          to="/coach"
          state={{ prompt }}
          className="group inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition-colors ring-inset hover:bg-surface-3"
        >
          Plan it
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
