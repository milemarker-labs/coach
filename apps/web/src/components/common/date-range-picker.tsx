import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Select } from "@/components/ui/select.tsx";
import { addDays, todayKey } from "@/features/analytics/calculations/dates.ts";

/** Inclusive `YYYY-MM-DD` bounds. An empty string leaves that side open. */
export interface DateRange {
  from: string;
  to: string;
}

type Preset = "all" | "7" | "30" | "90" | "365" | "custom";

const presetLabels: Record<Preset, string> = {
  all: "All time",
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  "365": "Last 12 months",
  custom: "Custom range",
};

function rangeFor(preset: Exclude<Preset, "custom">): DateRange {
  if (preset === "all") return { from: "", to: "" };
  return { from: addDays(todayKey(), -(Number(preset) - 1)), to: "" };
}

export function DateRangePicker({
  value,
  onChange,
  presets = ["all", "7", "30", "90", "365"],
  id,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Exclude<Preset, "custom">[];
  id?: string;
}) {
  const [custom, setCustom] = useState(false);
  const active: Preset = custom ? "custom" : (presets.find((preset) => rangeFor(preset).from === value.from && value.to === "") ?? "custom");
  const showInputs = custom || active === "custom";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="sm:w-44">
        <Select
          id={id}
          aria-label="Date range"
          value={active}
          onChange={(event) => {
            const next = event.target.value as Preset;
            if (next === "custom") {
              setCustom(true);
              return;
            }
            setCustom(false);
            onChange(rangeFor(next));
          }}
        >
          {[...presets, "custom" as const].map((preset) => (
            <option key={preset} value={preset}>
              {presetLabels[preset]}
            </option>
          ))}
        </Select>
      </div>
      {showInputs ? (
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="From date" value={value.from} max={value.to || undefined} onChange={(event) => onChange({ ...value, from: event.target.value })} />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" aria-label="To date" value={value.to} min={value.from || undefined} onChange={(event) => onChange({ ...value, to: event.target.value })} />
        </div>
      ) : null}
    </div>
  );
}
