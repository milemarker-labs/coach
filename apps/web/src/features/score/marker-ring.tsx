import { SCORE_BANDS } from "@coach/shared";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId } from "react";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { cn } from "@/lib/utils.ts";

const TICKS = 72;
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The Marker as an instrument: a spectrum arc that sweeps to the score, a glowing
 * head that rides the arc, band notches, and the number counting up in the middle.
 */
export function MarkerRing({
  value,
  label,
  caption,
  size = 240,
  stroke = 14,
  className,
  children,
}: {
  value: number | null;
  /** Band label under the number. */
  label?: string;
  /** Small line above the number, e.g. the score name. */
  caption?: string;
  size?: number;
  stroke?: number;
  className?: string;
  /** Extra content under the band label, e.g. the weekly change. */
  children?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2 - 10;
  const center = size / 2;
  const fraction = value == null ? 0 : Math.min(Math.max(value, 0), 100) / 100;
  const duration = reduce ? 0 : 1.6;
  // The head of the arc rides the same eased progress as the arc itself.
  const progress = useMotionValue(0);
  const headX = useTransform(progress, (f) => center + radius * Math.sin(f * Math.PI * 2));
  const headY = useTransform(progress, (f) => center - radius * Math.cos(f * Math.PI * 2));
  useEffect(() => {
    const controls = animate(progress, fraction, { duration, ease: EASE });
    return () => controls.stop();
  }, [progress, fraction, duration]);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-spectrum`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--pulse)" />
            <stop offset="55%" stopColor="var(--flow)" />
            <stop offset="100%" stopColor="var(--brand)" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <radialGradient id={`${id}-core`}>
            <stop offset="0%" stopColor="rgb(var(--pulse-rgb)/0.18)" />
            <stop offset="70%" stopColor="rgb(var(--pulse-rgb)/0)" />
          </radialGradient>
        </defs>

        <circle cx={center} cy={center} r={radius - stroke} fill={`url(#${id}-core)`} />

        {/* Instrument ticks. The ones under the arc light up as it passes. */}
        <g>
          {Array.from({ length: TICKS }, (_, index) => {
            const angle = (index / TICKS) * Math.PI * 2 - Math.PI / 2;
            const lit = index / TICKS < fraction;
            const major = index % 6 === 0;
            const inner = radius + stroke / 2 + 5;
            const outer = inner + (major ? 7 : 4);
            return (
              <motion.line
                key={index}
                x1={center + Math.cos(angle) * inner}
                y1={center + Math.sin(angle) * inner}
                x2={center + Math.cos(angle) * outer}
                y2={center + Math.sin(angle) * outer}
                stroke={lit ? "var(--text)" : "var(--text-muted)"}
                strokeWidth={major ? 1.6 : 1}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: lit ? (major ? 0.9 : 0.55) : 0.18 }}
                transition={{ delay: reduce ? 0 : (index / TICKS) * duration * 0.9, duration: 0.3 }}
              />
            );
          })}
        </g>

        {/* Track */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} opacity={0.7} />

        <g transform={`rotate(-90 ${center} ${center})`}>
          {/* Neon bloom under the arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${id}-spectrum)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            filter={`url(#${id}-glow)`}
            opacity={0.55}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: fraction }}
            transition={{ duration, ease: EASE }}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${id}-spectrum)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: fraction }}
            transition={{ duration, ease: EASE }}
          />
        </g>

        {/* Band notches */}
        {SCORE_BANDS.slice(1).filter((band) => band.min < fraction * 100).map((band) => {
          const angle = (band.min / 100) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={band.key}
              x1={center + Math.cos(angle) * (radius - stroke / 2)}
              y1={center + Math.sin(angle) * (radius - stroke / 2)}
              x2={center + Math.cos(angle) * (radius + stroke / 2)}
              y2={center + Math.sin(angle) * (radius + stroke / 2)}
              stroke="var(--bg)"
              strokeWidth={2}
            />
          );
        })}

        {/* The head of the arc */}
        {value != null && fraction > 0 ? (
          <>
            <motion.circle cx={headX} cy={headY} r={stroke / 2 + 4} fill="var(--brand)" opacity={0.3} filter={`url(#${id}-glow)`} />
            <motion.circle cx={headX} cy={headY} r={stroke / 2 - 2.5} fill="#fff" />
          </>
        ) : null}
      </svg>

      <div className="relative flex flex-col items-center text-center">
        {caption ? <span className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{caption}</span> : null}
        {value == null ? (
          <span className="font-display text-6xl font-semibold text-faint">—</span>
        ) : (
          <span style={{ fontSize: Math.round(size * 0.27) }} className="font-display leading-none font-semibold tracking-tight text-foreground">
            <AnimatedNumber value={value} duration={duration} />
          </span>
        )}
        {label ? <span className="mt-1.5 text-sm font-medium text-spectrum">{label}</span> : null}
        {children}
      </div>
    </div>
  );
}
