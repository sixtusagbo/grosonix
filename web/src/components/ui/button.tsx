import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25",
        outline:
          "border-2 border-emerald-500/50 bg-transparent text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500",
        secondary:
          "bg-slate-surface-800 text-white hover:bg-slate-surface-700 border border-emerald-500/20",
        ghost:
          "hover:bg-emerald-500/10 text-silver hover:text-emerald-400 transition-all duration-200",
        link: "text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300",
        neo: "neo-brutal-button",
        energy:
          "bg-electric-orange-500 text-white hover:bg-electric-orange-600 hover:shadow-lg hover:shadow-electric-orange-500/25",
        cyber:
          "bg-neon-cyan-500 text-charcoal-900 hover:bg-neon-cyan-400 hover:shadow-lg hover:shadow-neon-cyan-500/25 font-bold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
