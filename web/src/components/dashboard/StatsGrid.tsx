"use client";

import { useState, useEffect } from "react";
import { PlatformFilter } from "@/lib/social";

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

  return (
    <div className="space-y-4">
      {/* Header with refresh button and last updated */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {selectedPlatform === "overview"
              ? "Overview Metrics"
              : `${getPlatformDisplayName()} Metrics`}
          </h3>
          {lastUpdated && (
            <p className="text-xs text-text-muted">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-electric-purple/20 hover:bg-electric-purple/30 rounded-lg transition-all disabled:opacity-50">
          <svg
            className={`w-4 h-4 text-electric-purple ${
              loading ? "animate-spin" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-sm text-electric-purple">
            {loading ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="glass-card p-6 hover:scale-105 transition-transform duration-200">
            <p className="text-sm text-text-secondary">{stat.name}</p>
            <div className="flex items-center mt-2">
              {stat.loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-electric-purple/20 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-text-primary">
                  {stat.value}
                </p>
              )}
            </div>
            <p
              className={`text-sm mt-2 flex items-center space-x-1 ${
                stat.changeType === "increase"
                  ? "text-neon-green"
                  : stat.changeType === "decrease"
                  ? "text-danger-red"
                  : "text-text-muted"
              }`}>
              {stat.changeType === "increase" && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17l9.2-9.2M17 17V7H7"
                  />
                </svg>
              )}
              {stat.changeType === "decrease" && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 7l-9.2 9.2M7 7v10h10"
                  />
                </svg>
              )}
              <span>{stat.change}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
