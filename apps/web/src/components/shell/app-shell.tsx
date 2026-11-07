import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet.tsx";
import { StravaConnection } from "@/features/sync/strava-connection.tsx";
import { cn } from "@/lib/utils.ts";
import { navItems } from "./nav-items.ts";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={32} height={32} draggable={false} className="size-8 shrink-0" />
      <span className="text-lg font-semibold tracking-tight text-platinum">Coach</span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive ? "bg-primary-subtle text-platinum" : "text-titanium hover:bg-surface-2/60 hover:text-platinum",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-metal-bronze" aria-hidden="true" /> : null}
              <item.icon className={cn("size-[18px] shrink-0 transition-colors", isActive ? "text-primary" : "text-titanium group-hover:text-platinum")} aria-hidden="true" />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="px-2">
        <Brand />
      </div>
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto">
        <StravaConnection />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>

      {/* Tablet and mobile: compact header with a navigation drawer */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="-ml-2 flex size-10 items-center justify-center rounded-lg text-titanium transition-colors hover:bg-surface-2 hover:text-platinum active:scale-95"
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Brand />
      </header>
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Move between Coach sections</SheetDescription>
          <SidebarBody onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="pb-20 md:pb-0 lg:pl-[250px]">
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile: bottom bar for the four most used sections, the drawer for the rest */}
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {navItems
            .filter((item) => item.primary)
            .map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors", isActive ? "text-primary" : "text-titanium")
                  }
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label === "Chat Coach" ? "Coach" : item.label}
                </NavLink>
              </li>
            ))}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-titanium"
            >
              <Menu className="size-5" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
