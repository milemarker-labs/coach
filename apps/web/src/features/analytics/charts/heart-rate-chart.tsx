import { HeartPulse } from "lucide-react";
import type { ReactNode } from "react";
import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxis, chartColors } from "@/lib/tokens.ts";
import { formatDayLong, formatDayShort } from "../calculations/dates.ts";
import type { HeartRatePoint } from "../calculations/effort.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

export function HeartRateChart({
  points,
  status,
  scope,
  height = 260,
  className,
  actions,
}: {
  points: HeartRatePoint[];
  status: ChartStatus;
  scope?: string;
  height?: number;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <ChartCard
      title="Heart rate trend"
      description={scope ? `${scope}, beats per minute` : "Beats per minute"}
      actions={actions}
      status={status === "ready" && points.length === 0 ? "empty" : status}
      height={height}
      emptyIcon={HeartPulse}
      emptyTitle="No heart rate data"
      emptyDescription="Activities recorded without a heart rate sensor have no heart rate to chart."
      footer="Each dot is one activity's average. The line is the average of the last 5."
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="day" {...chartAxis} tickFormatter={formatDayShort} minTickGap={36} />
          <YAxis {...chartAxis} width={40} domain={[(min: number) => Math.floor(min - 6), (max: number) => Math.ceil(max + 6)]} allowDecimals={false} />
          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="plainline"
            iconSize={12}
            formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
          <Tooltip
            cursor={{ stroke: chartColors.cursor }}
            content={(props) => (
              <ChartTooltip<HeartRatePoint>
                active={props.active}
                payload={props.payload}
                render={(point) => ({
                  title: formatDayLong(point.day),
                  subtitle: point.name,
                  rows: [
                    { label: "Average", value: `${Math.round(point.average)} bpm`, color: chartColors.secondary },
                    ...(point.max != null ? [{ label: "Max", value: `${Math.round(point.max)} bpm`, color: chartColors.tertiary }] : []),
                    ...(point.trend != null ? [{ label: "5-activity average", value: `${Math.round(point.trend)} bpm`, color: chartColors.primary }] : []),
                  ],
                })}
              />
            )}
          />
          <Line
            name="Activity average"
            type="linear"
            dataKey="average"
            stroke="transparent"
            dot={{ r: 3, fill: chartColors.secondary, fillOpacity: 0.7, stroke: "none" }}
            activeDot={{ r: 5, fill: chartColors.secondary, stroke: chartColors.surface, strokeWidth: 2 }}
            legendType="circle"
            isAnimationActive={false}
          />
          <Line name="5-activity average" type="monotone" dataKey="trend" stroke={chartColors.primary} strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
