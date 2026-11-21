import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Light and dark mode. The initial theme is applied before first paint by the inline script in
 * index.html (stored choice, else the system setting); this module keeps it in sync afterwards.
 * With no stored choice, the app follows the system setting live.
 */
export type Theme = "light" | "dark";

const STORAGE_KEY = "coach-theme";
const META_COLORS: Record<Theme, string> = { dark: "#0b0d17", light: "#f2f0eb" };
const listeners = new Set<() => void>();

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(theme: Theme, animate: boolean) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animate && !reduce) {
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 320);
  }
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLORS[theme]);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The active theme, a setter that remembers the choice, and a toggle. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "dark" as Theme);

  // Follow the system while the athlete has not picked a theme.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (!stored()) apply(systemTheme(), true);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    apply(next, true);
  }, []);

  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggle };
}
