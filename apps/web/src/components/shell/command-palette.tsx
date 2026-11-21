import * as Dialog from "@radix-ui/react-dialog";
import { CornerDownLeft, Moon, Search, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useActivityHistory } from "@/data/queries.ts";
import { activitySport, activitySportLabel, sportIcon } from "@/features/activities/activity-meta.tsx";
import { formatActivityDate, formatDistance } from "@/lib/format.ts";
import { useTheme } from "@/lib/theme.ts";
import { cn } from "@/lib/utils.ts";
import { navItems } from "./nav-items.ts";

interface PaletteContextValue {
  open: () => void;
}

const PaletteContext = createContext<PaletteContextValue>({ open: () => {} });

export function useCommandPalette() {
  return useContext(PaletteContext);
}

interface Command {
  id: string;
  group: "Ask" | "Go to" | "Preferences" | "Activities";
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

/** ⌘K / Ctrl+K anywhere in the signed-in app: jump to a screen, find a session, or ask the coach. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open: () => setOpen(true) }), []);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <AnimatePresence>
          {isOpen ? (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  className="fixed top-[12vh] left-1/2 z-50 w-[min(38rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border-hover bg-sidebar/95 shadow-2xl shadow-shade/60 outline-none ring-spectrum"
                  initial={{ opacity: 0, y: -14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                >
                  <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                  <PaletteBody close={() => setOpen(false)} />
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </AnimatePresence>
      </Dialog.Root>
    </PaletteContext.Provider>
  );
}

function PaletteBody({ close }: { close: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const history = useActivityHistory();
  const { theme, toggle } = useTheme();
  const listRef = useRef<HTMLUListElement>(null);

  const go = useCallback(
    (to: string, state?: unknown) => {
      close();
      navigate(to, state ? { state } : undefined);
    },
    [close, navigate],
  );

  const commands = useMemo<Command[]>(() => {
    const text = query.trim().toLowerCase();
    const out: Command[] = [];
    if (text.length > 0) {
      out.push({ id: "ask", group: "Ask", label: `Ask Coach: “${query.trim()}”`, hint: "Opens the chat with this question", icon: Sparkles, run: () => go("/coach", { prompt: query.trim() }) });
    }
    for (const item of navItems) {
      if (!text || item.label.toLowerCase().includes(text) || item.hint.toLowerCase().includes(text)) {
        out.push({ id: `nav-${item.to}`, group: "Go to", label: item.label, hint: item.hint, icon: item.icon, run: () => go(item.to) });
      }
    }
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (!text || `${nextTheme} mode theme appearance`.includes(text)) {
      out.push({ id: "theme", group: "Preferences", label: `Switch to ${nextTheme} mode`, hint: "Appearance", icon: nextTheme === "light" ? Sun : Moon, run: () => { toggle(); close(); } });
    }
    if (text.length >= 2) {
      const matches = (history.data ?? [])
        .filter((activity) => (activity.name ?? "").toLowerCase().includes(text) || activitySportLabel(activity).toLowerCase().includes(text))
        .slice(0, 6);
      for (const activity of matches) {
        out.push({
          id: `activity-${activity.id}`,
          group: "Activities",
          label: activity.name ?? "Untitled activity",
          hint: `${activitySportLabel(activity)} · ${formatActivityDate(activity.startDateLocal)}${activity.distance ? ` · ${formatDistance(activity.distance)}` : ""}`,
          icon: sportIcon(activitySport(activity)),
          run: () => go(`/activities/${activity.id}`),
        });
      }
    }
    return out;
  }, [query, history.data, go, theme, toggle, close]);

  const active = Math.min(cursor, Math.max(commands.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let lastGroup: string | null = null;

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setCursor((value) => Math.min(value + 1, commands.length - 1));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setCursor((value) => Math.max(value - 1, 0));
        } else if (event.key === "Enter") {
          event.preventDefault();
          commands[active]?.run();
        }
      }}
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          placeholder="Search, or ask Coach anything…"
          aria-label="Search or ask"
          aria-controls="command-list"
          aria-activedescendant={commands[active] ? `command-${commands[active].id}` : undefined}
          className="h-14 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-faint"
        />
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] text-faint sm:block">ESC</kbd>
      </div>
      <ul id="command-list" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
        {commands.length === 0 ? <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing matches.</li> : null}
        {commands.map((command, index) => {
          const header = command.group !== lastGroup ? command.group : null;
          lastGroup = command.group;
          const Icon = command.icon;
          const selected = index === active;
          return (
            <li key={command.id} role="presentation">
              {header ? <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.2em] text-faint uppercase">{header}</p> : null}
              <button
                type="button"
                id={`command-${command.id}`}
                role="option"
                aria-selected={selected}
                data-index={index}
                onMouseMove={() => setCursor(index)}
                onClick={command.run}
                className={cn("relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", selected ? "text-foreground" : "text-muted-foreground")}
              >
                {selected ? (
                  <motion.span layoutId="palette-cursor" className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-border-hover ring-inset" transition={{ type: "spring", stiffness: 600, damping: 40 }} aria-hidden="true" />
                ) : null}
                <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-lg", command.group === "Ask" ? "bg-primary-subtle text-primary" : "bg-surface-3/70")} aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{command.label}</span>
                  {command.hint ? <span className="block truncate text-xs text-faint">{command.hint}</span> : null}
                </span>
                {selected ? <CornerDownLeft className="relative size-3.5 shrink-0 text-faint" aria-hidden="true" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="hidden items-center justify-between border-t border-border px-4 py-2 text-[11px] text-faint sm:flex">
        <span>↑↓ to move · Enter to open</span>
        <span>
          <kbd className="font-sans">Ctrl</kbd> / <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">K</kbd>
        </span>
      </div>
    </div>
  );
}
