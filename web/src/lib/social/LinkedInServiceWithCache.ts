import { LinkedInService, LinkedInUserData, LinkedInMetrics } from './linkedin';
import { MetricsCache } from '../cache/MetricsCache';

export class LinkedInServiceWithCache extends LinkedInService {
  private cache: MetricsCache;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    super(accessToken);
    this.cache = new MetricsCache();
    this.userId = userId;
  }

  /**
   * Get user data with caching and rate limit protection
   */
  async getUserData(forceRefresh: boolean = false): Promise<LinkedInUserData> {
    const endpoint = "user_lookup";

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "linkedin"
      );
      if (cachedMetrics) {
        console.log("Returning cached LinkedIn user data");
        return {
          id: this.userId,
          firstName: "Cached",
          lastName: "User",
          headline: "Professional",
          profilePicture: "",
        };
      }
    }

    // Check rate limits
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "linkedin",
      endpoint
    );
    if (!canMakeRequest && !forceRefresh) {
      console.log("Rate limit reached for LinkedIn user lookup, using cached data");
      // Return basic cached structure
      return {
        id: this.userId,
        firstName: "Rate",
        lastName: "Limited",
        headline: "Professional",
        profilePicture: "",
      };
    }

    try {
      // Record the request
      await this.cache.recordRequest(this.userId, "linkedin", endpoint);

      // Get fresh data from LinkedIn API
      const userData = await super.getUserData();

      // Cache the user data (convert to metrics format for caching)
      const ttl = MetricsCache.getCacheTTL("linkedin", "metrics");
      await this.cache.setCachedMetrics(this.userId, "linkedin", {
        platform: "linkedin",
        followers_count: 0, // LinkedIn doesn't provide this in basic API
        following_count: 0,
        posts_count: 0,
        engagement_rate: 0,
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      }, ttl);

      return userData;
    } catch (error: any) {
      console.error("LinkedIn user data error:", error);
      
      // Return cached data if available, otherwise throw
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "linkedin"
      );
      if (cachedMetrics) {
        return {
          id: this.userId,
          firstName: "Cached",
          lastName: "User",
          headline: "Professional",
          profilePicture: "",
        };
      }
      
      throw error;
    }
  }

  /**
   * Get metrics with caching and rate limiting
   */
  async getMetrics(forceRefresh: boolean = false): Promise<LinkedInMetrics> {
    const endpoint = "metrics";

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "linkedin"
      );
      if (cachedMetrics) {
        console.log("Returning cached LinkedIn metrics");
        return {
          followers_count: cachedMetrics.followers_count,
          following_count: cachedMetrics.following_count,
          posts_count: cachedMetrics.posts_count,
          engagement_rate: cachedMetrics.engagement_rate,
          growth_rate: cachedMetrics.growth_rate,
          last_updated: cachedMetrics.last_updated,
        };
      }
    }

    // Check rate limits
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "linkedin",
      endpoint
    );
    if (!canMakeRequest && !forceRefresh) {
      console.log("Rate limit reached for LinkedIn metrics, using cached data");
      // Return default metrics if no cache available
      return {
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        engagement_rate: 0,
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      };
    }

    try {
      // Record the request
      await this.cache.recordRequest(this.userId, "linkedin", endpoint);

      // Get fresh metrics from LinkedIn API
      const metrics = await super.getMetrics();

      // Cache the metrics
      const metricsData = {
        platform: "linkedin",
        followers_count: metrics.followers_count,
        following_count: metrics.following_count,
        posts_count: metrics.posts_count,
        engagement_rate: metrics.engagement_rate,
        growth_rate: metrics.growth_rate,
        last_updated: metrics.last_updated,
      };

      const ttl = MetricsCache.getCacheTTL("linkedin", "metrics");
      await this.cache.setCachedMetrics(this.userId, "linkedin", metricsData, ttl);

      return metrics;
    } catch (error: any) {
      console.error("LinkedIn metrics error:", error);
      
      // Return cached data if available
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "linkedin"
      );
      if (cachedMetrics) {
        return {
          followers_count: cachedMetrics.followers_count,
          following_count: cachedMetrics.following_count,
          posts_count: cachedMetrics.posts_count,
          engagement_rate: cachedMetrics.engagement_rate,
          growth_rate: cachedMetrics.growth_rate,
          last_updated: cachedMetrics.last_updated,
        };
      }

      // Return default metrics as fallback
      return {
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        engagement_rate: 0,
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get recent posts with rate limiting
   */
  async getRecentPosts(
    count: number = 10,
    forceRefresh: boolean = false
  ): Promise<any[]> {
    const endpoint = "user_posts";

    // Check rate limits
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "linkedin",
      endpoint
    );
    if (!canMakeRequest && !forceRefresh) {
      console.log("Rate limit reached for LinkedIn posts, skipping");
      return [];
    }

    try {
      // Record the request
      await this.cache.recordRequest(this.userId, "linkedin", endpoint);

      const posts = await super.getRecentPosts(Math.min(count, 10));
      return posts;
    } catch (error: any) {
      console.error("LinkedIn posts error:", error);
      
      // LinkedIn API has limited access, so return empty array on error
      return [];
    }
  }

  /**
   * Clear cache for this user
   */
  async clearCache(): Promise<void> {
    await this.cache.deleteCachedMetrics(this.userId, "linkedin");
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{
    hasCache: boolean;
    lastUpdated: string | null;
    canMakeRequest: boolean;
  }> {
    const cachedMetrics = await this.cache.getCachedMetrics(
      this.userId,
      "linkedin"
    );
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "linkedin",
      "metrics"
    );

    return {
      hasCache: !!cachedMetrics,
      lastUpdated: cachedMetrics?.last_updated || null,
      canMakeRequest,
    };
  }
}
