"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0);

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

      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOutCubic;
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
  }, [value, duration, displayValue]);

  const formatValue = (val: number) => {
    if (decimals === 0) {
      return Math.round(val).toLocaleString();
    }
    return val.toFixed(decimals);
  };

  return (
    <span
      className={cn(
        "font-mono transition-all duration-200",
        isAnimating && "text-emerald-500",
        className
      )}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}

interface MetricCounterProps {
  value: number;
  previousValue?: number;
  label: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  showChange?: boolean;
  prefix?: string;
  suffix?: string;
}

export function MetricCounter({
  value,
  previousValue,
  label,
  icon,
  trend,
  className,
  showChange = true,
  prefix = "",
  suffix = "",
}: MetricCounterProps) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercentage = previousValue && previousValue !== 0
    ? ((change / previousValue) * 100)
    : 0;

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-500";
    if (trend === "down") return "text-red-500";
    return "text-theme-secondary";
  };

  const getChangeColor = () => {
    if (change > 0) return "text-emerald-500";
    if (change < 0) return "text-red-500";
    return "text-theme-secondary";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-theme-secondary">{icon}</div>}
        <span className="text-sm font-medium text-theme-secondary">{label}</span>
      </div>

      <div className="space-y-1">
        <AnimatedCounter
          value={value}
          className={cn("text-2xl font-bold", getTrendColor())}
          prefix={prefix}
          suffix={suffix}
        />

        {showChange && previousValue !== undefined && (
          <div className={cn("text-xs font-medium", getChangeColor())}>
            {change >= 0 ? "+" : ""}{change.toLocaleString()}
            {changePercentage !== 0 && (
              <span className="ml-1">
                ({changePercentage >= 0 ? "+" : ""}{changePercentage.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface RealTimeMetricsProps {
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    previousValue?: number;
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    prefix?: string;
    suffix?: string;
  }>;
  className?: string;
  updateInterval?: number;
}

export function RealTimeMetrics({
  metrics,
  className,
  updateInterval = 5000,
}: RealTimeMetricsProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issue by only showing time after component mounts
  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setIsLive(true);

      // Flash effect
      setTimeout(() => setIsLive(false), 200);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, mounted]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-theme-primary">Live Metrics</h3>
        <div className="flex items-center gap-2 text-xs text-theme-secondary">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors duration-200",
            isLive ? "bg-emerald-500 animate-pulse" : "bg-emerald-500/50"
          )} />
          <span>
            {mounted && lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              "bg-surface/50 border-border/50",
              isLive && "border-emerald-500/30 bg-emerald-500/5"
            )}
          >
            <MetricCounter {...metric} />
          </div>
        ))}
      </div>
    </div>
  );
}