import { Activity, BarChart3, CalendarRange, LayoutDashboard, RefreshCw, Settings, Sparkles, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. The rest live in the drawer. */
  primary: boolean;
  /** Shown as a hint in the command palette. */
  hint: string;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Today", icon: LayoutDashboard, primary: true, hint: "Your Marker, today's call and the week" },
  { to: "/activities", label: "Activities", icon: Activity, primary: true, hint: "Every session you have logged" },
  { to: "/training", label: "Training", icon: CalendarRange, primary: false, hint: "Fitness, fatigue, form and the long view" },
  { to: "/insights", label: "Insights", icon: BarChart3, primary: true, hint: "Volume, pace and heart rate trends" },
  { to: "/coach", label: "Coach", icon: Sparkles, primary: true, hint: "Talk to your coach about your training" },
  { to: "/sync", label: "Data & Sync", icon: RefreshCw, primary: false, hint: "Import and sync Strava" },
  { to: "/settings", label: "Settings", icon: Settings, primary: false, hint: "Connection, goals and thresholds" },
];
