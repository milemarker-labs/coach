import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { formatClock } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import type { ActivitySplit } from "./types.ts";

/** Per-kilometer table. The fastest split is marked in bronze and the slowest in coral. */
export function SplitsTable({ splits, className }: { splits: ActivitySplit[]; className?: string }) {
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
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Km</th>
                <th className="py-2 pr-3 text-right font-medium">Pace</th>
                <th className="py-2 pr-3 text-right font-medium">Time</th>
                {hasHr ? <th className="py-2 pr-3 text-right font-medium">HR</th> : null}
                {hasElevation ? <th className="py-2 text-right font-medium">Elev.</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {splits.map((split, i) => {
                const pace = paces[i] ?? 0;
                const isComplete = split.distance >= 1000;
                return (
                  <tr key={split.index}>
                    <td className="num py-2 pr-3 text-muted-foreground">{isComplete ? split.index : `${(split.distance / 1000).toFixed(2)}`}</td>
                    <td className={cn("num py-2 pr-3 text-right font-medium", isComplete && pace === fastest ? "text-primary" : isComplete && pace === slowest && fastest !== slowest ? "text-danger" : "text-platinum")}>
                      {formatClock(pace)}
                    </td>
                    <td className="num py-2 pr-3 text-right text-muted-foreground">{formatClock(split.time)}</td>
                    {hasHr ? <td className="num py-2 pr-3 text-right text-platinum">{split.averageHeartrate ?? "—"}</td> : null}
                    {hasElevation ? <td className="num py-2 text-right text-platinum">{split.elevationGain != null ? `${split.elevationGain} m` : "—"}</td> : null}
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
