import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { api } from "@/lib/api.ts";
import { formatInstant } from "@/lib/format.ts";

const errors: Record<string, string> = {
  oauth_state: "The Strava connection was interrupted. Start it again.",
  access_denied: "Strava access was not granted.",
  athlete_locked: "This Coach is already locked to a different athlete.",
  strava: "Strava could not complete the connection.",
};

export function SettingsPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const auth = useQuery({ queryKey: ["auth"], queryFn: api.authStatus });
  const disconnect = useMutation({
    mutationFn: api.disconnect,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      await queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });
  const error = params.get("error");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Settings</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Strava tokens stay encrypted on the server. The browser only keeps a session cookie.
        </p>
      </header>
      {error && errors[error] ? <p className="text-sm text-destructive">{errors[error]}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{auth.data?.connected ? "Strava connected" : "Connect Strava"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {auth.data?.displayName ? `${auth.data.displayName} · athlete ${auth.data.athleteId}` : "No athlete is connected."}
          </p>
          {auth.data?.expiresAt ? <p className="text-sm text-muted-foreground">Access token expires {formatInstant(auth.data.expiresAt)}.</p> : null}
          {auth.data?.connected ? (
            <Button variant="outline" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
              Disconnect
            </Button>
          ) : (
            <Button asChild>
              <a href="/api/auth/strava">Connect Strava</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
