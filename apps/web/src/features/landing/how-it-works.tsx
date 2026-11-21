import { Compass, Database, Gauge, MessageSquare, Zap, type LucideIcon } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils.ts";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  tag: string;
}

const steps: Step[] = [
  { icon: Zap, tag: "01", title: "Connect Strava", body: "One tap. Coach reads your activities and never posts anything back to Strava." },
  { icon: Database, tag: "02", title: "Every log is read", body: "Every sport and session, with distance, time, climb, heart rate and suffer score, stored once and kept in one place." },
  { icon: Gauge, tag: "03", title: "Your Marker, 0 to 100", body: "Base, consistency, balance, momentum and efficiency, blended into one number you can watch move." },
  { icon: Compass, tag: "04", title: "Today's call and directions", body: "Rest, go easy, go long, or go hard, with a duration based on your own training. Then the few changes that matter most this week." },
  { icon: MessageSquare, tag: "05", title: "Ask the coach", body: "A conversation grounded in your numbers. The numbers come from your logs; the words come from a model." },
];

/** A vertical flow whose spine draws as you scroll. Each step lights up as the line reaches it. */
export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const [reached, setReached] = useState(reduce ? steps.length : 0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (reduce) return;
    setReached(Math.min(steps.length, Math.floor(value * steps.length + 0.35)));
  });

  return (
    <ol ref={ref} className="relative space-y-4 pl-12 sm:pl-16">
      <span className="absolute top-2 bottom-2 left-[19px] w-px bg-border sm:left-[27px]" aria-hidden="true" />
      <motion.span
        className="absolute top-2 bottom-2 left-[19px] w-px origin-top bg-gradient-to-b from-pulse via-flow to-primary sm:left-[27px]"
        style={{ scaleY: reduce ? 1 : progress }}
        aria-hidden="true"
      />
      {steps.map((step, index) => {
        const lit = index < reached;
        const Icon = step.icon;
        return (
          <li key={step.title} className="relative">
            <span
              className={cn(
                "absolute top-4 -left-12 grid size-10 place-items-center rounded-full border transition-all duration-500 sm:-left-16 sm:size-14",
                lit ? "border-primary/50 bg-primary-subtle text-primary shadow-[0_0_24px_-4px_rgb(var(--brand-rgb)/0.3)]" : "border-border bg-surface-2 text-faint",
              )}
              aria-hidden="true"
            >
              <Icon className="size-4 sm:size-5" />
            </span>
            <div
              className={cn(
                "rounded-2xl border p-5 transition-all duration-500",
                lit ? "translate-x-0 border-border-hover bg-card/80 opacity-100" : "translate-x-2 border-border bg-card/30 opacity-60",
              )}
            >
              <p className="num font-display text-xs font-semibold text-faint">{step.tag}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
