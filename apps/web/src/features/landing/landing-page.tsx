import type { Journal, JournalEntry } from "@coach/shared";
import { SCORE_NAME, sportKey, sportLabel } from "@coach/shared";
import { ArrowRight, BookOpen, Database, Gauge, ShieldCheck, Sparkles, UserCheck, Users, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { Stagger, StaggerItem } from "@/components/motion/stagger.tsx";
import { buttonVariants } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDataMode } from "@/data/mode.ts";
import { SportBadge } from "@/features/activities/activity-meta.tsx";
import { formatJournalRange, journalDays, journalTotals } from "@/features/journal/days.ts";
import { useJournal } from "@/features/journal/use-journal.ts";
import { WeekStrip } from "@/features/journal/week-strip.tsx";
import { formatDistance, formatDuration, formatHoursMinutes } from "@/lib/format.ts";
import { cn } from "@/lib/utils.ts";
import { HeroStage } from "./hero-stage.tsx";
import { HowItWorks } from "./how-it-works.tsx";
import { PublicFrame } from "./public-frame.tsx";
import { SampleDashboard } from "./sample-dashboard.tsx";

const EASE = [0.16, 1, 0.3, 1] as const;

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold tracking-[0.22em] text-accent-foreground uppercase", className)}>{children}</p>;
}

export function LandingPage() {
  const { reason } = useDataMode();

  useEffect(() => {
    document.title = "Coach · Know where your fitness stands";
  }, []);

  return (
    <PublicFrame>
      {/* Hero */}
      <section className="grid items-center gap-14 pt-4 pb-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pt-12" aria-labelledby="hero-heading">
        <Stagger>
          <StaggerItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 py-1 pr-3 pl-1 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">New</span>
              The {SCORE_NAME}: one number for your fitness
            </span>
          </StaggerItem>
          <StaggerItem>
            <h1 id="hero-heading" className="mt-6 text-[2.7rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.2rem]">
              A coach that reads every log <span className="text-spectrum">and tells you what&apos;s next.</span>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Coach turns your Strava history into load, form and a single 0–100 {SCORE_NAME}. Every day you get a call (rest, easy, long or hard) and a few directions. Ask about any of them in
              plain words.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/api/auth/strava" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Connect Strava
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <Link to="/mangesh" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <BookOpen className="size-4" aria-hidden="true" />
                Read the journal
              </Link>
            </div>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-5 max-w-md text-xs leading-relaxed text-faint">
              A new athlete waits until the owner approves.{" "}
              <a href="#approval" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                How approval works
              </a>
            </p>
            {reason === "The Coach API could not be reached." ? <p className="mt-3 text-sm text-danger">Coach could not be reached just now.</p> : null}
          </StaggerItem>
        </Stagger>
        <HeroStage />
      </section>

      {/* Live week */}
      <motion.section
        className="mt-16 lg:mt-24"
        aria-labelledby="week-heading"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <WeekPanel />
      </motion.section>

      {/* How it works */}
      <section className="mt-24 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16" aria-labelledby="flow-heading">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="flow-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From raw logs to a plan for today.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            No guesswork and no black box. Every number Coach shows is plain arithmetic on what you recorded, and the {SCORE_NAME} explains its own parts.
          </p>
        </div>
        <HowItWorks />
      </section>

      {/* Sample dashboard */}
      <section className="mt-24 border-t border-border pt-12" aria-labelledby="dashboard-heading">
        <Eyebrow>Inside the archive</Eyebrow>
        <h2 id="dashboard-heading" className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          The dashboard, with a sample history.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Signing in opens this layout for one athlete&apos;s Strava history. The sample below uses invented numbers so you can see the shape without an account: the fields Coach stores, how it
          reads them, and the cards, chart and note it puts on the page.
        </p>
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ transformPerspective: 1400 }}
        >
          <SampleDashboard />
        </motion.div>
      </section>

      {/* Approval */}
      <section id="approval" className="mt-24 scroll-mt-24" aria-labelledby="approval-heading">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 p-6 sm:p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-pulse/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-30 mask-radial" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <Eyebrow>Approval</Eyebrow>
              <h2 id="approval-heading" className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Five athletes can connect.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                Each Strava account waits for the owner. After approval, the dashboard, the sync and the coach read that athlete&apos;s history. The owner can open any approved archive. The public
                journal always shows the owner&apos;s last seven days.
              </p>
              <a href="/api/auth/strava" className={cn(buttonVariants(), "mt-6")}>
                Connect Strava
              </a>
            </div>
            <ApprovalFlow />
          </div>
        </div>
      </section>

      <Stagger as="dl" inView className="mt-16 grid gap-4 sm:grid-cols-3">
        <Fact icon={Database} title="Archive" body="Every sport Strava records, stored once and read from the same place." />
        <Fact icon={Gauge} title="Reading" body={`Fitness, fatigue, form and the ${SCORE_NAME} come from your history, not from a guess.`} />
        <Fact icon={BookOpen} title="Journal" body="The current week, rest days included, is published for anyone to read." />
      </Stagger>
      <p className="mt-16 flex items-center gap-2 text-xs text-faint">
        <img src="/logo.svg" alt="" width={16} height={16} className="size-4 opacity-70" />
        Coach · Milemarker Labs
      </p>
    </PublicFrame>
  );
}

function ApprovalFlow() {
  const steps: { icon: LucideIcon; label: string }[] = [
    { icon: Users, label: "Connect" },
    { icon: ShieldCheck, label: "Owner approves" },
    { icon: UserCheck, label: "Archive opens" },
  ];
  return (
    <Stagger as="ol" inView className="flex items-center gap-2 sm:gap-3" gap={0.15}>
      {steps.map((step, index) => (
        <StaggerItem as="li" key={step.label} className="flex items-center gap-2 sm:gap-3">
          <span className="flex flex-col items-center gap-2">
            <span className="grid size-12 place-items-center rounded-2xl border border-border-hover bg-surface-2 text-foreground">
              <step.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-medium whitespace-nowrap text-muted-foreground">{step.label}</span>
          </span>
          {index < steps.length - 1 ? <span className="mb-6 h-px w-6 bg-gradient-to-r from-pulse to-primary sm:w-10" aria-hidden="true" /> : null}
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function Fact({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <StaggerItem className="rounded-2xl border border-border bg-card/60 p-5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary-subtle text-primary" aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <dt className="mt-4 font-display text-sm font-semibold text-foreground">{title}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</dd>
    </StaggerItem>
  );
}

function WeekPanel() {
  const journal = useJournal();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70">
      <div className="h-px bg-spectrum" aria-hidden="true" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping-soft rounded-full bg-success" aria-hidden="true" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            Live from the journal
          </p>
          <Link to="/mangesh" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Open the journal <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        {journal.isLoading ? (
          <div className="mt-6 space-y-3" role="status" aria-label="Loading this week">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-6 h-24 w-full" />
          </div>
        ) : journal.isError || !journal.data ? (
          <p className="mt-6 text-sm text-muted-foreground">The journal could not be loaded.</p>
        ) : (
          <WeekBody data={journal.data} />
        )}
      </div>
    </div>
  );
}

function WeekBody({ data }: { data: Journal }) {
  const recent = data.activities.slice(0, 3);
  const totals = journalTotals(data.activities);
  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <h2 id="week-heading" className="text-3xl font-semibold tracking-tight">
          {data.name}&apos;s week
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{formatJournalRange(data.from, data.to)}</p>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          <Stat label="Sessions" value={String(totals.count)} />
          <Stat label="Distance" value={`${(totals.distance / 1000).toFixed(1)} km`} />
          <Stat label="Moving" value={formatHoursMinutes(totals.movingTime)} />
          {data.score ? <Stat label={SCORE_NAME} value={String(data.score.value)} accent /> : null}
        </dl>
        <WeekStrip days={journalDays(data)} height={80} className="mt-6" />
      </div>
      <div>
        {data.activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions in these seven days. Rest counts too.</p>
        ) : (
          <Stagger as="ul" inView className="space-y-2">
            {recent.map((activity) => (
              <SessionLine key={activity.id} activity={activity} />
            ))}
          </Stagger>
        )}
        {data.activities.length > 3 ? (
          <Link to="/mangesh" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Read all {data.activities.length} sessions
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className={cn("num font-display text-xl font-semibold", accent ? "text-spectrum" : "text-foreground")}>{value}</dd>
    </div>
  );
}

function SessionLine({ activity }: { activity: JournalEntry }) {
  const sport = sportKey(activity.sportType, activity.activityType);
  const label = sportLabel(sport);
  const primary = activity.distance ? formatDistance(activity.distance) : formatDuration(activity.movingTime ?? activity.elapsedTime);
  return (
    <StaggerItem as="li" className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
      <SportBadge sport={sport} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{activity.name?.trim() || label}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
      <span className="num shrink-0 font-display text-sm font-semibold text-foreground">{primary}</span>
    </StaggerItem>
  );
}
