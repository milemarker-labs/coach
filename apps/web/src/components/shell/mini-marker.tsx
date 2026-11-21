import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { Link } from "react-router";
import { useMarker } from "@/features/score/use-marker.ts";
import { cn } from "@/lib/utils.ts";

/** A small spectrum ring with the score in it. */
export function MiniRing({ value, size = 44, className }: { value: number | null; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const fraction = value == null ? 0 : Math.min(Math.max(value, 0), 100) / 100;
  return (
    <span className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--pulse)" />
            <stop offset="55%" stopColor="var(--flow)" />
            <stop offset="100%" stopColor="var(--brand)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="num font-display text-[13px] font-semibold text-foreground">{value ?? "—"}</span>
    </span>
  );
}

/** Sidebar chip: the Marker at a glance, a door into the training page. */
export function MarkerChip({ onNavigate }: { onNavigate?: () => void }) {
  const { marker, isLoading } = useMarker();
  return (
    <Link
      to="/training"
      onClick={onNavigate}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/70 p-2.5 transition-colors hover:border-border-hover"
    >
      <span className="pointer-events-none absolute -right-8 -bottom-10 size-24 rounded-full bg-flow/15 blur-2xl transition-opacity group-hover:opacity-100" aria-hidden="true" />
      <MiniRing value={isLoading ? null : (marker?.value ?? null)} />
      <span className="relative min-w-0">
        <span className="block text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{marker?.name ?? "Marker"}</span>
        <span className="block truncate text-sm font-semibold text-foreground">{isLoading ? "Reading logs…" : (marker?.band.label ?? "No data yet")}</span>
        {marker?.delta7 != null ? (
          <span className={cn("num block text-[11px]", marker.delta7 > 0 ? "text-success" : marker.delta7 < 0 ? "text-danger" : "text-muted-foreground")}>
            {marker.delta7 > 0 ? "+" : marker.delta7 < 0 ? "−" : "±"}
            {Math.abs(marker.delta7)} this week
          </span>
        ) : null}
      </span>
    </Link>
  );
}
