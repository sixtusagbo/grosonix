"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "./client-only";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatValue?: (value: number) => string;
  triggerAnimation?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  formatValue,
  triggerAnimation = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    if (!triggerAnimation) {
      setDisplayValue(value);
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, triggerAnimation]);

  const formattedValue = formatValue
    ? formatValue(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span className={cn(
      "font-mono transition-all duration-200",
      isAnimating && "text-emerald-500",
      className
    )}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Specialized counter for social media metrics
interface MetricCounterProps {
  value: number;
  label: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MetricCounter({
  value,
  label,
  icon,
  trend,
  trendValue,
  className,
  size = "md"
}: MetricCounterProps) {
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toFixed(0);
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-emerald-500";
      case "down": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up": return "↗";
      case "down": return "↘";
      default: return "→";
    }
  };

  const sizeClasses = {
    sm: {
      value: "text-lg font-bold",
      label: "text-xs",
      trend: "text-xs",
      container: "p-3"
    },
    md: {
      value: "text-2xl font-bold",
      label: "text-sm",
      trend: "text-sm",
      container: "p-4"
    },
    lg: {
      value: "text-3xl font-bold",
      label: "text-base",
      trend: "text-base",
      container: "p-6"
    }
  };

  return (
    <div className={cn(
      "glass-card border-emerald-500/20 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-glow-emerald",
      sizeClasses[size].container,
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-emerald-500">{icon}</div>}
          <span className={cn("text-theme-secondary", sizeClasses[size].label)}>
            {label}
          </span>
        </div>
        {trend && trendValue !== undefined && (
          <div className={cn(
            "flex items-center gap-1",
            getTrendColor(),
            sizeClasses[size].trend
          )}>
            <span>{getTrendIcon()}</span>
            <AnimatedCounter
              value={Math.abs(trendValue)}
              suffix="%"
              decimals={1}
              className="font-medium"
            />
          </div>
        )}
      </div>

      <AnimatedCounter
        value={value}
        formatValue={formatLargeNumber}
        className={cn("text-theme-primary", sizeClasses[size].value)}
      />
    </div>
  );
}

// Real-time updating metric grid
interface RealTimeMetricsProps {
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    trendValue?: number;
  }>;
  updateInterval?: number;
  className?: string;
}

export function RealTimeMetrics({
  metrics,
  updateInterval = 30000, // 30 seconds
  className
}: RealTimeMetricsProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setIsUpdating(true);
      setLastUpdate(new Date());

      // Reset updating state after animation
      setTimeout(() => setIsUpdating(false), 1000);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, mounted]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-theme-primary">
          Real-time Metrics
        </h3>
        <div className="flex items-center gap-2 text-sm text-theme-secondary">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isUpdating ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
          )} />
          <ClientOnly fallback={<span>Loading...</span>}>
            <span>
              Updated {lastUpdate?.toLocaleTimeString() || 'Loading...'}
            </span>
          </ClientOnly>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCounter
            key={metric.id}
            value={metric.value}
            label={metric.label}
            icon={metric.icon}
            trend={metric.trend}
            trendValue={metric.trendValue}
            className={cn(
              "transition-all duration-300",
              isUpdating && "scale-105 shadow-lg"
            )}
          />
        ))}
      </div>
    </div>
  );
}
