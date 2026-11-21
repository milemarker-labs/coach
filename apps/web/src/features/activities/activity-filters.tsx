import type { SportCount } from "@coach/shared";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/common/date-range-picker.tsx";
import { cn } from "@/lib/utils.ts";
import { SportChips } from "./sport-chips.tsx";

export interface ActivityFilterValue {
  type: string;
  range: DateRange;
  sort: "asc" | "desc";
}

export function ActivityFilters({
  value,
  onChange,
  sports,
}: {
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
  sports: SportCount[];
}) {
  const newest = value.sort === "desc";
  const SortIcon = newest ? ArrowDownWideNarrow : ArrowUpNarrowWide;
  return (
    <div className="space-y-3">
      <SportChips options={sports} value={value.type} onChange={(type) => onChange({ ...value, type })} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker id="filter-range" value={value.range} onChange={(range) => onChange({ ...value, range })} />
        <button
          type="button"
          onClick={() => onChange({ ...value, sort: newest ? "asc" : "desc" })}
          aria-label={newest ? "Sorted newest first. Switch to oldest first" : "Sorted oldest first. Switch to newest first"}
          className={cn(
            "group inline-flex h-9 items-center gap-2 self-start rounded-full border border-border bg-card/60 px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground sm:self-auto",
          )}
        >
          <SortIcon className="size-3.5 transition-transform duration-300 group-active:rotate-180" aria-hidden="true" />
          {newest ? "Newest first" : "Oldest first"}
        </button>
      </div>
    </div>
  );
}
