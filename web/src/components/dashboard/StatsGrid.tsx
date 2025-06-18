"use client";

import { MetricCounter, RealTimeMetrics } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformFilter } from "@/lib/social";
import {
  Activity,
  BarChart3,
  Heart,
  MessageCircle,
  RefreshCw,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

// Import animated components

interface StatsGridProps {
  socialAccounts: any[] | null;
  selectedPlatform?: PlatformFilter;
  onRefresh?: () => void;
}

type ChangeType = "increase" | "decrease" | "neutral";

interface SocialMetrics {
  platform: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
}

export function StatsGrid({
  socialAccounts,
  selectedPlatform = "overview",
  onRefresh,
}: StatsGridProps) {
  const [metrics, setMetrics] = useState<SocialMetrics[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const connectedPlatforms = socialAccounts?.length || 0;

  useEffect(() => {
    if (connectedPlatforms > 0) {
      fetchMetrics();
    }
  }, [connectedPlatforms, selectedPlatform]);

  const fetchMetrics = async () => {
    setLoading(true);
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
      setLoading(false);
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

  const stats: Array<{
    name: string;
    value: string | number;
    change: string;
    changeType: ChangeType;
    loading?: boolean;
  }> = [
      {
        name:
          selectedPlatform === "overview"
            ? "Connected Platforms"
            : `${getPlatformDisplayName()} Status`,
        value:
          selectedPlatform === "overview"
            ? connectedPlatforms
            : metrics.length > 0
              ? "Connected"
              : "Not Connected",
        change:
          selectedPlatform === "overview"
            ? connectedPlatforms > 0
              ? `+${connectedPlatforms}`
              : "0"
            : metrics.length > 0
              ? "Active"
              : "Inactive",
        changeType:
          selectedPlatform === "overview"
            ? connectedPlatforms > 0
              ? "increase"
              : "neutral"
            : metrics.length > 0
              ? "increase"
              : "decrease",
      },
      {
        name: "Total Followers",
        value: loading ? "..." : totalFollowers.toLocaleString(),
        change: avgGrowthRate > 0 ? `+${avgGrowthRate.toFixed(1)}%` : "0%",
        changeType:
          avgGrowthRate > 0
            ? "increase"
            : avgGrowthRate < 0
              ? "decrease"
              : "neutral",
        loading,
      },
      {
        name: "Engagement Rate",
        value: loading ? "..." : `${avgEngagementRate.toFixed(1)}%`,
        change:
          avgEngagementRate > 2
            ? "+Good"
            : avgEngagementRate > 1
              ? "+Fair"
              : "Low",
        changeType:
          avgEngagementRate > 2
            ? "increase"
            : avgEngagementRate > 1
              ? "neutral"
              : "decrease",
        loading,
      },
      {
        name: "Total Posts",
        value: loading ? "..." : totalPosts.toLocaleString(),
        change: totalPosts > 0 ? `${totalPosts} posts` : "No posts",
        changeType: totalPosts > 0 ? "increase" : "neutral",
        loading,
      },
    ];

  // Prepare metrics for RealTimeMetrics component
  const realTimeMetrics = [
    {
      id: "platforms",
      label: selectedPlatform === "overview" ? "Connected Platforms" : `${getPlatformDisplayName()} Status`,
      value: selectedPlatform === "overview" ? connectedPlatforms : (metrics.length > 0 ? 1 : 0),
      previousValue: selectedPlatform === "overview" ? Math.max(0, connectedPlatforms - 1) : undefined,
      icon: <BarChart3 className="w-4 h-4" />,
      trend: connectedPlatforms > 0 ? "up" : "neutral" as const,
    },
    {
      id: "followers",
      label: "Total Followers",
      value: totalFollowers,
      previousValue: Math.max(0, totalFollowers - Math.round(totalFollowers * (avgGrowthRate / 100))),
      icon: <Users className="w-4 h-4" />,
      trend: avgGrowthRate > 0 ? "up" : avgGrowthRate < 0 ? "down" : "neutral" as const,
    },
    {
      id: "engagement",
      label: "Engagement Rate",
      value: Math.round(avgEngagementRate * 100) / 100,
      previousValue: Math.max(0, avgEngagementRate - 0.5),
      icon: <Heart className="w-4 h-4" />,
      trend: avgEngagementRate > 2 ? "up" : avgEngagementRate < 1 ? "down" : "neutral" as const,
      suffix: "%",
    },
    {
      id: "posts",
      label: "Total Posts",
      value: totalPosts,
      previousValue: Math.max(0, totalPosts - Math.round(totalPosts * 0.1)),
      icon: <MessageCircle className="w-4 h-4" />,
      trend: totalPosts > 0 ? "up" : "neutral" as const,
    },
  ];

  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
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
              disabled={loading}
              className="border-emerald-500/20 hover:border-emerald-500/40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
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
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2 text-theme-secondary">Refreshing metrics...</span>
          </div>
        )}

        {/* No Data State */}
        {!loading && connectedPlatforms === 0 && (
          <div className="text-center py-8 text-theme-secondary">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No social media accounts connected</p>
            <p className="text-sm">Connect your accounts to see metrics</p>
          </div>
        )}

        {/* Platform-specific metrics */}
        {!loading && metrics.length > 0 && selectedPlatform !== "overview" && (
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
                    icon={<Users className="w-4 h-4" />}
                    trend={metric.growth_rate > 0 ? "up" : metric.growth_rate < 0 ? "down" : "neutral"}
                    showChange={true}
                  />
                  <MetricCounter
                    value={metric.engagement_rate}
                    label="Engagement Rate"
                    icon={<Heart className="w-4 h-4" />}
                    trend={metric.engagement_rate > 2 ? "up" : metric.engagement_rate < 1 ? "down" : "neutral"}
                    suffix="%"
                    showChange={false}
                  />
                  <MetricCounter
                    value={metric.posts_count}
                    label="Posts"
                    icon={<MessageCircle className="w-4 h-4" />}
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
