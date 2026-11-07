import { useDataMode } from "@/data/mode.ts";
import { buttonVariants } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

export function PublicFrame({ children }: { children: ReactNode }) {
  const { mode } = useDataMode();
  const signedIn = mode === "live";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" width={28} height={28} draggable={false} className="size-7" />
            <span className="text-base font-semibold tracking-tight text-platinum">Coach</span>
          </Link>
          <nav aria-label="Public" className="flex items-center gap-4">
            <NavLink
              to="/mangesh"
              className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-platinum" : "text-titanium hover:text-platinum")}
            >
              Journal
            </NavLink>
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
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

export function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading Coach">
      <div className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="" width={32} height={32} draggable={false} className="size-8" />
        <span className="text-lg font-semibold text-platinum">Coach</span>
      </div>
    </div>
  );
}
