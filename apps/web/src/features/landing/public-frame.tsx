import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { buttonVariants } from "@/components/ui/button.tsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.tsx";
import { useDataMode } from "@/data/mode.ts";
import { cn } from "@/lib/utils.ts";

function Brand({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={size} height={size} draggable={false} style={{ width: size, height: size }} />
      <span className="font-display text-base font-semibold tracking-tight text-foreground">Coach</span>
    </span>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn("relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground");

export function PublicFrame({ children }: { children: ReactNode }) {
  const { mode } = useDataMode();
  const signedIn = mode === "live";
  const { scrollY } = useScroll();
  // The header firms up as the page scrolls.
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="app-aurora" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 -z-10 grain opacity-60" aria-hidden="true" />
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="rounded-lg" aria-label="Coach home">
            <Brand />
          </Link>
          <nav aria-label="Public" className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/mangesh" className={navClass}>
              {({ isActive }) => (
                <>
                  {isActive ? <motion.span layoutId="public-nav" className="absolute inset-0 rounded-full bg-surface-2 ring-1 ring-border ring-inset" aria-hidden="true" /> : null}
                  <span className="relative">Journal</span>
                </>
              )}
            </NavLink>
            <ThemeToggle />
            {mode === "loading" ? null : signedIn ? (
              <Link to="/" className={buttonVariants({ size: "sm" })}>
                Open archive
              </Link>
            ) : (
              <a href="/api/auth/strava" className={buttonVariants({ size: "sm" })}>
                Connect Strava
              </a>
            )}
          </nav>
        </div>
        <motion.div className="h-px bg-gradient-to-r from-transparent via-border-hover to-transparent" style={{ opacity: borderOpacity }} aria-hidden="true" />
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

/** First paint while Coach checks who is signed in: the mark, breathing inside a spectrum orb. */
export function BootScreen() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" role="status" aria-label="Loading Coach">
      <div className="app-aurora" aria-hidden="true" />
      <div className="flex flex-col items-center gap-6">
        <div className="relative grid size-28 place-items-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-spectrum opacity-60 blur-2xl"
            animate={reduce ? undefined : { scale: [0.85, 1.1, 0.85], rotate: [0, 180, 360] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-white/10"
            style={{ borderTopColor: "var(--brand)", borderRightColor: "var(--flow)" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          />
          <motion.img
            src="/logo.svg"
            alt=""
            width={48}
            height={48}
            draggable={false}
            className="relative size-12"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          />
        </div>
        <motion.div className="flex flex-col items-center gap-1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <span className="font-display text-lg font-semibold">Coach</span>
          <span className="text-xs text-muted-foreground">Reading your training…</span>
        </motion.div>
      </div>
    </div>
  );
}
