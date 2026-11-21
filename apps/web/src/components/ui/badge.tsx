import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", {
  variants: {
    tone: {
      neutral: "bg-surface-2 text-muted-foreground ring-border",
      brand: "bg-primary-subtle text-accent-foreground ring-primary/20",
      pulse: "bg-pulse-subtle text-pulse ring-pulse/25",
      success: "bg-success/12 text-success ring-success/20",
      warning: "bg-warning/12 text-warning ring-warning/20",
      danger: "bg-danger/12 text-danger ring-danger/20",
      info: "bg-info/12 text-info ring-info/20",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
