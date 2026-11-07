import { useEffect } from "react";
import { useDataMode } from "@/data/mode.ts";
import { PublicFrame } from "@/features/landing/public-frame.tsx";

export function WaitingPage() {
  const { auth } = useDataMode();

  useEffect(() => {
    document.title = "Waiting for approval · Coach";
  }, []);

  const name = auth?.displayName?.trim();
  return (
    <PublicFrame>
      <div className="max-w-xl pt-10">
        <p className="text-xs font-medium tracking-[0.18em] text-accent-foreground uppercase">Approval</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-platinum">Waiting for approval</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {name ? `${name} is connected with Strava.` : "This Strava account is connected."} The owner has to approve it before the archive opens.
        </p>
      </div>
    </PublicFrame>
  );
}
