import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state.tsx";
import { DemoBanner } from "@/components/common/demo-banner.tsx";
import { ListSkeleton } from "@/components/common/loading-skeleton.tsx";
import { PageHeader } from "@/components/common/page-header.tsx";
import { AnimatedNumber } from "@/components/motion/animated-number.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useActivityList, useSports } from "@/data/queries.ts";
import { cn } from "@/lib/utils.ts";
import { ActivityFilters, type ActivityFilterValue } from "./activity-filters.tsx";
import { ActivityTable } from "./activity-table.tsx";

const PAGE_SIZE = 20;

export function ActivitiesPage() {
  const reduce = useReducedMotion();
  const [filters, setFilters] = useState<ActivityFilterValue>({ type: "", range: { from: "", to: "" }, sort: "desc" });
  const [offset, setOffset] = useState(0);
  // Which way the last page turn went, so the list slides the matching direction.
  const [direction, setDirection] = useState<1 | -1>(1);
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
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const viewKey = `${filters.type}|${filters.range.from}|${filters.range.to}|${filters.sort}|${offset}`;

  function turn(step: 1 | -1) {
    setDirection(step);
    setOffset((value) => Math.max(0, value + step * PAGE_SIZE));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Archive"
        title="Activities"
        description={
          list.data ? (
            <>
              <AnimatedNumber value={total} className="font-semibold text-foreground" /> {total === 1 ? "session" : "sessions"} on file
            </>
          ) : (
            "Every activity stored in Coach"
          )
        }
      />
      <DemoBanner />
      <ActivityFilters
        value={filters}
        sports={sports.data?.sports ?? []}
        onChange={(next) => {
          setFilters(next);
          setDirection(1);
          setOffset(0);
        }}
      />
      <Card className="overflow-hidden">
        {list.isLoading ? (
          <ListSkeleton rows={8} className="px-4" />
        ) : list.isError ? (
          <EmptyState
            icon={Activity}
            tone="danger"
            title="Activities could not be loaded"
            description="Check that the Coach API is running, then try again."
            action={
              <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
                Retry
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState icon={Activity} title="No activities match" description="Widen the date range or choose another sport." />
        ) : (
          <div className={cn("relative transition-opacity", list.isFetching && "opacity-70")}>
            {list.isFetching ? (
              <span className="absolute inset-x-0 top-0 z-10 h-0.5 animate-shimmer bg-[linear-gradient(90deg,transparent,var(--brand),transparent)] bg-[length:200%_100%]" aria-hidden="true" />
            ) : null}
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={viewKey}
                custom={direction}
                initial={reduce ? false : { opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <ActivityTable activities={rows} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </Card>
      {total > PAGE_SIZE ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          <p className="num text-xs text-muted-foreground">
            <span className="text-foreground">
              {offset + 1}–{last}
            </span>{" "}
            of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-3">
            <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-surface-2 sm:block" aria-hidden="true">
              <motion.div className="h-full rounded-full bg-brand-gradient" animate={{ width: `${(page / pages) * 100}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} />
            </div>
            <span className="num text-xs text-faint">
              Page {page} of {pages}
            </span>
            <Button variant="outline" size="icon" className="size-9" aria-label="Previous page" disabled={offset === 0} onClick={() => turn(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-9" aria-label="Next page" disabled={offset + PAGE_SIZE >= total} onClick={() => turn(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
