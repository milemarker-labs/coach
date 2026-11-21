import { Layers } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatClock } from "@/lib/format.ts";
import { chartAxis, chartColors, chartMotion } from "@/lib/tokens.ts";
import type { ActivitySplit } from "@/features/activities/types.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartDefs, useChartIds } from "./chart-defs.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

interface Datum {
  index: number;
  pace: number;
  /** Bar height. Faster splits are taller, so effort reads left to right at a glance. */
  height: number;
  fastest: boolean;
  split: ActivitySplit;
}

function splitPace(split: ActivitySplit): number {
  return split.time / (split.distance / 1000);
}

/** Pace per kilometer split. Taller bars are faster; the fastest split is brand. */
export function SplitsChart({ splits, status, height = 220, className }: { splits: ActivitySplit[] | null; status: ChartStatus; height?: number; className?: string }) {
  const ids = useChartIds();
  const paces = (splits ?? []).map(splitPace);
  const slowest = Math.max(...paces, 0);
  const fastest = Math.min(...paces, Infinity);
  const data: Datum[] = (splits ?? []).map((split, i) => ({
    index: split.index,
    pace: paces[i] ?? 0,
    height: slowest + 30 - (paces[i] ?? 0),
    fastest: paces[i] === fastest,
    split,
  }));
  return (
    <ChartCard
      title="Splits"
      description="Pace per kilometer. Taller bars are faster."
      status={status === "ready" && data.length === 0 ? "unavailable" : status}
      height={height}
      emptyIcon={Layers}
      emptyDescription="Per-kilometer splits are not stored for this activity. Coach currently syncs activity summaries only."
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap="18%">
          <ChartDefs ids={ids} />
          <XAxis dataKey="index" {...chartAxis} interval="preserveStartEnd" minTickGap={10} />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            cursor={{ fill: "rgb(var(--line-rgb)/0.06)", radius: 6 }}
            content={(props) => (
              <ChartTooltip<Datum>
                active={props.active}
                payload={props.payload}
                render={(item) => ({
                  title: item.split.distance < 1000 ? `Final ${(item.split.distance / 1000).toFixed(2)} km` : `Kilometer ${item.index}`,
                  rows: [
                    { label: "Pace", value: `${formatClock(item.pace)} /km`, color: item.fastest ? chartColors.primary : chartColors.secondary },
                    ...(item.split.averageHeartrate != null ? [{ label: "Heart rate", value: `${item.split.averageHeartrate} bpm` }] : []),
                    ...(item.split.elevationGain != null ? [{ label: "Elevation gain", value: `${item.split.elevationGain} m` }] : []),
                  ],
                })}
              />
            )}
          />
          <Bar dataKey="height" radius={[6, 6, 2, 2]} {...chartMotion}>
            {data.map((item) => (
              <Cell
                key={item.index}
                fill={item.fastest ? `url(#${ids.bar})` : `url(#${ids.barMuted})`}
                style={item.fastest ? { filter: "drop-shadow(0 0 8px rgb(var(--brand-rgb)/0.25))" } : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
