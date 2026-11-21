import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Page title with an eyebrow. Slides in with the page transition. */
export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <motion.div className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        {eyebrow ? <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </motion.div>
      {actions ? (
        <motion.div
          className="flex shrink-0 flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {actions}
        </motion.div>
      ) : null}
    </header>
  );
}
