import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
        secondary:
          "border-transparent bg-surface text-text-secondary hover:bg-surface-hover",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline:
          "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10",
        energy:
          "border-transparent bg-electric-orange-500 text-white hover:bg-electric-orange-600",
        cyber:
          "border-transparent bg-neon-cyan-500 text-charcoal-900 hover:bg-neon-cyan-400 font-bold",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        warning:
          "border-transparent bg-electric-orange-500/20 text-electric-orange-400 border border-electric-orange-500/30",
        info: "border-transparent bg-neon-cyan-500/20 text-neon-cyan-400 border border-neon-cyan-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
