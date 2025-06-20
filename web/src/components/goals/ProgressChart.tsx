"use client";

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Goal, GoalProgressLog, GOAL_TYPE_UNITS } from '@/types/goals';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressChartProps {
  goal: Goal;
  progressLog?: GoalProgressLog[];
  height?: number;
  showTrend?: boolean;
}

export function ProgressChart({ 
  goal, 
  progressLog = [], 
  height = 300,
  showTrend = true 
}: ProgressChartProps) {
  const chartData = useMemo(() => {
    // Sort progress log by date
    const sortedLog = [...progressLog].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    // If no progress log, show current state
    if (sortedLog.length === 0) {
      const today = new Date().toLocaleDateString();
      return {
        labels: [today],
        datasets: [
          {
            label: 'Progress',
            data: [goal.current_value],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'Target',
            data: [goal.target_value],
            borderColor: '#6B7280',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          }
        ]
      };
    }

    // Create labels and data from progress log
    const labels = sortedLog.map(log => 
      new Date(log.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    );

    const progressData = sortedLog.map(log => log.new_value);
    const targetData = new Array(sortedLog.length).fill(goal.target_value);

    return {
      labels,
      datasets: [
        {
          label: 'Progress',
          data: progressData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Target',
          data: targetData,
          borderColor: '#6B7280',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ]
    };
  }, [goal, progressLog]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#10B981',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const unit = GOAL_TYPE_UNITS[goal.goal_type];
            return `${context.dataset.label}: ${value.toLocaleString()} ${unit}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            const unit = GOAL_TYPE_UNITS[goal.goal_type];
            return `${value.toLocaleString()} ${unit}`;
          }
        },
      },
    },
  };

  // Calculate trend
  const trend = useMemo(() => {
    if (progressLog.length < 2) return null;

    const recent = progressLog.slice(-7); // Last 7 entries
    if (recent.length < 2) return null;

    const firstValue = recent[0].new_value;
    const lastValue = recent[recent.length - 1].new_value;
    const change = lastValue - firstValue;
    const changePercentage = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return {
      change,
      changePercentage,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }, [progressLog]);

  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4" />;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Progress Chart</CardTitle>
          {showTrend && trend && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <div className="text-sm">
                <span className={`font-medium ${getTrendColor()}`}>
                  {trend.changePercentage > 0 ? '+' : ''}
                  {trend.changePercentage.toFixed(1)}%
                </span>
                <span className="text-text-secondary ml-1">
                  (7 days)
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
        
        {progressLog.length === 0 && (
          <div className="text-center mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-text-secondary">
              No progress data yet. Update your progress to see the chart.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
