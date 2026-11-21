import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform,filter,box-shadow] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Soft brand with ink text, and a gentle glow on hover.
        default:
          "bg-primary bg-brand-gradient text-primary-foreground shadow-[0_6px_24px_-10px_rgb(var(--brand-rgb)/0.3)] hover:bg-brand-gradient-hover hover:shadow-[0_10px_32px_-8px_rgb(var(--brand-rgb)/0.35)] active:brightness-95",
        secondary: "bg-surface-2 text-foreground ring-1 ring-border ring-inset hover:bg-surface-3",
        outline: "border border-border bg-white/[0.02] text-foreground hover:border-border-hover hover:bg-surface-2",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        destructive: "bg-danger/15 text-danger hover:bg-danger/25",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? undefined : type} {...props} />;
}
