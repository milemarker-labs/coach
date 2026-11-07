import { TrendingUp } from "lucide-react";
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxis, chartColors } from "@/lib/tokens.ts";
import { formatDayLong, formatDayShort } from "../calculations/dates.ts";
import type { FitnessPoint } from "../calculations/load.ts";
import { formatSigned } from "../calculations/observations.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

export function FitnessFormChart({
  data,
  status,
  height = 260,
  className,
}: {
  data: FitnessPoint[];
  status: ChartStatus;
  height?: number;
  className?: string;
}) {
  const hasData = data.some((point) => point.fitness > 0.5 || point.fatigue > 0.5);
  return (
    <ChartCard
      title="Fitness, fatigue and form"
      description={`Last ${data.length || 90} days`}
      status={status === "ready" && !hasData ? "empty" : status}
      height={height}
      emptyIcon={TrendingUp}
      emptyTitle="Not enough training history"
      emptyDescription="Fitness and fatigue build up from several weeks of activities."
      footer="Fitness is a 42-day average of load, fatigue a 7-day average. Form is fitness minus fatigue."
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="day" {...chartAxis} tickFormatter={formatDayShort} minTickGap={32} />
          <YAxis {...chartAxis} width={40} allowDecimals={false} />
          <ReferenceLine y={0} stroke={chartColors.cursor} strokeDasharray="3 3" />
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
              <ChartTooltip<FitnessPoint>
                active={props.active}
                payload={props.payload}
                render={(point) => ({
                  title: formatDayLong(point.day),
                  rows: [
                    { label: "Fitness", value: String(Math.round(point.fitness)), color: chartColors.primary },
                    { label: "Fatigue", value: String(Math.round(point.fatigue)), color: chartColors.secondary },
                    { label: "Form", value: formatSigned(point.form), color: chartColors.tertiary },
                  ],
                })}
              />
            )}
          />
          <Line name="Fitness" type="monotone" dataKey="fitness" stroke={chartColors.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line name="Fatigue" type="monotone" dataKey="fatigue" stroke={chartColors.secondary} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line
            name="Form"
            type="monotone"
            dataKey="form"
            stroke={chartColors.tertiary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
