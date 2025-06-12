import { TwitterApi } from "twitter-api-v2";
import { MetricsCache } from "../cache/MetricsCache";
import { TwitterUserData, TwitterMetrics } from "./twitter";

export class TwitterServiceWithCache {
  private client: TwitterApi;
  private accessToken: string;
  private cache: MetricsCache;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
    this.client = new TwitterApi(accessToken);
    this.cache = new MetricsCache();
  }

  /**
   * Get user data with caching and rate limit protection
   */
  async getUserData(forceRefresh: boolean = false): Promise<TwitterUserData> {
    const endpoint = "user_lookup";

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "twitter"
      );
      if (cachedMetrics) {
        console.log("Returning cached Twitter user data");
        return {
          id: this.userId,
          username: "cached_user",
          name: "Cached User",
          followers_count: cachedMetrics.followers_count,
          following_count: cachedMetrics.following_count,
          tweet_count: cachedMetrics.posts_count,
          verified: false,
        };
      }
    }

    // Check rate limits
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "twitter",
      endpoint
    );
    if (!canMakeRequest) {
      console.log(
        "Rate limit reached for Twitter user lookup, using cached data"
      );
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "twitter"
      );
      if (cachedMetrics) {
        return {
          id: this.userId,
          username: "cached_user",
          name: "Cached User",
          followers_count: cachedMetrics.followers_count,
          following_count: cachedMetrics.following_count,
          tweet_count: cachedMetrics.posts_count,
          verified: false,
        };
      }
      throw new Error("Rate limit reached and no cached data available");
    }

    try {
      console.log("Fetching fresh Twitter user data...");

      // Record the request for rate limiting
      await this.cache.recordRequest(this.userId, "twitter", endpoint);

      const user = await this.client.v2.me({
        "user.fields": [
          "id",
          "username",
          "name",
          "public_metrics",
          "profile_image_url",
          "verified",
        ],
      });

      const userData = {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count || 0,
        following_count: user.data.public_metrics?.following_count || 0,
        tweet_count: user.data.public_metrics?.tweet_count || 0,
        profile_image_url: user.data.profile_image_url,
        verified: user.data.verified || false,
      };

      // Cache the metrics data
      const metricsData = {
        platform: "twitter",
        followers_count: userData.followers_count,
        following_count: userData.following_count,
        posts_count: userData.tweet_count,
        engagement_rate: 0, // Will be calculated separately
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      };

      const ttl = MetricsCache.getCacheTTL("twitter", "metrics");
      await this.cache.setCachedMetrics(
        this.userId,
        "twitter",
        metricsData,
        ttl
      );

      console.log("Twitter user data fetched and cached successfully");
      return userData;
    } catch (error) {
      console.error("Twitter API error:", error);

      const errorCode = (error as any)?.code;

      if (errorCode === 429) {
        console.log("Rate limit hit, trying to return cached data");
        const cachedMetrics = await this.cache.getCachedMetrics(
          this.userId,
          "twitter"
        );
        if (cachedMetrics) {
          return {
            id: this.userId,
            username: "cached_user",
            name: "Cached User",
            followers_count: cachedMetrics.followers_count,
            following_count: cachedMetrics.following_count,
            tweet_count: cachedMetrics.posts_count,
            verified: false,
          };
        }
      }

      if (errorCode === 401) {
        throw new Error("TWITTER_TOKEN_INVALID");
      }

      throw new Error("Failed to fetch Twitter user data");
    }
  }

  /**
   * Get metrics with enhanced caching and rate limiting
   */
  async getMetrics(forceRefresh: boolean = false): Promise<TwitterMetrics> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedMetrics = await this.cache.getCachedMetrics(
          this.userId,
          "twitter"
        );
        if (cachedMetrics) {
          console.log("Returning cached Twitter metrics");
          return {
            followers_count: cachedMetrics.followers_count,
            following_count: cachedMetrics.following_count,
            tweet_count: cachedMetrics.posts_count,
            engagement_rate: cachedMetrics.engagement_rate,
            growth_rate: cachedMetrics.growth_rate,
            last_updated: cachedMetrics.last_updated,
          };
        }
      }

      // Get fresh user data (which handles its own caching and rate limiting)
      const userData = await this.getUserData(forceRefresh);

      // Calculate engagement rate (simplified for now)
      const estimatedEngagementRate =
        userData.followers_count > 0
          ? Math.min(5, Math.max(0.5, (1000 / userData.followers_count) * 2))
          : 0;

      const metrics = {
        followers_count: userData.followers_count,
        following_count: userData.following_count,
        tweet_count: userData.tweet_count,
        engagement_rate: Math.round(estimatedEngagementRate * 100) / 100,
        growth_rate: await this.calculateGrowthRate(userData.followers_count),
        last_updated: new Date().toISOString(),
      };

      // Cache the calculated metrics data
      const metricsData = {
        platform: "twitter",
        followers_count: metrics.followers_count,
        following_count: metrics.following_count,
        posts_count: metrics.tweet_count,
        engagement_rate: metrics.engagement_rate,
        growth_rate: metrics.growth_rate,
        last_updated: metrics.last_updated,
      };

      const ttl = MetricsCache.getCacheTTL("twitter", "metrics");
      await this.cache.setCachedMetrics(
        this.userId,
        "twitter",
        metricsData,
        ttl
      );

      console.log("Fresh Twitter metrics calculated and cached:", metrics);
      return metrics;
    } catch (error) {
      console.error("Twitter metrics error:", error);

      // Try to return cached data on error
      const cachedMetrics = await this.cache.getCachedMetrics(
        this.userId,
        "twitter"
      );
      if (cachedMetrics) {
        console.log("Returning cached metrics due to error");
        return {
          followers_count: cachedMetrics.followers_count,
          following_count: cachedMetrics.following_count,
          tweet_count: cachedMetrics.posts_count,
          engagement_rate: cachedMetrics.engagement_rate,
          growth_rate: cachedMetrics.growth_rate,
          last_updated: cachedMetrics.last_updated,
        };
      }

      // If no cache available, return error state
      if ((error as any)?.message === "TWITTER_TOKEN_INVALID") {
        throw error;
      }

      return {
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        engagement_rate: 0,
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get recent tweets with rate limiting
   */
  async getRecentTweets(
    count: number = 10,
    forceRefresh: boolean = false
  ): Promise<any[]> {
    const endpoint = "user_timeline";

    // Check rate limits
    const canMakeRequest = await this.cache.canMakeRequest(
      this.userId,
      "twitter",
      endpoint
    );
    if (!canMakeRequest && !forceRefresh) {
      console.log("Rate limit reached for Twitter timeline, skipping");
      return [];
    }

    try {
      // Record the request
      await this.cache.recordRequest(this.userId, "twitter", endpoint);

      const user = await this.client.v2.me();
      const tweets = await this.client.v2.userTimeline(user.data.id, {
        max_results: Math.min(count, 10), // Limit to 10 to be conservative
        "tweet.fields": ["public_metrics", "created_at", "text"],
        exclude: ["retweets", "replies"],
      });

      return tweets.data && Array.isArray(tweets.data)
        ? tweets.data.map((tweet) => ({
            id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            metrics: tweet.public_metrics,
          }))
        : [];
    } catch (error) {
      console.error("Twitter tweets error:", error);

      if ((error as any)?.code === 429) {
        console.log("Rate limit hit for timeline");
        return [];
      }

      throw new Error("Failed to fetch recent tweets");
    }
  }

  /**
   * Calculate growth rate based on historical data
   */
  private async calculateGrowthRate(currentFollowers: number): Promise<number> {
    // This is a simplified implementation
    // In a real app, you'd store historical data and calculate actual growth

    // For now, return a mock growth rate based on follower count
    if (currentFollowers < 100) return 0.5;
    if (currentFollowers < 1000) return 1.2;
    if (currentFollowers < 10000) return 2.1;
    return 0.8;
  }

  /**
   * Clear cache for this user
   */
  async clearCache(): Promise<void> {
    await this.cache.deleteCachedMetrics(this.userId, "twitter");
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{ [endpoint: string]: any }> {
    const endpoints = ["user_lookup", "user_timeline", "user_metrics"];
    const status: { [endpoint: string]: any } = {};

    for (const endpoint of endpoints) {
      const rateLimitInfo = await this.cache.getRateLimitInfo(
        this.userId,
        "twitter",
        endpoint
      );
      status[endpoint] = rateLimitInfo;
    }

    return status;
  }
}
