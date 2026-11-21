import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { formatClock } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import type { ActivitySplit } from "./types.ts";

/** Per-kilometer table. The fastest split is marked in brand and the slowest in red. */
export function SplitsTable({ splits, className }: { splits: ActivitySplit[]; className?: string }) {
  const reduce = useReducedMotion();
  const paces = splits.map((split) => split.time / (split.distance / 1000));
  const complete = splits.filter((split) => split.distance >= 1000);
  const completePaces = complete.map((split) => split.time / (split.distance / 1000));
  const fastest = Math.min(...completePaces);
  const slowest = Math.max(...completePaces);
  const hasHr = splits.some((split) => split.averageHeartrate != null);
  const hasElevation = splits.some((split) => split.elevationGain != null);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Split table</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wider text-faint uppercase">
                <th className="py-2 pr-3 font-semibold">Km</th>
                <th className="py-2 pr-3 font-semibold">Pace</th>
                <th className="w-full py-2 pr-3 font-semibold">
                  <span className="sr-only">Relative speed</span>
                </th>
                <th className="py-2 pr-3 text-right font-semibold">Time</th>
                {hasHr ? <th className="py-2 pr-3 text-right font-semibold">HR</th> : null}
                {hasElevation ? <th className="py-2 text-right font-semibold">Elev.</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {splits.map((split, i) => {
                const pace = paces[i] ?? 0;
                const isComplete = split.distance >= 1000;
                const isFastest = isComplete && pace === fastest;
                const isSlowest = isComplete && pace === slowest && fastest !== slowest;
                // Faster splits get longer bars: the fastest fills the column.
                const ratio = pace > 0 && Number.isFinite(fastest) ? fastest / pace : 0;
                return (
                  <tr key={split.index} className="transition-colors hover:bg-surface-2/40">
                    <td className="num py-2 pr-3 text-muted-foreground">{isComplete ? split.index : `${(split.distance / 1000).toFixed(2)}`}</td>
                    <td className={cn("num py-2 pr-3 font-display font-semibold", isFastest ? "text-primary" : isSlowest ? "text-danger" : "text-foreground")}>{formatClock(pace)}</td>
                    <td className="py-2 pr-3" aria-hidden="true">
                      <div className="h-1.5 min-w-16 overflow-hidden rounded-full bg-surface-3/50">
                        <motion.div
                          className={cn("h-full rounded-full", isFastest ? "bg-brand-gradient shadow-[0_0_10px_rgb(var(--brand-rgb)/0.28)]" : isSlowest ? "bg-danger/70" : "bg-pulse/60")}
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${Math.max(ratio, 0.04) * 100}%` }}
                          transition={{ delay: Math.min(i, 20) * 0.03, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </td>
                    <td className="num py-2 pr-3 text-right text-muted-foreground">{formatClock(split.time)}</td>
                    {hasHr ? <td className="num py-2 pr-3 text-right text-foreground">{split.averageHeartrate ?? "—"}</td> : null}
                    {hasElevation ? <td className="num py-2 text-right text-foreground">{split.elevationGain != null ? `${split.elevationGain} m` : "—"}</td> : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
