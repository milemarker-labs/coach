import type { QueryClient } from "@tanstack/react-query";

/** Drop cached archive screens, then refresh who is signed in. Keeps the shell mounted. */
export function dropArchiveCache(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
  return queryClient.invalidateQueries({ queryKey: ["auth"] });
}
