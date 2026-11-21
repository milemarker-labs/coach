import { FlaskConical } from "lucide-react";
import { buttonVariants } from "@/components/ui/button.tsx";
import { useDataMode } from "@/data/mode.ts";
import { cn } from "@/lib/utils.ts";

/** Shown whenever generated demo data is on screen, so it can never pass for real training. */
export function DemoBanner() {
  const { mode, reason } = useDataMode();
  if (mode !== "demo") return null;
  return (
    <div className="animate-fade-in relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-warning/25 bg-warning/[0.06] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(var(--warning-rgb)/0.05)_0_10px,transparent_10px_20px)]" aria-hidden="true" />
      <p className="relative flex items-start gap-2 text-warning">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Demo data.</span> {reason} These activities are generated and are not yours.
        </span>
      </p>
      <a href="/api/auth/strava" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative self-start sm:self-auto")}>
        Connect Strava
      </a>
    </div>
  );
}
