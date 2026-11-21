import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { api } from "@/lib/api.ts";
import { cn } from "@/lib/utils.ts";
import { dropArchiveCache } from "./cache.ts";

/** One dot per roster spot: filled for approved, ringed for pending, empty when free. */
function Spots({ approved, pending, limit }: { approved: number; pending: number; limit: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`${approved} approved, ${pending} pending, ${Math.max(0, limit - approved - pending)} free of ${limit} spots`}>
      {Array.from({ length: limit }, (_, index) => {
        const state = index < approved ? "approved" : index < approved + pending ? "pending" : "free";
        return (
          <motion.span
            key={index}
            className={cn(
              "size-3 rounded-full",
              state === "approved" && "bg-gradient-to-br from-flow to-primary shadow-[0_0_10px_rgb(var(--brand-rgb)/0.25)]",
              state === "pending" && "border-2 border-warning",
              state === "free" && "border border-dashed border-border-hover",
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: reduce ? 0 : index * 0.06, type: "spring", stiffness: 420, damping: 18 }}
          />
        );
      })}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const athletes = roster.data?.athletes ?? [];
  const approvedCount = athletes.filter((athlete) => athlete.status === "approved").length;

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-flow/10 text-flow ring-1 ring-flow/25 ring-inset" aria-hidden="true">
              <Users className="size-4" />
            </span>
            Athletes
          </CardTitle>
          <CardDescription>
            {roster.data ? `${athletes.length} of ${roster.data.limit} spots are taken.` : "Up to five athletes can ask to connect."} Pending and approved athletes both use a spot. Removing one deletes
            that imported history.
          </CardDescription>
        </div>
        {roster.data ? <Spots approved={approvedCount} pending={athletes.length - approvedCount} limit={roster.data.limit} /> : null}
      </CardHeader>
      <CardContent className="mt-4">
        {roster.isLoading ? <Skeleton className="h-16" /> : null}
        {roster.isError ? <p className="text-sm text-danger">The athlete list could not be loaded.</p> : null}
        {roster.data && athletes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">No athletes have asked to connect.</p>
        ) : null}
        {athletes.length > 0 ? (
          <Stagger as="ul" className="space-y-2">
            {athletes.map((athlete) => {
              const name = athlete.displayName?.trim() || `Athlete ${athlete.athleteId}`;
              const pending = athlete.status === "pending";
              return (
                <StaggerItem
                  as="li"
                  key={athlete.userId}
                  className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-3", pending ? "border-warning/25 bg-warning/[0.04]" : "border-border bg-surface-2/40")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn("grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-semibold", pending ? "bg-warning/15 text-warning" : "bg-spectrum text-primary-foreground")}
                      aria-hidden="true"
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      <p className="num text-xs text-muted-foreground">Athlete {athlete.athleteId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={pending ? "warning" : "success"}>{pending ? "Pending" : "Approved"}</Badge>
                    {pending ? (
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
                </StaggerItem>
              );
            })}
          </Stagger>
        ) : null}
      </CardContent>
    </Card>
  );
}
