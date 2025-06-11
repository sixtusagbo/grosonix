"use client";

import { useState } from "react";
import { useSocialCache } from "@/lib/hooks/useSocialCache";
import {
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export function CacheManager() {
  const {
    cacheData,
    loading,
    error,
    fetchCacheStatus,
    clearCache,
    warmCache,
    isRateLimited,
    isCacheExpired,
    formatTimeUntilReset,
    getCacheStats,
  } = useSocialCache();

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const stats = getCacheStats();

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleClearSelected = async () => {
    if (selectedPlatforms.length === 0) return;
    await clearCache(selectedPlatforms);
    setSelectedPlatforms([]);
  };

  const handleWarmSelected = async () => {
    if (selectedPlatforms.length === 0) return;
    await warmCache(selectedPlatforms);
    setSelectedPlatforms([]);
  };

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center space-x-2 text-danger-red">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>Error loading cache status: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Cache & Rate Limits
          </h3>
          <p className="text-silver text-sm">
            Manage API caching and monitor rate limit status
          </p>
        </div>
        <button
          onClick={() => fetchCacheStatus()}
          disabled={loading}
          className="btn-secondary">
          <ArrowPathIcon
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Cache Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-midnight/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">
              {stats.cached_platforms}
            </div>
            <div className="text-xs text-silver">Cached</div>
          </div>
          <div className="bg-midnight/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-warning-orange">
              {stats.expired_platforms}
            </div>
            <div className="text-xs text-silver">Expired</div>
          </div>
          <div className="bg-midnight/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-danger-red">
              {stats.rate_limited_platforms}
            </div>
            <div className="text-xs text-silver">Rate Limited</div>
          </div>
          <div className="bg-midnight/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-cyber-blue">
              {stats.total_platforms}
            </div>
            <div className="text-xs text-silver">Total</div>
          </div>
        </div>
      )}

      {/* Platform Status */}
      {cacheData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Platform Status</h4>
            <div className="flex space-x-2">
              <button
                onClick={handleWarmSelected}
                disabled={loading || selectedPlatforms.length === 0}
                className="btn-primary text-xs px-3 py-1">
                Warm Cache ({selectedPlatforms.length})
              </button>
              <button
                onClick={handleClearSelected}
                disabled={loading || selectedPlatforms.length === 0}
                className="btn-danger text-xs px-3 py-1">
                Clear Cache ({selectedPlatforms.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(cacheData.cache_status).map(
              ([platform, status]) => {
                const rateLimited = isRateLimited(platform);
                const expired = isCacheExpired(platform);
                const isSelected = selectedPlatforms.includes(platform);

                return (
                  <div
                    key={platform}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-electric-purple bg-electric-purple/10"
                        : "border-midnight hover:border-silver/30"
                    }`}
                    onClick={() => handlePlatformToggle(platform)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handlePlatformToggle(platform)}
                          className="rounded border-silver/30 bg-transparent"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white capitalize">
                              {platform}
                            </span>
                            {status.has_cache && (
                              <CheckCircleIcon className="w-4 h-4 text-neon-green" />
                            )}
                            {expired && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-warning-orange" />
                            )}
                            {rateLimited && (
                              <ClockIcon className="w-4 h-4 text-danger-red" />
                            )}
                          </div>
                          <div className="text-xs text-silver">
                            {status.has_cache ? (
                              <>
                                Cached{" "}
                                {status.cached_at &&
                                  new Date(
                                    status.cached_at
                                  ).toLocaleTimeString()}
                                {expired && " (Expired)"}
                              </>
                            ) : (
                              "No cache"
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {rateLimited && (
                          <div className="text-xs text-danger-red">
                            Rate limited
                          </div>
                        )}
                        {status.expires_at && (
                          <div className="text-xs text-silver">
                            Expires:{" "}
                            {new Date(status.expires_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rate Limit Details for Twitter */}
                    {platform === "twitter" &&
                      cacheData.rate_limits[platform] && (
                        <div className="mt-3 pt-3 border-t border-midnight">
                          <div className="text-xs text-silver mb-2">
                            Rate Limits:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {Object.entries(
                              cacheData.rate_limits[platform]
                            ).map(([endpoint, limit]: [string, any]) => (
                              <div
                                key={endpoint}
                                className="bg-midnight/30 rounded p-2">
                                <div className="text-xs font-medium text-white">
                                  {endpoint}
                                </div>
                                <div className="text-xs text-silver">
                                  {limit?.request_count || 0} requests
                                </div>
                                {limit?.limit_reached && (
                                  <div className="text-xs text-danger-red">
                                    Reset:{" "}
                                    {formatTimeUntilReset(platform, endpoint)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-cyber-blue/10 rounded-lg border border-cyber-blue/20">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-5 h-5 text-cyber-blue flex-shrink-0 mt-0.5" />
          <div className="text-sm text-silver">
            <p className="mb-2">
              <strong className="text-white">Cache:</strong> Stores API
              responses to reduce requests and improve performance.
            </p>
            <p>
              <strong className="text-white">Rate Limits:</strong> API providers
              limit requests per time window. When limits are reached, cached
              data is used instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
