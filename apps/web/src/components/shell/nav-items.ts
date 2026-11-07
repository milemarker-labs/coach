import { Activity, BarChart3, CalendarRange, LayoutDashboard, MessageSquare, RefreshCw, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. The rest live in the drawer. */
  primary: boolean;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { to: "/activities", label: "Activities", icon: Activity, primary: true },
  { to: "/training", label: "Training", icon: CalendarRange, primary: false },
  { to: "/insights", label: "Insights", icon: BarChart3, primary: true },
  { to: "/coach", label: "Chat Coach", icon: MessageSquare, primary: true },
  { to: "/sync", label: "Data & Sync", icon: RefreshCw, primary: false },
  { to: "/settings", label: "Settings", icon: Settings, primary: false },
];
