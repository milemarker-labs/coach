import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label.tsx";
import { Select } from "@/components/ui/select.tsx";
import { useDataMode } from "@/data/mode.ts";
import { api } from "@/lib/api.ts";
import { dropArchiveCache } from "./cache.ts";

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

  return (
    <div className="space-y-1.5 px-2">
      <Label htmlFor="archive-switch">Archive</Label>
      <Select
        id="archive-switch"
        value={auth?.viewing?.userId ?? ""}
        disabled={view.isPending}
        onChange={(event) => view.mutate(event.target.value || null)}
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
