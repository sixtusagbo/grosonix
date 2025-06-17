"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArcElement,
  BarElement,
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
import {
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GrowthData {
  labels: string[];
  followers: number[];
  engagement: number[];
  posts: number[];
  reach: number[];
}

interface GrowthChartProps {
  socialAccounts?: any[] | null;
}

export function GrowthChart({ socialAccounts }: GrowthChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"line" | "bar" | "doughnut">("line");
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGrowthData();
  }, [timeRange, socialAccounts]);

  const fetchGrowthData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual data fetching
      const mockData = generateMockData(timeRange);
      setGrowthData(mockData);
    } catch (error) {
      console.error("Failed to fetch growth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (range: string): GrowthData => {
    const dataPoints = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const labels = [];
    const followers = [];
    const engagement = [];
    const posts = [];
    const reach = [];

    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - 1 - i));

      if (range === "7d") {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (range === "30d") {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }

      // Generate realistic growth data
      const baseFollowers = 1000;
      const growth = Math.random() * 50 + i * 2;
      followers.push(Math.floor(baseFollowers + growth));
      engagement.push(Math.random() * 10 + 2);
      posts.push(Math.floor(Math.random() * 5 + 1));
      reach.push(Math.floor((baseFollowers + growth) * (Math.random() * 3 + 1)));
    }

    return { labels, followers, engagement, posts, reach };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
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
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Engagement')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          callback: function (value: any) {
            if (typeof value === 'number') {
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
            }
            return value;
          }
        },
      },
      x: {
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          maxTicksLimit: timeRange === "1y" ? 12 : undefined,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  const getChartData = () => {
    if (!growthData) return { labels: [], datasets: [] };

    const baseDataset = {
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
    };

    switch (chartType) {
      case "line":
        return {
          labels: growthData.labels,
          datasets: [
            {
              ...baseDataset,
              label: "Followers",
              data: growthData.followers,
              borderColor: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              fill: true,
            },
            {
              ...baseDataset,
              label: "Engagement Rate",
              data: growthData.engagement,
              borderColor: "#FF6B35",
              backgroundColor: "rgba(255, 107, 53, 0.1)",
              fill: false,
              yAxisID: 'y1',
            },
          ],
        };
      case "bar":
        return {
          labels: growthData.labels,
          datasets: [
            {
              label: "Posts",
              data: growthData.posts,
              backgroundColor: "rgba(16, 185, 129, 0.8)",
              borderColor: "#10B981",
              borderWidth: 1,
            },
            {
              label: "Reach",
              data: growthData.reach,
              backgroundColor: "rgba(255, 107, 53, 0.8)",
              borderColor: "#FF6B35",
              borderWidth: 1,
            },
          ],
        };
      case "doughnut":
        const totalFollowers = growthData.followers[growthData.followers.length - 1] || 0;
        const totalEngagement = growthData.engagement.reduce((a, b) => a + b, 0);
        const totalPosts = growthData.posts.reduce((a, b) => a + b, 0);

        return {
          labels: ["Followers", "Total Engagement", "Total Posts"],
          datasets: [
            {
              data: [totalFollowers, totalEngagement, totalPosts],
              backgroundColor: [
                "rgba(16, 185, 129, 0.8)",
                "rgba(255, 107, 53, 0.8)",
                "rgba(0, 245, 255, 0.8)",
              ],
              borderColor: [
                "#10B981",
                "#FF6B35",
                "#00F5FF",
              ],
              borderWidth: 2,
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Growth Analytics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGrowthData}
            disabled={loading}
            className="border-emerald-500/20 hover:border-emerald-500/40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ?
                  "bg-emerald-500 hover:bg-emerald-600" :
                  "border-emerald-500/20 hover:border-emerald-500/40"
                }
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <TabsList className="bg-surface/50">
              <TabsTrigger value="line" className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Line
              </TabsTrigger>
              <TabsTrigger value="bar" className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Bar
              </TabsTrigger>
              <TabsTrigger value="doughnut" className="flex items-center gap-1">
                <PieChart className="w-4 h-4" />
                Pie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Chart Container */}
        <div className="h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <Line data={getChartData()} options={chartOptions} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
