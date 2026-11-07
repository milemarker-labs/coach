import type { Journal, JournalEntry } from "@coach/shared";
import { sportKey, sportLabel } from "@coach/shared";
import { useEffect } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card.tsx";
import { buttonVariants } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { formatJournalRange } from "@/features/journal/days.ts";
import { useJournal } from "@/features/journal/use-journal.ts";
import { formatDistance, formatDuration } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { PublicFrame } from "./public-frame.tsx";
import { SampleDashboard } from "./sample-dashboard.tsx";

export function LandingPage() {
  const { reason } = useDataMode();

  useEffect(() => {
    document.title = "Coach";
  }, []);

  return (
    <PublicFrame>
      <div className="grid items-start gap-12 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-16 lg:pt-14">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-accent-foreground uppercase">Personal training archive</p>
          <h1 className="mt-4 max-w-xl text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-platinum sm:text-5xl">
            A private coach for one athlete.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Coach keeps one Strava history and turns it into load, form, and a conversation. Sign in to open the archive. Anyone can read the last seven days.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="/api/auth/strava" className={cn(buttonVariants(), "h-10 px-5")}>
              Connect Strava
            </a>
            <Link to="/mangesh" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
              Read the journal
            </Link>
          </div>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-faint">
            Strava sign-in is limited to the athlete this archive was built for.{" "}
            <a href="#one-profile" className="text-titanium underline-offset-2 hover:text-platinum hover:underline">
              Want it for your profile?
            </a>
          </p>
          {reason === "The Coach API could not be reached." ? <p className="mt-3 text-sm text-danger">Coach could not be reached just now.</p> : null}
        </div>
        <WeekPanel />
      </div>

      <section className="mt-16 border-t border-border pt-10 lg:mt-24" aria-labelledby="dashboard-heading">
        <p className="text-xs font-medium tracking-[0.18em] text-accent-foreground uppercase">Inside the archive</p>
        <h2 id="dashboard-heading" className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-platinum sm:text-3xl">
          The dashboard, with a sample history.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Sign-in opens this layout for one Strava history. The sample below uses invented numbers so the shape is visible without an account: the fields Coach stores, the reading it makes from them, and the cards, chart, and note it puts on the page.
        </p>
        <div className="mt-8">
          <SampleDashboard />
        </div>
      </section>

      <section id="one-profile" className="mt-16 scroll-mt-20 border-t border-border pt-10" aria-labelledby="profile-heading">
        <p className="text-xs font-medium tracking-[0.18em] text-accent-foreground uppercase">One profile</p>
        <h2 id="profile-heading" className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-platinum sm:text-3xl">
          This copy of Coach only works for one profile.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Connect Strava only signs in the athlete this archive was built for. The dashboard, the sync, and the coach all read that one history. A different Strava account cannot sign in. The public journal is the last seven days of the same profile.
        </p>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          If you want Coach for your own profile, send a mail to{" "}
          <a href="mailto:milemarkerlabs@gmail.com?subject=Coach%20for%20my%20Strava%20profile" className="font-medium text-platinum underline-offset-2 hover:underline">
            milemarkerlabs@gmail.com
          </a>
          .
        </p>
        <a href="mailto:milemarkerlabs@gmail.com?subject=Coach%20for%20my%20Strava%20profile" className={cn(buttonVariants(), "mt-6 h-10 px-5")}>
          Email Milemarker Labs
        </a>
      </section>

      <dl className="mt-16 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
        <Fact title="Archive" body="Every sport Strava records, stored once and read from the same place." />
        <Fact title="Reading" body="Fitness, fatigue, and form come from the history, not from a guess." />
        <Fact title="Journal" body="The current week, rest days included, is published for anyone to read." />
      </dl>
      <p className="mt-16 text-xs text-faint">Coach · Milemarker Labs</p>
    </PublicFrame>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-platinum">{title}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</dd>
    </div>
  );
}

function WeekPanel() {
  const journal = useJournal();
  return (
    <Card className="overflow-hidden p-0 hover:border-border">
      <div className="h-1 bg-metal-bronze" aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <p className="text-xs font-medium text-muted-foreground">This week</p>
        {journal.isLoading ? (
          <div className="mt-4 space-y-3" role="status" aria-label="Loading this week">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-6 h-16 w-full" />
          </div>
        ) : journal.isError || !journal.data ? (
          <p className="mt-4 text-sm text-muted-foreground">The journal could not be loaded.</p>
        ) : (
          <WeekBody data={journal.data} />
        )}
      </div>
    </Card>
  );
}

function WeekBody({ data }: { data: Journal }) {
  const recent = data.activities.slice(0, 3);
  return (
    <>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-platinum">{data.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{formatJournalRange(data.from, data.to)}</p>
      {data.activities.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No sessions in these seven days.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-t border-border">
          {recent.map((activity) => (
            <SessionLine key={activity.id} activity={activity} />
          ))}
        </ul>
      )}
      <Link to="/mangesh" className="mt-5 inline-flex text-xs font-medium text-primary hover:underline">
        {data.activities.length > 3 ? `Read all ${data.activities.length} sessions` : "Read the journal"}
      </Link>
    </>
  );
}

function SessionLine({ activity }: { activity: JournalEntry }) {
  const sport = sportLabel(sportKey(activity.sportType, activity.activityType));
  const primary = activity.distance ? formatDistance(activity.distance) : formatDuration(activity.movingTime ?? activity.elapsedTime);
  return (
    <li className="flex items-baseline justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-platinum">{activity.name?.trim() || sport}</span>
        <span className="block truncate text-xs text-muted-foreground">{sport}</span>
      </span>
      <span className="num shrink-0 text-sm text-muted-foreground">{primary}</span>
    </li>
  );
}
