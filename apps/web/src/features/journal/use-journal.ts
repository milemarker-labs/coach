import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.ts";

export function useJournal() {
  return useQuery({
    queryKey: ["journal", "mangesh"],
    queryFn: api.journal,
    staleTime: 60_000,
  });
}
