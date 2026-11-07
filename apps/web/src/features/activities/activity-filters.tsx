import type { SportCount } from "@coach/shared";
import { sportLabel } from "@coach/shared";
import { DateRangePicker, type DateRange } from "@/components/common/date-range-picker.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select } from "@/components/ui/select.tsx";

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
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <div className="space-y-1.5 md:w-52">
        <Label htmlFor="filter-sport">Sport</Label>
        <Select id="filter-sport" value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value })}>
          <option value="">All sports</option>
          {sports.map((item) => (
            <option key={item.sport} value={item.sport}>
              {sportLabel(item.sport)} ({item.count})
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-range">Date range</Label>
        <DateRangePicker id="filter-range" value={value.range} onChange={(range) => onChange({ ...value, range })} />
      </div>
      <div className="space-y-1.5 md:w-40">
        <Label htmlFor="filter-sort">Sort</Label>
        <Select id="filter-sort" value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value === "asc" ? "asc" : "desc" })}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </div>
    </div>
  );
}
