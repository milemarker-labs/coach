import type { HTMLAttributes, PointerEvent } from "react";
import { cn } from "@/lib/utils.ts";

/** Feeds the pointer position to the `.spotlight` glow in index.css. Writes CSS variables only. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  target.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export function Card({ className, onPointerMove, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      onPointerMove={(event) => {
        trackPointer(event);
        onPointerMove?.(event);
      }}
      className={cn(
        "spotlight rounded-2xl border border-border bg-card/80 text-card-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow] duration-300 hover:border-border-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-[15px] font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
