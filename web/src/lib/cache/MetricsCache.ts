import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface CachedMetrics {
  platform: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
  cached_at: string;
  expires_at: string;
}

export interface RateLimitInfo {
  platform: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  reset_at: string;
  limit_reached: boolean;
}

export class MetricsCache {
  private supabase;

  constructor() {
    const cookieStore = cookies();
    this.supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
  }

  /**
   * Get cached metrics for a platform
   */
  async getCachedMetrics(
    userId: string,
    platform: string
  ): Promise<CachedMetrics | null> {
    try {
      const { data, error } = await this.supabase
        .from("metrics_cache")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is still valid
      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (now > expiresAt) {
        // Cache expired, delete it
        await this.deleteCachedMetrics(userId, platform);
        return null;
      }

      return {
        platform: data.platform,
        ...data.metrics_data,
        cached_at: data.created_at,
        expires_at: data.expires_at,
      };
    } catch (error) {
      console.error("Error getting cached metrics:", error);
      return null;
    }
  }

  /**
   * Cache metrics for a platform
   */
  async setCachedMetrics(
    userId: string,
    platform: string,
    metrics: Omit<CachedMetrics, "cached_at" | "expires_at">,
    ttlMinutes: number = 15
  ): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      const { error } = await this.supabase.from("metrics_cache").upsert(
        {
          user_id: userId,
          platform,
          metrics_data: {
            followers_count: metrics.followers_count,
            following_count: metrics.following_count,
            posts_count: metrics.posts_count,
            engagement_rate: metrics.engagement_rate,
            growth_rate: metrics.growth_rate,
            last_updated: metrics.last_updated,
          },
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

      if (error) {
        console.error("Error caching metrics:", error);
      }
    } catch (error) {
      console.error("Error setting cached metrics:", error);
    }
  }

  /**
   * Delete cached metrics for a platform
   */
  async deleteCachedMetrics(userId: string, platform: string): Promise<void> {
    try {
      await this.supabase
        .from("metrics_cache")
        .delete()
        .eq("user_id", userId)
        .eq("platform", platform);
    } catch (error) {
      console.error("Error deleting cached metrics:", error);
    }
  }

  /**
   * Check if we can make a request without hitting rate limits
   */
  async canMakeRequest(
    userId: string,
    platform: string,
    endpoint: string
  ): Promise<boolean> {
    try {
      const rateLimitInfo = await this.getRateLimitInfo(
        userId,
        platform,
        endpoint
      );

      if (!rateLimitInfo) {
        return true; // No rate limit info means we can make the request
      }

      const now = new Date();
      const resetAt = new Date(rateLimitInfo.reset_at);

      // If reset time has passed, we can make requests
      if (now > resetAt) {
        await this.resetRateLimit(userId, platform, endpoint);
        return true;
      }

      // Check platform-specific limits
      const limits = this.getPlatformLimits(platform, endpoint);
      return rateLimitInfo.request_count < limits.maxRequests;
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return false; // Err on the side of caution
    }
  }

  /**
   * Record a request for rate limiting
   */
  async recordRequest(
    userId: string,
    platform: string,
    endpoint: string
  ): Promise<void> {
    try {
      const now = new Date();
      const limits = this.getPlatformLimits(platform, endpoint);
      const resetAt = new Date(
        now.getTime() + limits.windowMinutes * 60 * 1000
      );

      const { data: existing } = await this.supabase
        .from("rate_limit_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("endpoint", endpoint)
        .single();

      if (existing) {
        // Check if we need to reset the window
        const existingResetAt = new Date(existing.reset_at);
        if (now > existingResetAt) {
          // Reset the window
          await this.supabase
            .from("rate_limit_tracking")
            .update({
              request_count: 1,
              window_start: now.toISOString(),
              reset_at: resetAt.toISOString(),
            })
            .eq("user_id", userId)
            .eq("platform", platform)
            .eq("endpoint", endpoint);
        } else {
          // Increment the count
          await this.supabase
            .from("rate_limit_tracking")
            .update({
              request_count: existing.request_count + 1,
            })
            .eq("user_id", userId)
            .eq("platform", platform)
            .eq("endpoint", endpoint);
        }
      } else {
        // Create new rate limit record
        await this.supabase.from("rate_limit_tracking").insert({
          user_id: userId,
          platform,
          endpoint,
          request_count: 1,
          window_start: now.toISOString(),
          reset_at: resetAt.toISOString(),
        });
      }
    } catch (error) {
      console.error("Error recording request:", error);
    }
  }

  /**
   * Get rate limit info for a platform/endpoint
   */
  async getRateLimitInfo(
    userId: string,
    platform: string,
    endpoint: string
  ): Promise<RateLimitInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from("rate_limit_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("endpoint", endpoint)
        .single();

      if (error || !data) {
        return null;
      }

      const limits = this.getPlatformLimits(platform, endpoint);

      return {
        platform: data.platform,
        endpoint: data.endpoint,
        request_count: data.request_count,
        window_start: data.window_start,
        reset_at: data.reset_at,
        limit_reached: data.request_count >= limits.maxRequests,
      };
    } catch (error) {
      console.error("Error getting rate limit info:", error);
      return null;
    }
  }

  /**
   * Reset rate limit for a platform/endpoint
   */
  private async resetRateLimit(
    userId: string,
    platform: string,
    endpoint: string
  ): Promise<void> {
    try {
      await this.supabase
        .from("rate_limit_tracking")
        .delete()
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("endpoint", endpoint);
    } catch (error) {
      console.error("Error resetting rate limit:", error);
    }
  }

  /**
   * Get platform-specific rate limits
   */
  private getPlatformLimits(
    platform: string,
    endpoint: string
  ): { maxRequests: number; windowMinutes: number } {
    const limits = {
      twitter: {
        user_lookup: { maxRequests: 75, windowMinutes: 15 }, // 75 requests per 15 minutes
        user_timeline: { maxRequests: 75, windowMinutes: 15 }, // 75 requests per 15 minutes
        user_metrics: { maxRequests: 75, windowMinutes: 15 }, // Conservative limit
      },
      instagram: {
        user_media: { maxRequests: 200, windowMinutes: 60 }, // 200 requests per hour
        user_info: { maxRequests: 200, windowMinutes: 60 },
      },
      linkedin: {
        profile: { maxRequests: 500, windowMinutes: 60 }, // 500 requests per hour
        posts: { maxRequests: 500, windowMinutes: 60 },
      },
    };

    return (
      (limits as any)[platform]?.[endpoint] || {
        maxRequests: 10,
        windowMinutes: 15,
      }
    ); // Conservative default
  }

  /**
   * Get cache TTL based on platform and data type
   */
  static getCacheTTL(
    platform: string,
    dataType: "metrics" | "content" = "metrics"
  ): number {
    const ttlMinutes = {
      twitter: {
        metrics: 15, // 15 minutes for metrics
        content: 30, // 30 minutes for content
      },
      instagram: {
        metrics: 30, // 30 minutes for metrics
        content: 60, // 1 hour for content
      },
      linkedin: {
        metrics: 60, // 1 hour for metrics
        content: 120, // 2 hours for content
      },
    };

    return (ttlMinutes as any)[platform]?.[dataType] || 15; // Default 15 minutes
  }
}
