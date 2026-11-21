import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Select } from "@/components/ui/select.tsx";
import { useDataMode } from "@/data/mode.ts";
import { api } from "@/lib/api.ts";
import { cn } from "@/lib/utils.ts";
import { dropArchiveCache } from "./cache.ts";

/** Owner-only archive picker for the sidebar. Kept compact for its narrow column. */
export function AthleteSwitcher() {
  const { auth } = useDataMode();
  const queryClient = useQueryClient();
  const owner = auth?.role === "owner";
  const roster = useQuery({ queryKey: ["athletes"], queryFn: api.athletes, enabled: owner });
  const view = useMutation({
    mutationFn: api.viewAthlete,
    onSuccess: () => dropArchiveCache(queryClient),
  });
  const approved = roster.data?.athletes.filter((athlete) => athlete.status === "approved") ?? [];
  if (!owner || (approved.length === 0 && !auth?.viewing)) return null;
  const viewingOther = Boolean(auth?.viewing);

  return (
    <div className={cn("space-y-1.5 rounded-2xl border px-2.5 py-2", viewingOther ? "border-pulse/35 bg-pulse-subtle" : "border-border bg-card/50")}>
      <label htmlFor="archive-switch" className="flex items-center gap-1.5 px-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        <Eye className={cn("size-3", viewingOther ? "text-pulse" : "text-faint")} aria-hidden="true" />
        {viewingOther ? "Viewing archive" : "Archive"}
      </label>
      <Select
        id="archive-switch"
        value={auth?.viewing?.userId ?? ""}
        disabled={view.isPending}
        onChange={(event) => view.mutate(event.target.value || null)}
        className={cn(view.isPending && "animate-pulse")}
      >
        <option value="">My archive</option>
        {approved.map((athlete) => (
          <option key={athlete.userId} value={athlete.userId}>
            {athlete.displayName?.trim() || `Athlete ${athlete.athleteId}`}
          </option>
        ))}
      </Select>
    </div>
  );
}
