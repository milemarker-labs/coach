import type { AuthStatus } from "@coach/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.ts";

/**
 * Where screens read their data from.
 *  - `live`: a Strava athlete is connected, so everything comes from the API.
 *  - `demo`: nothing is connected (or the API is unreachable), so a generated demo history is shown
 *    and the interface says so. Demo data is never mixed with live data.
 */
export type DataMode = "loading" | "live" | "demo";

export interface DataModeState {
  mode: DataMode;
  auth: AuthStatus | null;
  /** Why demo data is showing, for the banner. */
  reason: string | null;
}

const forcedDemo = import.meta.env.VITE_DEMO_DATA === "true";

export function useDataMode(): DataModeState {
  const auth = useQuery({ queryKey: ["auth"], queryFn: api.authStatus });
  if (forcedDemo) return { mode: "demo", auth: auth.data ?? null, reason: "Demo data is forced by VITE_DEMO_DATA." };
  if (auth.isLoading) return { mode: "loading", auth: null, reason: null };
  if (auth.isError) return { mode: "demo", auth: null, reason: "The Coach API could not be reached." };
  if (!auth.data?.connected) return { mode: "demo", auth: auth.data ?? null, reason: "Strava is not connected." };
  return { mode: "live", auth: auth.data, reason: null };
}
