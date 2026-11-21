import { Menu, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet.tsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.tsx";
import { useDataMode } from "@/data/mode.ts";
import { AthleteSwitcher } from "@/features/athletes/athlete-switcher.tsx";
import { StravaConnection } from "@/features/sync/strava-connection.tsx";
import { cn } from "@/lib/utils.ts";
import { CommandPaletteProvider, useCommandPalette } from "./command-palette.tsx";
import { MarkerChip, MiniRing } from "./mini-marker.tsx";
import { navItems } from "./nav-items.ts";
import { useMarker } from "@/features/score/use-marker.ts";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={32} height={32} draggable={false} className="size-8 shrink-0" />
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">Coach</span>
    </div>
  );
}

function SearchButton({ compact = false }: { compact?: boolean }) {
  const palette = useCommandPalette();
  if (compact) {
    return (
      <button
        type="button"
        onClick={palette.open}
        className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        aria-label="Search or ask Coach"
      >
        <Search className="size-[18px]" aria-hidden="true" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={palette.open}
      className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-input/70 px-3 text-sm text-faint transition-colors hover:border-border-hover hover:text-muted-foreground"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="flex-1 text-left">Search or ask</span>
      <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}

function NavList({ onNavigate, layoutId }: { onNavigate?: () => void; layoutId: string }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn("group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/[0.13] via-surface-2/80 to-surface-2/40 ring-1 ring-primary/15 ring-inset"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  aria-hidden="true"
                >
                  <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-primary shadow-[0_0_12px_rgb(var(--brand-rgb)/0.4)]" />
                </motion.span>
              ) : (
                <span className="absolute inset-0 rounded-xl bg-surface-2/0 transition-colors group-hover:bg-surface-2/50" aria-hidden="true" />
              )}
              <item.icon
                className={cn("relative size-[18px] shrink-0 transition-[color,transform] duration-300 group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                aria-hidden="true"
              />
              <span className="relative">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate, layoutId }: { onNavigate?: () => void; layoutId: string }) {
  return (
    <div className="flex h-full flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between pl-2">
        <Brand />
        <ThemeToggle />
      </div>
      <MarkerChip onNavigate={onNavigate} />
      <SearchButton />
      <AthleteSwitcher />
      <NavList onNavigate={onNavigate} layoutId={layoutId} />
      <div className="mt-auto">
        <StravaConnection />
      </div>
    </div>
  );
}

function MobileMarker() {
  const { marker } = useMarker();
  return (
    <NavLink to="/training" aria-label={marker ? `${marker.name} ${marker.value}, ${marker.band.label}` : "Marker score"}>
      <MiniRing value={marker?.value ?? null} size={36} />
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <ShellFrame>{children}</ShellFrame>
    </CommandPaletteProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { auth } = useDataMode();
  const location = useLocation();
  const viewingName = auth?.viewing?.displayName?.trim() || "this athlete";
  // Chat is an app-style screen: an exact viewport-height frame where only the thread scrolls.
  // Phones: minus the 3.5rem header and the 5.5rem floating tab bar. Tablets: minus the header. Desktop: full height.
  const immersive = location.pathname === "/coach";
  const mainRef = useRef<HTMLElement>(null);

  // Every tab opens at the top, like a native app. On phones the content pane is the scroller.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    // Phones: the document itself never scrolls. The header and tab bar stay put and the content pane
    // scrolls inside, so the browser toolbar never collapses or expands when switching tabs (which made
    // the fixed tab bar jump). Tablet and desktop keep normal page scrolling.
    <div className="min-h-screen max-md:flex max-md:h-dvh max-md:min-h-0 max-md:flex-col max-md:overflow-hidden">
      <div className="app-aurora" aria-hidden="true" />
      <div className="grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      {/* Desktop: fixed glass sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-border lg:block">
        <SidebarBody layoutId="nav-desktop" />
      </aside>

      {/* Tablet and mobile: compact glass header with a navigation drawer */}
      <header className="glass sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground active:scale-95"
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Brand />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SearchButton compact />
          <MobileMarker />
        </div>
      </header>
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Move between Coach sections</SheetDescription>
          <SidebarBody onNavigate={() => setDrawerOpen(false)} layoutId="nav-drawer" />
        </SheetContent>
      </Sheet>

      <main
        ref={mainRef}
        className={cn(
          "relative z-10 max-md:min-h-0 max-md:flex-1 max-md:overflow-x-hidden max-md:overflow-y-auto max-md:overscroll-contain lg:pl-[264px]",
          immersive ? "pb-[5.5rem] md:pb-0" : "pb-28 md:pb-0",
        )}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8",
            immersive && "flex h-[calc(100dvh-9rem)] flex-col pb-2 md:h-[calc(100dvh-3.5rem)] md:pb-4 lg:h-dvh lg:pb-6",
          )}
        >
          {auth?.viewing ? (
            <p className="mb-4 inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-pulse/30 bg-pulse-subtle px-3 py-1 text-xs text-pulse">
              <span className="size-1.5 rounded-full bg-pulse" aria-hidden="true" />
              Viewing {viewingName}&apos;s archive
            </p>
          ) : null}
          {/* Each screen glides in. Keyed by path so detail pages animate too. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={immersive ? "flex min-h-0 flex-1 flex-col" : undefined}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile: floating tab bar for the four most used sections, the drawer for the rest */}
      <nav aria-label="Quick navigation" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 md:hidden">
        <ul className="glass grid grid-cols-5 rounded-2xl border border-border-hover p-1 shadow-2xl shadow-shade/50">
          {navItems
            .filter((item) => item.primary)
            .map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => cn("relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <motion.span layoutId="nav-mobile" className="absolute inset-0 rounded-xl bg-primary-subtle" transition={{ type: "spring", stiffness: 500, damping: 38 }} aria-hidden="true" /> : null}
                      <item.icon className="relative size-5" aria-hidden="true" />
                      <span className="relative">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          <li>
            <button type="button" onClick={() => setDrawerOpen(true)} className="flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-muted-foreground">
              <Menu className="size-5" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
