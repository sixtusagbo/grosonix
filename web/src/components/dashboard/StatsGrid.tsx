"use client";

import { useState, useEffect } from "react";

interface StatsGridProps {
  socialAccounts: any[] | null;
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

export function StatsGrid({ socialAccounts }: StatsGridProps) {
  const [metrics, setMetrics] = useState<SocialMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const connectedPlatforms = socialAccounts?.length || 0;

  useEffect(() => {
    if (connectedPlatforms > 0) {
      fetchMetrics();
    }
  }, [connectedPlatforms]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalFollowers = metrics.reduce((sum, m) => sum + m.followers_count, 0);
  const totalPosts = metrics.reduce((sum, m) => sum + m.posts_count, 0);
  const avgEngagementRate = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length 
    : 0;
  const avgGrowthRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.growth_rate, 0) / metrics.length
    : 0;

  const stats: Array<{
    name: string;
    value: string | number;
    change: string;
    changeType: ChangeType;
    loading?: boolean;
  }> = [
    {
      name: "Connected Platforms",
      value: connectedPlatforms,
      change: connectedPlatforms > 0 ? `+${connectedPlatforms}` : "0",
      changeType: connectedPlatforms > 0 ? "increase" : "neutral",
    },
    {
      name: "Total Followers",
      value: loading ? "..." : totalFollowers.toLocaleString(),
      change: avgGrowthRate > 0 ? `+${avgGrowthRate.toFixed(1)}%` : "0%",
      changeType: avgGrowthRate > 0 ? "increase" : avgGrowthRate < 0 ? "decrease" : "neutral",
      loading,
    },
    {
      name: "Engagement Rate",
      value: loading ? "..." : `${avgEngagementRate.toFixed(1)}%`,
      change: avgEngagementRate > 2 ? "+Good" : avgEngagementRate > 1 ? "+Fair" : "Low",
      changeType: avgEngagementRate > 2 ? "increase" : avgEngagementRate > 1 ? "neutral" : "decrease",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.name} className="glass-card p-6 hover:scale-105 transition-transform duration-200">
          <p className="text-sm text-silver">{stat.name}</p>
          <div className="flex items-center mt-2">
            {stat.loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-electric-purple/20 rounded w-16"></div>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            )}
          </div>
          <p
            className={`text-sm mt-2 flex items-center space-x-1 ${
              stat.changeType === "increase"
                ? "text-neon-green"
                : stat.changeType === "decrease"
                ? "text-danger-red"
                : "text-silver"
            }`}>
            {stat.changeType === "increase" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            )}
            {stat.changeType === "decrease" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
              </svg>
            )}
            <span>{stat.change}</span>
          </p>
        </div>
      ))}
    </div>
  );
}