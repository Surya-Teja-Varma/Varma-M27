import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer select-none",
    "transition-[color,background-color,border-color,box-shadow,transform,filter] duration-200 ease-vx active:scale-[0.97] active:duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:saturate-50 disabled:cursor-not-allowed",
    "aria-disabled:opacity-55 aria-disabled:shadow-none aria-disabled:saturate-50 aria-disabled:hover:translate-y-0 aria-disabled:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-vx",
    "hover:[&_.lucide-arrow-right]:translate-x-0.5 hover:[&_.lucide-rotate-ccw]:-rotate-45",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary-deep hover:-translate-y-px hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-px",
        outline:
          "border border-input bg-card shadow-sm hover:border-primary/40 hover:bg-primary-soft/50 hover:text-primary-deep",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-surface hover:shadow-panel",
        ghost: "hover:bg-surface hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        mission:
          "bg-gradient-primary text-primary-foreground shadow-glow font-display font-semibold uppercase tracking-[0.12em] hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_16px_34px_-12px_color-mix(in_oklab,var(--primary)_65%,transparent)]",
        lime: "bg-lime text-ink font-display font-semibold uppercase tracking-[0.12em] shadow-glow-lime hover:-translate-y-px hover:brightness-105",
        hud: "border border-border bg-card text-foreground shadow-panel hover:-translate-y-px hover:border-primary/40 hover:text-primary-deep hover:shadow-hover",
        soft: "bg-primary-soft text-primary-deep hover:bg-primary/15 hover:-translate-y-px",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-12 rounded-lg px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
