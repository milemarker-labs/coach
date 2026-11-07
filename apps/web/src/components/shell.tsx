import { Activity, Flag, LayoutDashboard, MessageCircle, RefreshCw, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils.ts";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/import", label: "Import", icon: RefreshCw },
  { to: "/analytics", label: "Analytics", icon: Sparkles },
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[220px_1fr]">
      <aside className="border-b px-5 py-6 md:border-r md:border-b-0">
        <p className="font-serif text-3xl leading-none">Coach</p>
        <p className="mt-2 text-sm text-muted-foreground">Every sport in the history, stored before it is interpreted.</p>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )
              }
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
