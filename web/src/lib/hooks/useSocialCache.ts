"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

interface CacheStatus {
  has_cache: boolean;
  cached_at: string | null;
  expires_at: string | null;
  is_expired: boolean | null;
}

interface RateLimitInfo {
  platform: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  reset_at: string;
  limit_reached: boolean;
}

interface CacheData {
  cache_status: { [platform: string]: CacheStatus };
  rate_limits: { [platform: string]: { [endpoint: string]: RateLimitInfo } };
}

export function useSocialCache() {
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch cache and rate limit status
   */
  const fetchCacheStatus = useCallback(async (platform?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = platform
        ? `/api/social/cache?platform=${platform}`
        : "/api/social/cache";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch cache status");
      }

      const data = await response.json();
      setCacheData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching cache status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear cache for specified platforms
   */
  const clearCache = useCallback(
    async (platforms?: string[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/social/cache", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platforms }),
        });

        if (!response.ok) {
          throw new Error("Failed to clear cache");
        }

        const data = await response.json();
        toast.success(
          `Cache cleared for: ${data.cleared_platforms.join(", ")}`
        );

        // Refresh cache status
        await fetchCacheStatus();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Failed to clear cache: ${errorMessage}`);
        console.error("Error clearing cache:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchCacheStatus]
  );

  /**
   * Warm up cache for specified platforms
   */
  const warmCache = useCallback(
    async (platforms?: string[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/social/cache", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platforms }),
        });

        if (!response.ok) {
          throw new Error("Failed to warm cache");
        }

        const data = await response.json();
        toast.success(`Cache warmed for: ${data.warmed_platforms.join(", ")}`);

        // Refresh cache status
        await fetchCacheStatus();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Failed to warm cache: ${errorMessage}`);
        console.error("Error warming cache:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchCacheStatus]
  );

  /**
   * Check if a platform is rate limited
   */
  const isRateLimited = useCallback(
    (platform: string, endpoint?: string): boolean => {
      if (!cacheData?.rate_limits[platform]) return false;

      if (endpoint) {
        const rateLimitInfo = cacheData.rate_limits[platform][endpoint];
        return rateLimitInfo?.limit_reached || false;
      }

      // Check if any endpoint is rate limited
      const platformLimits = cacheData.rate_limits[platform];
      return Object.values(platformLimits).some(
        (limit: any) => limit && limit.limit_reached
      );
    },
    [cacheData]
  );

  /**
   * Get cache expiry time for a platform
   */
  const getCacheExpiry = useCallback(
    (platform: string): Date | null => {
      const cacheStatus = cacheData?.cache_status[platform];
      if (!cacheStatus?.expires_at) return null;
      return new Date(cacheStatus.expires_at);
    },
    [cacheData]
  );

  /**
   * Check if cache is expired for a platform
   */
  const isCacheExpired = useCallback(
    (platform: string): boolean => {
      const cacheStatus = cacheData?.cache_status[platform];
      return cacheStatus?.is_expired || false;
    },
    [cacheData]
  );

  /**
   * Get time until rate limit resets
   */
  const getTimeUntilReset = useCallback(
    (platform: string, endpoint: string): number => {
      const rateLimitInfo = cacheData?.rate_limits[platform]?.[endpoint];
      if (!rateLimitInfo?.reset_at) return 0;

      const resetTime = new Date(rateLimitInfo.reset_at);
      const now = new Date();
      return Math.max(0, resetTime.getTime() - now.getTime());
    },
    [cacheData]
  );

  /**
   * Format time until reset in human readable format
   */
  const formatTimeUntilReset = useCallback(
    (platform: string, endpoint: string): string => {
      const timeMs = getTimeUntilReset(platform, endpoint);
      if (timeMs === 0) return "Available now";

      const minutes = Math.ceil(timeMs / (1000 * 60));
      if (minutes < 60) return `${minutes}m`;

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    },
    [getTimeUntilReset]
  );

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    if (!cacheData) return null;

    const platforms = Object.keys(cacheData.cache_status);
    const cached = platforms.filter(
      (p) => cacheData.cache_status[p].has_cache
    ).length;
    const expired = platforms.filter(
      (p) => cacheData.cache_status[p].is_expired
    ).length;
    const rateLimited = platforms.filter((p) => isRateLimited(p)).length;

    return {
      total_platforms: platforms.length,
      cached_platforms: cached,
      expired_platforms: expired,
      rate_limited_platforms: rateLimited,
    };
  }, [cacheData, isRateLimited]);

  // Auto-refresh cache status every 5 minutes
  useEffect(() => {
    fetchCacheStatus();

    const interval = setInterval(() => {
      fetchCacheStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchCacheStatus]);

  return {
    cacheData,
    loading,
    error,
    fetchCacheStatus,
    clearCache,
    warmCache,
    isRateLimited,
    getCacheExpiry,
    isCacheExpired,
    getTimeUntilReset,
    formatTimeUntilReset,
    getCacheStats,
  };
}
