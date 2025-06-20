"use client";

import { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Award,
  Star,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  showGlow?: boolean;
  showPulse?: boolean;
  color?: 'emerald' | 'blue' | 'purple' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  showGlow = false,
  showPulse = false,
  color = 'emerald',
  size = 'md',
  className = ""
}: AnimatedProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const controls = useAnimation();

  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  useEffect(() => {
    controls.start({
      width: `${percentage}%`,
      transition: { duration: 1.5, ease: "easeOut" }
    });
  }, [percentage, controls]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">{label}</span>
          {showPercentage && (
            <motion.span
              key={percentage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-text-secondary"
            >
              {percentage.toFixed(1)}%
            </motion.span>
          )}
        </div>
      )}
      
      <div className={`relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} ${
            showGlow ? `shadow-lg shadow-${color}-500/50` : ''
          }`}
          initial={{ width: 0 }}
          animate={controls}
        />
        
        {showPulse && percentage > 0 && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} opacity-30`}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </div>
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  previousValue?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  showTrend?: boolean;
  className?: string;
}

export function AnimatedCounter({
  value,
  previousValue,
  duration = 1,
  prefix = "",
  suffix = "",
  showTrend = false,
  className = ""
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(previousValue || 0);
  const trend = previousValue !== undefined ? value - previousValue : 0;

  useEffect(() => {
    const startValue = previousValue || 0;
    const endValue = value;
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    const updateValue = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / (endTime - startTime));
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutProgress;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setDisplayValue(endValue);
      }
    };

    updateValue();
  }, [value, previousValue, duration]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-bold text-2xl"
      >
        {prefix}{Math.round(displayValue).toLocaleString()}{suffix}
      </motion.span>
      
      {showTrend && trend !== 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-1 text-sm ${
            trend > 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {trend > 0 ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend).toLocaleString()}</span>
        </motion.div>
      )}
    </div>
  );
}

interface MilestoneProgressProps {
  milestones: Array<{
    id: string;
    percentage: number;
    value: number;
    isAchieved: boolean;
    achievedAt?: string;
  }>;
  currentValue: number;
  targetValue: number;
  className?: string;
}

export function MilestoneProgress({
  milestones,
  currentValue,
  targetValue,
  className = ""
}: MilestoneProgressProps) {
  const currentProgress = (currentValue / targetValue) * 100;
  const sortedMilestones = [...milestones].sort((a, b) => a.percentage - b.percentage);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        {/* Progress Track */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, currentProgress)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        {/* Milestone Markers */}
        {sortedMilestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="absolute top-1/2 transform -translate-y-1/2"
            style={{ left: `${milestone.percentage}%` }}
          >
            <div className="relative">
              <motion.div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                  milestone.isAchieved
                    ? 'bg-emerald-500'
                    : currentProgress >= milestone.percentage
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }`}
                animate={
                  milestone.isAchieved
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(16, 185, 129, 0.4)",
                          "0 0 0 10px rgba(16, 185, 129, 0)",
                          "0 0 0 0 rgba(16, 185, 129, 0)"
                        ]
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: milestone.isAchieved ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                {milestone.isAchieved && (
                  <CheckCircle className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </motion.div>

              {/* Milestone Label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center"
              >
                <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                  {milestone.percentage}%
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-between text-sm text-text-secondary"
      >
        <span>{currentValue.toLocaleString()} / {targetValue.toLocaleString()}</span>
        <span>{currentProgress.toFixed(1)}% Complete</span>
      </motion.div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  label?: string;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "#10B981",
  showValue = true,
  label,
  className = ""
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-text-primary"
          >
            {percentage.toFixed(0)}%
          </motion.span>
        )}
        {label && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-text-secondary text-center"
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
