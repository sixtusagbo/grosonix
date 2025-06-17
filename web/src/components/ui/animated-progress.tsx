"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  animationDuration?: number;
  showPercentage?: boolean;
  gradient?: boolean;
  pulseOnComplete?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
}

const AnimatedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  AnimatedProgressProps
>(({ 
  className, 
  value = 0, 
  animationDuration = 1000,
  showPercentage = false,
  gradient = false,
  pulseOnComplete = false,
  size = "md",
  variant = "default",
  ...props 
}, ref) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
      if (value >= 100) {
        setIsComplete(true);
        if (pulseOnComplete) {
          setTimeout(() => setIsComplete(false), 2000);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [value, pulseOnComplete]);

  const sizeClasses = {
    sm: "h-2",
    md: "h-4", 
    lg: "h-6"
  };

  const variantClasses = {
    default: "bg-emerald-500",
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    danger: "bg-red-500"
  };

  const gradientClasses = {
    default: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    success: "bg-gradient-to-r from-green-400 to-green-600",
    warning: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    danger: "bg-gradient-to-r from-red-400 to-red-600"
  };

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-surface/50",
          sizeClasses[size],
          isComplete && pulseOnComplete && "animate-pulse",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all ease-out",
            gradient ? gradientClasses[variant] : variantClasses[variant],
            "relative overflow-hidden"
          )}
          style={{ 
            transform: `translateX(-${100 - animatedValue}%)`,
            transitionDuration: `${animationDuration}ms`
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
               style={{
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 2s infinite'
               }} />
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-xs font-medium",
            size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs",
            animatedValue > 50 ? "text-white" : "text-gray-700 dark:text-gray-300"
          )}>
            {Math.round(animatedValue)}%
          </span>
        </div>
      )}
    </div>
  );
});

AnimatedProgress.displayName = "AnimatedProgress";

// Goal Progress Component with milestone celebrations
interface GoalProgressProps {
  current: number;
  target: number;
  label: string;
  milestones?: number[];
  className?: string;
}

export function GoalProgress({ 
  current, 
  target, 
  label, 
  milestones = [25, 50, 75, 100],
  className 
}: GoalProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

  useEffect(() => {
    const reachedMilestone = milestones.find(m => 
      percentage >= m && percentage < m + 5 // Small buffer to avoid repeated celebrations
    );
    
    if (reachedMilestone && reachedMilestone !== celebratingMilestone) {
      setCelebratingMilestone(reachedMilestone);
      setTimeout(() => setCelebratingMilestone(null), 3000);
    }
  }, [percentage, milestones, celebratingMilestone]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-theme-primary">{label}</span>
        <span className="text-sm text-theme-secondary">
          {current.toLocaleString()} / {target.toLocaleString()}
        </span>
      </div>
      
      <div className="relative">
        <AnimatedProgress
          value={percentage}
          showPercentage={false}
          gradient={true}
          pulseOnComplete={percentage >= 100}
          size="lg"
          variant={percentage >= 100 ? "success" : "default"}
        />
        
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className="absolute w-0.5 h-full bg-white/50"
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>
        
        {/* Celebration effect */}
        {celebratingMilestone && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce text-2xl">🎉</div>
          </div>
        )}
      </div>
      
      {percentage >= 100 && (
        <div className="text-center text-sm text-emerald-500 font-medium animate-pulse">
          🎯 Goal Achieved!
        </div>
      )}
    </div>
  );
}

export { AnimatedProgress };
