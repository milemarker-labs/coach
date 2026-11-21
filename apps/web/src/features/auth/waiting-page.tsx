import { Check, Hourglass, ShieldCheck, UserCheck, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button.tsx";
import { useDataMode } from "@/data/mode.ts";
import { PublicFrame } from "@/features/landing/public-frame.tsx";
import { cn } from "@/lib/utils.ts";

const steps: { icon: LucideIcon; label: string; state: "done" | "now" | "next" }[] = [
  { icon: Check, label: "Strava connected", state: "done" },
  { icon: ShieldCheck, label: "Owner approves", state: "now" },
  { icon: UserCheck, label: "Your archive opens", state: "next" },
];

export function WaitingPage() {
  const { auth } = useDataMode();
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "Waiting for approval · Coach";
  }, []);

  const name = auth?.displayName?.trim();
  return (
    <PublicFrame>
      <div className="mx-auto flex max-w-xl flex-col items-center pt-10 text-center sm:pt-16">
        {/* An hourglass inside pulsing rings: something is happening, just not here. */}
        <div className="relative grid size-36 place-items-center">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-0 rounded-full border border-pulse/40"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={reduce ? { scale: 0.8, opacity: 0.4 } : { scale: [0.5, 1.15], opacity: [0.7, 0] }}
              transition={{ duration: 3, repeat: reduce ? 0 : Infinity, delay: ring, ease: "easeOut" }}
              aria-hidden="true"
            />
          ))}
          <div className="absolute inset-8 rounded-full bg-spectrum opacity-30 blur-xl" aria-hidden="true" />
          <motion.span
            className="relative grid size-16 place-items-center rounded-2xl border border-border-hover bg-surface-2 text-primary"
            animate={reduce ? undefined : { rotate: [0, 0, 180, 180] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 1], ease: "easeInOut" }}
            aria-hidden="true"
          >
            <Hourglass className="size-7" />
          </motion.span>
        </div>

        <p className="mt-8 text-[11px] font-semibold tracking-[0.22em] text-accent-foreground uppercase">Approval</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{name ? `Almost there, ${name.split(" ")[0]}.` : "Almost there."}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {name ? `${name} is connected with Strava.` : "This Strava account is connected."} The owner has to approve it before the archive opens. Check back soon, or read the public journal while you
          wait.
        </p>

        <ol className="mt-10 grid w-full gap-2 text-left sm:grid-cols-3">
          {steps.map((step, index) => (
            <motion.li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                step.state === "done" && "border-success/25 bg-success/[0.06]",
                step.state === "now" && "border-pulse/40 bg-pulse-subtle",
                step.state === "next" && "border-dashed border-border",
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  step.state === "done" ? "bg-success/15 text-success" : step.state === "now" ? "bg-pulse/20 text-pulse" : "bg-surface-2 text-faint",
                )}
                aria-hidden="true"
              >
                <step.icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {step.label}
                <span className="sr-only">{step.state === "done" ? " (done)" : step.state === "now" ? " (in progress)" : " (next)"}</span>
              </span>
            </motion.li>
          ))}
        </ol>

        <Link to="/mangesh" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
          Read the public journal
        </Link>
      </div>
    </PublicFrame>
  );
}
