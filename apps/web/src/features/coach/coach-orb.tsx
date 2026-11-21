import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

const SPECTRUM_CONIC = "conic-gradient(from 0deg, var(--pulse), var(--flow), var(--brand), var(--flow), var(--pulse))";

/**
 * Coach's presence: layered spectrum light that breathes slowly at rest and spins up while
 * Coach is thinking or streaming. The resting layers never restart, so switching `active`
 * only fades the fast layers in and out instead of jumping the rotation.
 */
export function CoachOrb({ size = 160, active = false, className }: { size?: number; active?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const blur = Math.max(1, size * 0.07);
  const small = size < 48;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} aria-hidden="true">
      {/* Halo */}
      {small ? null : <div className="pointer-events-none absolute -inset-[18%] animate-orb rounded-full bg-spectrum opacity-30 blur-3xl" />}

      {/* Slow spectrum body */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: SPECTRUM_CONIC, filter: `blur(${blur}px)` }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
      {/* Counter-rotating sheen */}
      <motion.div
        className="absolute inset-[6%] rounded-full opacity-60 mix-blend-screen light:mix-blend-normal"
        style={{ background: "conic-gradient(from 180deg, transparent, rgb(var(--brand-rgb)/0.3), transparent 40%, rgb(var(--pulse-rgb)/0.6), transparent 75%)", filter: `blur(${blur * 0.6}px)` }}
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      {/* Fast layer while Coach is working */}
      <AnimatePresence>
        {active && !reduce ? (
          <motion.div
            key="active"
            className="absolute -inset-[4%] rounded-full mix-blend-screen light:mix-blend-normal"
            style={{ background: SPECTRUM_CONIC, filter: `blur(${blur * 1.4}px)` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.85, scale: [1, 1.1, 0.98, 1.06, 1], rotate: 360 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              opacity: { duration: 0.4 },
              scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2.4, repeat: Infinity, ease: "linear" },
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Glass core */}
      <div
        className="animate-orb absolute inset-[14%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.92) 0%, rgb(var(--brand-rgb)/0.45) 16%, rgb(var(--flow-rgb)/0.28) 38%, rgba(10,12,19,0.88) 72%)",
          boxShadow: "inset 0 0 18px rgb(var(--pulse-rgb)/0.45)",
        }}
      />
      {/* Specular highlight */}
      <div className="absolute top-[20%] left-[24%] h-[16%] w-[26%] rotate-[-25deg] rounded-full bg-white/50 blur-[2px]" />
    </div>
  );
}
