/// web/src/components/ai/PerformanceAnalytics.tsx
"use client";

import { useState, useEffect } from "react";
import {
  PerformanceAnalyticsResponse,
  SuggestionPerformanceSummary,
  DailySuggestionPerformance,
} from "@/types/ai";
import { aiApiClient } from "@/lib/api/ai-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart2, TrendingUp, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useTheme } from "@/components/theme/ThemeProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function PerformanceAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] =
    useState<PerformanceAnalyticsResponse | null>(null);
  const [days, setDays] = useState(30); // Default to 30 days
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await aiApiClient.getPerformanceAnalytics(days);
      setAnalyticsData(data);
      toast.success("Performance analytics loaded!");
    } catch (error) {
      console.error("Failed to fetch performance analytics:", error);
      toast.error("Failed to load performance analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const getChartOptions = (titleText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#E2E8F0" : "#0F172A",
        },
      },
      title: {
        display: true,
        text: titleText,
        color: isDark ? "#E2E8F0" : "#0F172A",
      },
      tooltip: {
        backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
        titleColor: isDark ? "#E2E8F0" : "#0F172A",
        bodyColor: isDark ? "#E2E8F0" : "#0F172A",
        borderColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 1,
        padding: 12,
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
        },
      },
      x: {
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
        },
      },
    },
  });

  const dailyTrendsChartData = {
    labels: analyticsData?.daily_trends.map((d) => d.date) || [],
    datasets: [
      {
        label: "Generated",
        data: analyticsData?.daily_trends.map((d) => d.generated) || [],
        borderColor: "#10B981", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Saved",
        data: analyticsData?.daily_trends.map((d) => d.saved) || [],
        borderColor: "#FF6B35", // electric-orange-500
        backgroundColor: "rgba(255, 107, 53, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Used",
        data: analyticsData?.daily_trends.map((d) => d.used) || [],
        borderColor: "#00F5FF", // neon-cyan-500
        backgroundColor: "rgba(0, 245, 255, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const platformBreakdownChartData = {
    labels: ["Twitter", "Instagram", "LinkedIn"],
    datasets: [
      {
        label: "Generated",
        data: [
          analyticsData?.summary.platform_breakdown.twitter.generated || 0,
          analyticsData?.summary.platform_breakdown.instagram.generated || 0,
          analyticsData?.summary.platform_breakdown.linkedin.generated || 0,
        ],
        backgroundColor: "#10B981",
      },
      {
        label: "Saved",
        data: [
          analyticsData?.summary.platform_breakdown.twitter.saved || 0,
          analyticsData?.summary.platform_breakdown.instagram.saved || 0,
          analyticsData?.summary.platform_breakdown.linkedin.saved || 0,
        ],
        backgroundColor: "#FF6B35",
      },
      {
        label: "Used",
        data: [
          analyticsData?.summary.platform_breakdown.twitter.used || 0,
          analyticsData?.summary.platform_breakdown.instagram.used || 0,
          analyticsData?.summary.platform_breakdown.linkedin.used || 0,
        ],
        backgroundColor: "#00F5FF",
      },
    ],
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="text-center py-12">
          <p className="text-theme-secondary">
            No performance data available. Generate some content first!
          </p>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            className="mt-4 border-emerald-500/50 text-emerald-500">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            AI Content Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-theme-secondary">
            Gain insights into the performance of your AI-generated content.
            Track how many suggestions are generated, saved, and used.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-theme-secondary">Data for last:</span>
            <Button
              variant={days === 7 ? "default" : "secondary"}
              size="sm"
              onClick={() => setDays(7)}>
              7 Days
            </Button>
            <Button
              variant={days === 30 ? "default" : "secondary"}
              size="sm"
              onClick={() => setDays(30)}>
              30 Days
            </Button>
            <Button
              variant={days === 90 ? "default" : "secondary"}
              size="sm"
              onClick={() => setDays(90)}>
              90 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6 text-center">
            <BarChart2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-theme-primary">
              {analyticsData.summary.total_generated}
            </div>
            <p className="text-sm text-theme-secondary">Suggestions Generated</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6 text-center">
            <Save className="w-8 h-8 text-electric-orange-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-theme-primary">
              {analyticsData.summary.total_saved}
            </div>
            <p className="text-sm text-theme-secondary">Suggestions Saved</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-neon-cyan-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-theme-primary">
              {analyticsData.summary.total_used}
            </div>
            <p className="text-sm text-theme-secondary">Suggestions Used</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-theme-primary">
              {analyticsData.summary.average_engagement_score.toFixed(1)}%
            </div>
            <p className="text-sm text-theme-secondary">Avg. Engagement Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends Chart */}
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="p-6">
          <div style={{ height: "300px" }}>
            <Line
              data={dailyTrendsChartData}
              options={getChartOptions("Daily Content Performance Trends")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown Chart */}
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="p-6">
          <div style={{ height: "300px" }}>
            <Bar
              data={platformBreakdownChartData}
              options={getChartOptions("Platform Performance Breakdown")}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Usage History */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            AI Feature Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.ai_usage_history.length > 0 ? (
              analyticsData.ai_usage_history.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-theme-surface rounded-lg border border-emerald-500/10">
                  <span className="text-sm text-theme-primary capitalize">
                    {entry.feature_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-theme-secondary">
                    {entry.usage_count} uses on {entry.date_used}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-theme-secondary text-center">
                No AI usage history available for the selected period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

