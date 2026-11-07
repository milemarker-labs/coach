import { Activity } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useActivityList, useSports } from "@/data/queries.ts";
import { ActivityFilters, type ActivityFilterValue } from "./activity-filters.tsx";
import { ActivityTable } from "./activity-table.tsx";

const PAGE_SIZE = 20;

export function ActivitiesPage() {
  const [filters, setFilters] = useState<ActivityFilterValue>({ type: "", range: { from: "", to: "" }, sort: "desc" });
  const [offset, setOffset] = useState(0);
  const sports = useSports();
  const list = useActivityList({
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.range.from ? { from: filters.range.from } : {}),
    ...(filters.range.to ? { to: filters.range.to } : {}),
    sort: filters.sort,
    offset,
    limit: PAGE_SIZE,
  });
  const total = list.data?.total ?? 0;
  const rows = list.data?.activities ?? [];
  const last = Math.min(offset + PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description={list.data ? `${total.toLocaleString()} activities` : "Every activity stored in Coach"} />
      <DemoBanner />
      <ActivityFilters
        value={filters}
        sports={sports.data?.sports ?? []}
        onChange={(next) => {
          setFilters(next);
          setOffset(0);
        }}
      />
      <Card className="overflow-hidden">
        {list.isLoading ? (
          <ListSkeleton rows={8} className="px-4" />
        ) : list.isError ? (
          <EmptyState icon={Activity} tone="danger" title="Activities could not be loaded" description="Check that the Coach API is running, then try again." action={<Button variant="outline" size="sm" onClick={() => void list.refetch()}>Retry</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Activity} title="No activities match" description="Widen the date range or choose another sport." />
        ) : (
          <div className={list.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <ActivityTable activities={rows} />
          </div>
        )}
      </Card>
      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3">
          <p className="num text-xs text-muted-foreground">
            {offset + 1}–{last} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset((value) => value + PAGE_SIZE)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
