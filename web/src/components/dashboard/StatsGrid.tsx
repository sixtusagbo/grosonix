"use client";

import { useState, useEffect, useRef } from "react";
import { MetricCounter, RealTimeMetrics } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformFilter } from "@/lib/social";
import {
  Activity,
  BarChart3,
  RefreshCw,
  Settings,
  Zap
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { GoalSetting } from "./GoalSetting";
import { GrowthChart } from "./GrowthChart";
import { PlatformSelector } from "./PlatformSelector";

// Import the correct type for metrics
import type { MetricCounterProps } from "@/components/ui/animated-counter";

interface StatsGridProps {
  socialAccounts: any[] | null;
  selectedPlatform?: PlatformFilter;
  onRefresh?: () => void;
}

export function StatsGrid({
  socialAccounts,
  selectedPlatform = "overview",
  onRefresh,
}: StatsGridProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const connectedPlatforms = socialAccounts?.length || 0;

  useEffect(() => {
    if (connectedPlatforms > 0) {
      fetchMetrics();
    }
  }, [connectedPlatforms, selectedPlatform]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const platformParam =
        selectedPlatform === "overview" ? "" : `?platform=${selectedPlatform}`;
      const response = await fetch(`/api/social/metrics${platformParam}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setSummary(data.summary || {});
        setLastUpdated(new Date().toLocaleTimeString());
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use summary data from API if available, otherwise calculate from metrics
  const totalFollowers =
    summary?.total_followers ||
    metrics.reduce((sum, m) => sum + m.followers_count, 0);
  const totalPosts =
    summary?.total_posts || metrics.reduce((sum, m) => sum + m.posts_count, 0);
  const avgEngagementRate =
    summary?.avg_engagement_rate ||
    (metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length
      : 0);
  const avgGrowthRate =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.growth_rate, 0) / metrics.length
      : 0;

  const getPlatformDisplayName = () => {
    if (selectedPlatform === "overview") return "All Platforms";
    return selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
  };

  // Prepare metrics for RealTimeMetrics component
  const realTimeMetrics: MetricCounterProps[] = [
    {
      id: "platforms",
      label: selectedPlatform === "overview" ? "Connected Platforms" : `${getPlatformDisplayName()} Status`,
      value: selectedPlatform === "overview" ? connectedPlatforms : (metrics.length > 0 ? 1 : 0),
      previousValue: selectedPlatform === "overview" ? Math.max(0, connectedPlatforms - 1) : undefined,
      icon: <BarChart3 className="w-4 h-4" />,
      trend: connectedPlatforms > 0 ? "up" : "neutral",
    },
    {
      id: "followers",
      label: "Total Followers",
      value: totalFollowers,
      previousValue: Math.max(0, totalFollowers - Math.round(totalFollowers * (avgGrowthRate / 100))),
      icon: <Activity className="w-4 h-4" />,
      trend: avgGrowthRate > 0 ? "up" : avgGrowthRate < 0 ? "down" : "neutral",
    },
    {
      id: "engagement",
      label: "Engagement Rate",
      value: Math.round(avgEngagementRate * 100) / 100,
      previousValue: Math.max(0, avgEngagementRate - 0.5),
      icon: <Zap className="w-4 h-4" />,
      trend: avgEngagementRate > 2 ? "up" : avgEngagementRate < 1 ? "down" : "neutral",
      suffix: "%",
    },
    {
      id: "posts",
      label: "Total Posts",
      value: totalPosts,
      previousValue: Math.max(0, totalPosts - Math.round(totalPosts * 0.1)),
      icon: <BarChart3 className="w-4 h-4" />,
      trend: totalPosts > 0 ? "up" : "neutral",
    },
  ];

  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <Activity className="w-5 h-5 text-emerald-500" />
            {selectedPlatform === "overview" ? "Overview Metrics" : `${getPlatformDisplayName()} Metrics`}
          </CardTitle>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-theme-secondary">
                Updated: {lastUpdated}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={isLoading}
              className="border-emerald-500/20 hover:border-emerald-500/40"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Real-time Metrics with Animations */}
        <RealTimeMetrics
          metrics={realTimeMetrics}
          updateInterval={30000} // 30 seconds
          className="mb-6"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2 text-theme-secondary">Refreshing metrics...</span>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && connectedPlatforms === 0 && (
          <div className="text-center py-8 text-theme-secondary">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No social media accounts connected</p>
            <p className="text-sm">Connect your accounts to see metrics</p>
          </div>
        )}

        {/* Platform-specific metrics */}
        {!isLoading && metrics.length > 0 && selectedPlatform !== "overview" && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <h4 className="text-lg font-semibold text-theme-primary mb-4">
              {getPlatformDisplayName()} Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.platform} className="space-y-2">
                  <MetricCounter
                    value={metric.followers_count}
                    label="Followers"
                    icon={<Activity className="w-4 h-4" />}
                    trend={metric.growth_rate > 0 ? "up" : metric.growth_rate < 0 ? "down" : "neutral"}
                    showChange={true}
                  />
                  <MetricCounter
                    value={metric.engagement_rate}
                    label="Engagement Rate"
                    icon={<Zap className="w-4 h-4" />}
                    trend={metric.engagement_rate > 2 ? "up" : metric.engagement_rate < 1 ? "down" : "neutral"}
                    suffix="%"
                    showChange={false}
                  />
                  <MetricCounter
                    value={metric.posts_count}
                    label="Posts"
                    icon={<BarChart3 className="w-4 h-4" />}
                    trend="neutral"
                    showChange={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}