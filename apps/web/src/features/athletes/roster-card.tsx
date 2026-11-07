import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { api } from "@/lib/api.ts";
import { dropArchiveCache } from "./cache.ts";

export function RosterCard() {
  const { auth } = useDataMode();
  const queryClient = useQueryClient();
  const roster = useQuery({ queryKey: ["athletes"], queryFn: api.athletes });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["athletes"] });
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  };
  const approve = useMutation({ mutationFn: api.approveAthlete, onSuccess: refresh });
  const deny = useMutation({ mutationFn: api.denyAthlete, onSuccess: refresh });
  const remove = useMutation({
    mutationFn: api.removeAthlete,
    onSuccess: (_result, id) => {
      if (auth?.viewing?.userId === id) return dropArchiveCache(queryClient);
      return refresh();
    },
  });
  const busy = approve.isPending || deny.isPending || remove.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle>Athletes</CardTitle>
          <CardDescription>
            {roster.data ? `${roster.data.athletes.length} of ${roster.data.limit} spots are taken.` : "Up to five athletes can ask to connect."} Pending and approved athletes both use a spot. Removing one deletes that imported history.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        {roster.isLoading ? <Skeleton className="h-16" /> : null}
        {roster.isError ? <p className="text-sm text-danger">The athlete list could not be loaded.</p> : null}
        {roster.data && roster.data.athletes.length === 0 ? <p className="text-sm text-muted-foreground">No athletes have asked to connect.</p> : null}
        {roster.data && roster.data.athletes.length > 0 ? (
          <ul className="divide-y divide-border border-t border-border">
            {roster.data.athletes.map((athlete) => {
              const name = athlete.displayName?.trim() || `Athlete ${athlete.athleteId}`;
              return (
                <li key={athlete.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-platinum">{name}</p>
                    <p className="text-xs text-muted-foreground">Athlete {athlete.athleteId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={athlete.status === "approved" ? "success" : "warning"}>{athlete.status === "approved" ? "Approved" : "Pending"}</Badge>
                    {athlete.status === "pending" ? (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => approve.mutate(athlete.userId)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => deny.mutate(athlete.userId)}>
                          Deny
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove.mutate(athlete.userId)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
