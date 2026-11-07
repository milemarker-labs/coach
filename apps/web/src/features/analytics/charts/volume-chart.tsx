import { Mountain, Route } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatHoursMinutes } from "@/lib/format.ts";
import { chartAxis, chartColors } from "@/lib/tokens.ts";
import { formatDayLong, formatMonthShort } from "../calculations/dates.ts";
import type { BucketUnit, VolumeBucket } from "../calculations/volume.ts";
import { ChartCard, type ChartStatus } from "./chart-card.tsx";
import { ChartTooltip } from "./chart-tooltip.tsx";

export type VolumeMetric = "distance" | "elevation" | "time";

interface MetricConfig {
  unit: string;
  read: (bucket: VolumeBucket) => number;
  format: (value: number) => string;
}

const metrics: Record<VolumeMetric, MetricConfig> = {
  distance: { unit: "km", read: (b) => Math.round(b.distance / 100) / 10, format: (v) => `${v.toFixed(1)} km` },
  elevation: { unit: "m", read: (b) => Math.round(b.elevation), format: (v) => `${Math.round(v)} m` },
  time: { unit: "h", read: (b) => Math.round(b.movingTime / 360) / 10, format: (v) => formatHoursMinutes(v * 3600) },
};

interface Datum extends VolumeBucket {
  value: number;
}

function VolumeBarChart({ data, metric, unit }: { data: VolumeBucket[]; metric: VolumeMetric; unit: BucketUnit }) {
  const config = metrics[metric];
  const rows: Datum[] = data.map((bucket) => ({ ...bucket, value: config.read(bucket) }));
  const last = rows.length - 1;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="label" {...chartAxis} interval="preserveStartEnd" minTickGap={14} />
        <YAxis {...chartAxis} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(182, 191, 194, 0.06)" }}
          content={(props) => (
            <ChartTooltip<Datum>
              active={props.active}
              payload={props.payload}
              render={(bucket) => ({
                title: unit === "week" ? `Week of ${formatDayLong(bucket.key)}` : `${formatMonthShort(bucket.key)} ${bucket.key.slice(0, 4)}`,
                rows: [
                  { label: metric === "distance" ? "Distance" : metric === "elevation" ? "Elevation gain" : "Moving time", value: config.format(bucket.value), color: chartColors.primary },
                  { label: "Activities", value: String(bucket.count) },
                ],
              })}
            />
          )}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {rows.map((row, index) => (
            <Cell key={row.key} fill={chartColors.primary} fillOpacity={index === last ? 1 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface VolumeCardProps {
  data: VolumeBucket[];
  status: ChartStatus;
  height?: number;
  className?: string;
  actions?: ReactNode;
}

function hasVolume(data: VolumeBucket[], metric: VolumeMetric): boolean {
  return data.some((bucket) => metrics[metric].read(bucket) > 0);
}

function headline(label: string, value: string, caption: string) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="num text-3xl font-bold tracking-tight">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{caption}</span>
    </div>
  );
}

export function WeeklyMileageChart({ data, status, height = 240, className, actions }: VolumeCardProps) {
  const current = data.at(-1);
  const best = data.reduce<VolumeBucket | null>((top, bucket) => (top == null || bucket.distance > top.distance ? bucket : top), null);
  return (
    <ChartCard
      title="Weekly mileage"
      description={`Kilometers per week, last ${data.length || 12} weeks`}
      actions={actions}
      status={status === "ready" && !hasVolume(data, "distance") ? "empty" : status}
      height={height}
      emptyIcon={Route}
      emptyTitle="No distance recorded"
      emptyDescription="Weekly mileage appears once activities with a distance are synced."
      headline={
        current
          ? headline("km this week", metrics.distance.read(current).toFixed(1), best && best.distance > 0 ? `Best week ${metrics.distance.read(best).toFixed(1)} km` : "")
          : null
      }
      className={className}
    >
      <VolumeBarChart data={data} metric="distance" unit="week" />
    </ChartCard>
  );
}

export function MonthlyMileageChart({ data, status, height = 240, className, actions }: VolumeCardProps) {
  const current = data.at(-1);
  return (
    <ChartCard
      title="Monthly mileage"
      description={`Kilometers per month, last ${data.length || 12} months`}
      actions={actions}
      status={status === "ready" && !hasVolume(data, "distance") ? "empty" : status}
      height={height}
      emptyIcon={Route}
      emptyTitle="No distance recorded"
      emptyDescription="Monthly mileage appears once activities with a distance are synced."
      headline={current ? headline("km this month", metrics.distance.read(current).toFixed(1), "") : null}
      className={className}
    >
      <VolumeBarChart data={data} metric="distance" unit="month" />
    </ChartCard>
  );
}

export function ElevationChart({ data, status, height = 240, className, actions }: VolumeCardProps) {
  const current = data.at(-1);
  return (
    <ChartCard
      title="Elevation gain"
      description={`Meters climbed per week, last ${data.length || 12} weeks`}
      actions={actions}
      status={status === "ready" && !hasVolume(data, "elevation") ? "empty" : status}
      height={height}
      emptyIcon={Mountain}
      emptyTitle="No elevation recorded"
      emptyDescription="Elevation gain appears once synced activities report it."
      headline={current ? headline("m this week", String(metrics.elevation.read(current)), "") : null}
      className={className}
    >
      <VolumeBarChart data={data} metric="elevation" unit="week" />
    </ChartCard>
  );
}

