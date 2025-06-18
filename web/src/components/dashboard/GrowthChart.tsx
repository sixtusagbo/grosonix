"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

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

interface GrowthChartProps {
  socialAccounts?: any[] | null;
}

export function GrowthChart({ socialAccounts }: GrowthChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedMetric, setSelectedMetric] = useState<"followers" | "engagement" | "posts">("followers");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Generate mock data based on time range
  const generateMockData = useMemo(() => {
    const now = new Date();
    const dataPoints: { date: string; followers: number; engagement: number; posts: number }[] = [];

    let days: number;
    switch (timeRange) {
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      case "1y": days = 365; break;
      default: days = 30;
    }

    // Generate data points
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Mock growth with some randomness
      const baseFollowers = 1000 + (days - i) * 10;
      const variance = Math.random() * 100 - 50;

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        followers: Math.max(0, baseFollowers + variance),
        engagement: Math.max(0, (baseFollowers + variance) * 0.05 + Math.random() * 20),
        posts: Math.floor(Math.random() * 5) + 1
      });
    }

    return dataPoints;
  }, [timeRange]);

  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    const timer = setTimeout(() => {
      const labels = generateMockData.map(point => {
        const date = new Date(point.date);
        if (timeRange === "7d") {
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeRange === "30d") {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
      });

      const datasets = [];

      // Primary metric dataset
      datasets.push({
        label: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
        data: generateMockData.map(point => point[selectedMetric]),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      });

      // Add comparison line for followers vs engagement
      if (selectedMetric === "followers") {
        datasets.push({
          label: "Engagement Rate",
          data: generateMockData.map(point => point.engagement),
          borderColor: "#FF6B35",
          backgroundColor: "rgba(255, 107, 53, 0.1)",
          fill: false,
          tension: 0.4,
          pointBackgroundColor: "#FF6B35",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y1',
        });
      }

      setChartData({
        labels,
        datasets
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [timeRange, selectedMetric, generateMockData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
        titleColor: isDark ? "#E2E8F0" : "#0F172A",
        bodyColor: isDark ? "#E2E8F0" : "#0F172A",
        borderColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (selectedMetric === "followers") {
                label += context.parsed.y.toLocaleString();
              } else if (selectedMetric === "engagement") {
                label += context.parsed.y.toFixed(1) + '%';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          maxTicksLimit: timeRange === "7d" ? 7 : timeRange === "30d" ? 10 : 12,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          callback: function (value: any) {
            if (selectedMetric === "followers") {
              return value.toLocaleString();
            } else if (selectedMetric === "engagement") {
              return value.toFixed(1) + '%';
            }
            return value;
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: selectedMetric === "followers",
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          callback: function (value: any) {
            return value.toFixed(1) + '%';
          }
        },
      },
    },
  };

  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Growth Analytics
          </CardTitle>

          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
                <SelectItem value="90d">90D</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-theme-secondary">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Growth Summary */}
        {chartData && !loading && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-sm text-theme-secondary">Current</div>
              <div className="text-lg font-semibold text-theme-primary">
                {generateMockData[generateMockData.length - 1]?.[selectedMetric]?.toLocaleString() || 0}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-theme-secondary">Growth</div>
              <div className="text-lg font-semibold text-emerald-500">
                +{Math.round(Math.random() * 15 + 5)}%
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-theme-secondary">Peak</div>
              <div className="text-lg font-semibold text-theme-primary">
                {Math.max(...generateMockData.map(d => d[selectedMetric])).toLocaleString()}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-theme-secondary">Avg Daily</div>
              <div className="text-lg font-semibold text-theme-primary">
                {Math.round(generateMockData.reduce((sum, d) => sum + d[selectedMetric], 0) / generateMockData.length).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
