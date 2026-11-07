import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxis, chartColors } from "@/lib/tokens.ts";
import { formatDayLong, formatDayShort, formatWeekday } from "../calculations/dates.ts";
import { estimatedShare, type DailyLoad } from "../calculations/load.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

export function TrainingLoadChart({
  data,
  status,
  title = "Training load",
  description,
  height = 240,
  className,
}: {
  data: DailyLoad[];
  status: ChartStatus;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}) {
  const hasLoad = data.some((day) => day.load > 0);
  const share = estimatedShare(data);
  const short = data.length <= 8;
  return (
    <ChartCard
      title={title}
      description={description ?? `Last ${data.length || 7} days`}
      status={status === "ready" && !hasLoad ? "empty" : status}
      height={height}
      emptyIcon={Activity}
      emptyTitle="No training load in this range"
      emptyDescription="Load appears once activities with a moving time are synced."
      footer={
        share == null
          ? "Load is the Strava suffer score, or one point per moving minute when an activity has none."
          : `${Math.round(share * 100)}% of this load is estimated at one point per moving minute. The rest is Strava suffer score.`
      }
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="day" {...chartAxis} tickFormatter={short ? formatWeekday : formatDayShort} minTickGap={24} />
          <YAxis {...chartAxis} width={40} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: chartColors.cursor }}
            content={(props) => (
              <ChartTooltip<DailyLoad>
                active={props.active}
                payload={props.payload}
                render={(day) => ({
                  title: formatDayLong(day.day),
                  rows: [
                    { label: "Load", value: `${Math.round(day.load)} pts`, color: chartColors.primary },
                    { label: "Activities", value: String(day.count) },
                    ...(day.estimated > 0 ? [{ label: "Estimated", value: `${Math.round(day.estimated)} pts` }] : []),
                  ],
                })}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="load"
            stroke={chartColors.primary}
            strokeWidth={2}
            fill={chartColors.primary}
            fillOpacity={0.14}
            activeDot={{ r: 4, fill: chartColors.primary, stroke: chartColors.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
