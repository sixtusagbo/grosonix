"use client";

import { RealTimeMetrics } from "@/components/ui/animated-counter";
import { ClientOnly } from "@/components/ui/client-only";
import { PlatformFilter } from "@/lib/social";
import { Activity, BarChart3, Heart, MessageCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsGridProps {
  socialAccounts: any[] | null;
  selectedPlatform?: PlatformFilter;
  onRefresh?: () => void;
}

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





  // Transform data for RealTimeMetrics component
  const realTimeMetrics = [
    {
      id: "followers",
      label: "Total Followers",
      value: totalFollowers,
      icon: <Users className="w-4 h-4" />,
      trend: avgGrowthRate > 0 ? "up" as const : avgGrowthRate < 0 ? "down" as const : "neutral" as const,
      trendValue: Math.abs(avgGrowthRate)
    },
    {
      id: "engagement",
      label: "Engagement Rate",
      value: avgEngagementRate,
      icon: <Heart className="w-4 h-4" />,
      trend: avgEngagementRate > 2 ? "up" as const : avgEngagementRate < 1 ? "down" as const : "neutral" as const,
      trendValue: avgEngagementRate
    },
    {
      id: "posts",
      label: "Total Posts",
      value: totalPosts,
      icon: <MessageCircle className="w-4 h-4" />,
      trend: "neutral" as const,
      trendValue: 0
    },
    {
      id: "platforms",
      label: selectedPlatform === "overview" ? "Connected Platforms" : "Platform Status",
      value: selectedPlatform === "overview" ? connectedPlatforms : (metrics.length > 0 ? 1 : 0),
      icon: <BarChart3 className="w-4 h-4" />,
      trend: connectedPlatforms > 0 ? "up" as const : "neutral" as const,
      trendValue: connectedPlatforms
    }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Real-time Metrics */}
      <ClientOnly fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 border-emerald-500/20 animate-pulse">
              <div className="h-4 bg-emerald-500/20 rounded mb-2"></div>
              <div className="h-8 bg-emerald-500/20 rounded"></div>
            </div>
          ))}
        </div>
      }>
        <RealTimeMetrics
          metrics={realTimeMetrics}
          updateInterval={30000} // 30 seconds
          className="animate-fade-in"
        />
      </ClientOnly>

      {/* Additional detailed metrics for connected platforms */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.platform}
              className="glass-card p-6 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-glow-emerald">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-theme-primary capitalize">
                  {metric.platform}
                </h4>
                <div className="flex items-center gap-1 text-xs text-theme-secondary">
                  <Activity className="w-3 h-3" />
                  <span>Live</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-secondary">Followers</span>
                  <span className="font-mono font-semibold text-theme-primary">
                    {metric.followers_count.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-secondary">Engagement</span>
                  <span className="font-mono font-semibold text-emerald-500">
                    {metric.engagement_rate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-secondary">Posts</span>
                  <span className="font-mono font-semibold text-theme-primary">
                    {metric.posts_count.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-secondary">Growth</span>
                  <span className={`font-mono font-semibold ${metric.growth_rate > 0 ? 'text-emerald-500' :
                    metric.growth_rate < 0 ? 'text-red-500' : 'text-theme-secondary'
                    }`}>
                    {metric.growth_rate > 0 ? '+' : ''}{metric.growth_rate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface/50">
                <ClientOnly fallback={<p className="text-xs text-theme-secondary">Loading...</p>}>
                  <p className="text-xs text-theme-secondary">
                    Updated: {new Date(metric.last_updated).toLocaleTimeString()}
                  </p>
                </ClientOnly>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
