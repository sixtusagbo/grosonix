"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "./progress";

interface AnimatedProgressProps {
  value: number;
  max?: number;
  duration?: number;
  className?: string;
  showPercentage?: boolean;
  gradient?: boolean;
  pulseOnComplete?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "emerald" | "orange" | "purple" | "blue";
}

export function AnimatedProgress({
  value,
  max = 100,
  duration = 1000,
  className,
  showPercentage = false,
  gradient = false,
  pulseOnComplete = false,
  size = "md",
  color = "emerald",
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0);

  const percentage = Math.min((value / max) * 100, 100);
  const isComplete = percentage >= 100;

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);
    startTimeRef.current = Date.now();
    startValueRef.current = displayValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + (percentage - startValueRef.current) * easeOutCubic;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [percentage, duration, displayValue]);

  const getSizeClass = () => {
    switch (size) {
      case "sm": return "h-2";
      case "lg": return "h-6";
      default: return "h-4";
    }
  };

  const getColorClass = () => {
    switch (color) {
      case "orange": return "bg-orange-500";
      case "purple": return "bg-purple-500";
      case "blue": return "bg-blue-500";
      default: return "bg-emerald-500";
    }
  };

  const getGradientClass = () => {
    if (!gradient) return getColorClass();
    
    switch (color) {
      case "orange": return "bg-gradient-to-r from-orange-500 to-red-500";
      case "purple": return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "blue": return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default: return "bg-gradient-to-r from-emerald-500 to-cyan-500";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Progress
          value={displayValue}
          className={cn(
            getSizeClass(),
            "transition-all duration-200",
            isComplete && pulseOnComplete && "animate-pulse"
          )}
        />
        
        {/* Custom styled indicator for gradient/animations */}
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-200",
            getGradientClass(),
            isAnimating && "shadow-lg",
            isComplete && pulseOnComplete && "shadow-glow-emerald"
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="flex justify-between text-xs text-theme-secondary">
          <span>{Math.round(displayValue)}%</span>
          {isComplete && (
            <span className="text-emerald-500 font-medium">Complete!</span>
          )}
        </div>
      )}
    </div>
  );
}

interface GoalProgressProps {
  current: number;
  target: number;
  label: string;
  milestones?: number[];
  className?: string;
  showDetails?: boolean;
}

export function GoalProgress({
  current,
  target,
  label,
  milestones = [],
  className,
  showDetails = true,
}: GoalProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  
  // Calculate which milestones have been achieved
  const achievedMilestones = milestones.filter(milestone => current >= milestone);
  const nextMilestone = milestones.find(milestone => current < milestone);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-theme-primary">{label}</h4>
        <div className="text-sm text-theme-secondary">
          {current.toLocaleString()} / {target.toLocaleString()}
        </div>
      </div>

      <div className="relative">
        <AnimatedProgress
          value={current}
          max={target}
          gradient={true}
          pulseOnComplete={true}
          size="lg"
        />
        
        {/* Milestone markers */}
        {milestones.map((milestone, index) => {
          const milestonePercentage = (milestone / target) * 100;
          const isAchieved = current >= milestone;
          
          return (
            <div
              key={index}
              className="absolute top-0 h-full flex items-center"
              style={{ left: `${milestonePercentage}%` }}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all duration-300",
                  isAchieved 
                    ? "bg-emerald-500 border-emerald-500 shadow-glow-emerald" 
                    : "bg-surface border-border"
                )}
              />
              
              {/* Milestone label */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className={cn(
                  "text-xs px-2 py-1 rounded whitespace-nowrap",
                  isAchieved 
                    ? "bg-emerald-500/20 text-emerald-500" 
                    : "bg-surface/80 text-theme-secondary"
                )}>
                  {milestone.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-theme-secondary">Progress:</span>
            <span className="ml-2 font-medium text-theme-primary">
              {percentage.toFixed(1)}%
            </span>
          </div>
          
          <div>
            <span className="text-theme-secondary">Remaining:</span>
            <span className="ml-2 font-medium text-theme-primary">
              {remaining.toLocaleString()}
            </span>
          </div>
          
          <div>
            <span className="text-theme-secondary">Milestones:</span>
            <span className="ml-2 font-medium text-emerald-500">
              {achievedMilestones.length} / {milestones.length}
            </span>
          </div>
          
          {nextMilestone && (
            <div>
              <span className="text-theme-secondary">Next Goal:</span>
              <span className="ml-2 font-medium text-orange-500">
                {nextMilestone.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MilestoneProgressProps {
  milestones: Array<{
    id: string;
    label: string;
    target: number;
    current: number;
    deadline?: string;
    priority?: "low" | "medium" | "high";
  }>;
  className?: string;
}

export function MilestoneProgress({ milestones, className }: MilestoneProgressProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {milestones.map((milestone) => {
        const percentage = Math.min((milestone.current / milestone.target) * 100, 100);
        const isComplete = percentage >= 100;
        const isOverdue = milestone.deadline && new Date(milestone.deadline) < new Date();
        
        const getPriorityColor = () => {
          switch (milestone.priority) {
            case "high": return "red";
            case "medium": return "orange";
            default: return "blue";
          }
        };

        return (
          <div key={milestone.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h5 className="font-medium text-theme-primary">{milestone.label}</h5>
                {milestone.priority && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    `bg-${getPriorityColor()}-500/20 text-${getPriorityColor()}-500`
                  )}>
                    {milestone.priority}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-theme-secondary">
                {milestone.current.toLocaleString()} / {milestone.target.toLocaleString()}
              </div>
            </div>

            <AnimatedProgress
              value={milestone.current}
              max={milestone.target}
              gradient={true}
              pulseOnComplete={isComplete}
              color={isOverdue ? "orange" : "emerald"}
            />

            {milestone.deadline && (
              <div className="flex items-center justify-between text-xs text-theme-secondary">
                <span>
                  {isComplete ? "Completed" : `${percentage.toFixed(1)}% complete`}
                </span>
                <span className={cn(
                  isOverdue && !isComplete && "text-red-500"
                )}>
                  Due: {new Date(milestone.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
