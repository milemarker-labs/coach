import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } },
};

const containers = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  section: motion.section,
  dl: motion.dl,
};

const items = {
  div: motion.div,
  li: motion.li,
  section: motion.section,
};

/**
 * Children marked with <StaggerItem> rise in one after another.
 * `inView` waits until the group scrolls into view; otherwise it plays on mount.
 */
export function Stagger({
  children,
  className,
  as = "div",
  delay = 0,
  gap = 0.07,
  inView = false,
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof containers;
  delay?: number;
  gap?: number;
  inView?: boolean;
}) {
  const Component = containers[as];
  const variants: Variants = { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } };
  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -60px 0px" } } : { animate: "show" })}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  variants = fadeUp,
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof items;
  variants?: Variants;
}) {
  const Component = items[as];
  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}
