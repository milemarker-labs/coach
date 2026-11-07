import { Gauge } from "lucide-react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { formatClock, formatDistance } from "@/lib/format.ts";
import { chartAxis, chartColors } from "@/lib/tokens.ts";
import { formatDayLong, formatDayShort } from "../calculations/dates.ts";
import type { EffortPoint, EffortSeries } from "../calculations/effort.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

function unitFor(kind: EffortSeries["kind"]): string {
  if (kind === "pace") return "/km";
  if (kind === "swim-pace") return "/100m";
  return "km/h";
}

function formatValue(kind: EffortSeries["kind"], value: number): string {
  return kind === "speed" ? value.toFixed(1) : formatClock(value);
}

/** Pace progression for one sport. For pace, faster is higher on the chart. */
export function PaceChart({
  series,
  status,
  sportLabel,
  height = 260,
  className,
  actions,
}: {
  series: EffortSeries | null;
  status: ChartStatus;
  sportLabel?: string;
  height?: number;
  className?: string;
  actions?: ReactNode;
}) {
  const kind = series?.kind ?? "pace";
  const points = series?.points ?? [];
  const reversed = kind !== "speed";
  const label = kind === "speed" ? "Speed" : "Pace";
  return (
    <ChartCard
      title={`${label} progression`}
      description={sportLabel ? `${sportLabel}, ${unitFor(kind)}` : unitFor(kind)}
      actions={actions}
      status={status === "ready" && points.length === 0 ? "empty" : status}
      height={height}
      emptyIcon={Gauge}
      emptyTitle={`No ${label.toLowerCase()} data`}
      emptyDescription="Needs activities of at least 1 km with a recorded speed."
      footer="Each dot is one activity. The line is the average of the last 5."
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="day" {...chartAxis} tickFormatter={formatDayShort} minTickGap={36} />
          <YAxis
            {...chartAxis}
            width={44}
            reversed={reversed}
            domain={[(min: number) => Math.floor(min * 0.97), (max: number) => Math.ceil(max * 1.03)]}
            tickFormatter={(value: number) => formatValue(kind, value)}
          />
          <Tooltip
            cursor={{ stroke: chartColors.cursor }}
            content={(props) => (
              <ChartTooltip<EffortPoint>
                active={props.active}
                payload={props.payload}
                render={(point) => ({
                  title: formatDayLong(point.day),
                  subtitle: point.name,
                  rows: [
                    { label: label, value: `${formatValue(kind, point.value)} ${unitFor(kind)}`, color: chartColors.secondary },
                    ...(point.trend != null ? [{ label: "5-activity average", value: `${formatValue(kind, point.trend)} ${unitFor(kind)}`, color: chartColors.primary }] : []),
                    { label: "Distance", value: formatDistance(point.distance) },
                    ...(point.averageHeartrate != null ? [{ label: "Avg heart rate", value: `${Math.round(point.averageHeartrate)} bpm` }] : []),
                  ],
                })}
              />
            )}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="transparent"
            dot={{ r: 3, fill: chartColors.secondary, fillOpacity: 0.7, stroke: "none" }}
            activeDot={{ r: 5, fill: chartColors.secondary, stroke: chartColors.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="trend" stroke={chartColors.primary} strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
