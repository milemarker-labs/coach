import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api.ts";

export function useJobRunner(jobId: string | null) {
  const queryClient = useQueryClient();
  const lock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (current) => (current.state.data?.status === "running" ? 2000 : false),
  });

  useEffect(() => {
    if (!data || data.status !== "pending") return;
    const wait = data.retryAfter ? Math.max(Date.parse(data.retryAfter) - Date.now(), 0) : 0;
    const timer = window.setTimeout(() => {
      if (lock.current) return;
      lock.current = true;
      setError(null);
      api
        .continueJob(data.id)
        .then((next) => {
          queryClient.setQueryData(["job", next.id], next);
          void queryClient.invalidateQueries({ queryKey: ["sync-status"] });
          void queryClient.invalidateQueries({ queryKey: ["activities"] });
          void queryClient.invalidateQueries({ queryKey: ["sports"] });
        })
        .catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 409) {
            void refetch();
            return;
          }
          setError(caught instanceof Error ? caught.message : "Sync failed");
        })
        .finally(() => {
          lock.current = false;
        });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [data, queryClient, refetch]);

  return { job: data ?? null, error, isLoading };
}
