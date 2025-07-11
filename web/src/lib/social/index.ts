import { TwitterService } from "./twitter";
import { TwitterServiceWithCache } from "./TwitterServiceWithCache";
import { LinkedInService } from "./linkedin";
import { LinkedInServiceWithCache } from "./LinkedInServiceWithCache";
// import { InstagramService } from './instagram'; // Temporarily disabled
// import { LinkedInService } from './linkedin'; // Temporarily disabled

export type SocialPlatform = "twitter" | "instagram" | "linkedin";
export type PlatformFilter = SocialPlatform | "overview";

export interface SocialMetrics {
  platform: SocialPlatform;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
}

export class SocialMediaManager {
  static async getMetrics(
    platform: SocialPlatform,
    accessToken: string
  ): Promise<SocialMetrics> {
    try {
      let metrics;

      switch (platform) {
        case "twitter":
          const twitterService = new TwitterService(accessToken);
          const twitterMetrics = await twitterService.getMetrics();
          metrics = {
            platform,
            followers_count: twitterMetrics.followers_count,
            following_count: twitterMetrics.following_count,
            posts_count: twitterMetrics.tweet_count,
            engagement_rate: twitterMetrics.engagement_rate,
            growth_rate: twitterMetrics.growth_rate,
            last_updated: twitterMetrics.last_updated,
          };
          break;

        case "instagram":
          // Temporarily disabled
          throw new Error("Instagram metrics temporarily disabled");

        case "linkedin":
          const linkedinService = new LinkedInService(accessToken);
          const linkedinMetrics = await linkedinService.getMetrics();
          metrics = {
            platform,
            followers_count: linkedinMetrics.followers_count,
            following_count: linkedinMetrics.following_count,
            posts_count: linkedinMetrics.posts_count,
            engagement_rate: linkedinMetrics.engagement_rate,
            growth_rate: linkedinMetrics.growth_rate,
            last_updated: linkedinMetrics.last_updated,
          };
          break;

        default:
          throw new Error(
            `Platform ${platform} not yet supported. Currently available: Twitter only`
          );
      }

      return metrics;
    } catch (error) {
      console.error(`Error fetching ${platform} metrics:`, error);
      throw error;
    }
  }

  /**
   * Get metrics with caching and rate limiting (recommended method)
   */
  static async getMetricsWithCache(
    platform: SocialPlatform,
    accessToken: string,
    userId: string,
    forceRefresh: boolean = false
  ): Promise<SocialMetrics> {
    try {
      let metrics;

      switch (platform) {
        case "twitter":
          const twitterService = new TwitterServiceWithCache(
            accessToken,
            userId
          );
          const twitterMetrics = await twitterService.getMetrics(forceRefresh);
          metrics = {
            platform,
            followers_count: twitterMetrics.followers_count,
            following_count: twitterMetrics.following_count,
            posts_count: twitterMetrics.tweet_count,
            engagement_rate: twitterMetrics.engagement_rate,
            growth_rate: twitterMetrics.growth_rate,
            last_updated: twitterMetrics.last_updated,
          };
          break;

        case "instagram":
          // Temporarily disabled
          throw new Error("Instagram metrics temporarily disabled");

        case "linkedin":
          const linkedinServiceWithCache = new LinkedInServiceWithCache(
            accessToken,
            userId
          );
          const linkedinMetricsWithCache = await linkedinServiceWithCache.getMetrics(forceRefresh);
          metrics = {
            platform,
            followers_count: linkedinMetricsWithCache.followers_count,
            following_count: linkedinMetricsWithCache.following_count,
            posts_count: linkedinMetricsWithCache.posts_count,
            engagement_rate: linkedinMetricsWithCache.engagement_rate,
            growth_rate: linkedinMetricsWithCache.growth_rate,
            last_updated: linkedinMetricsWithCache.last_updated,
          };
          break;

        default:
          throw new Error(
            `Platform ${platform} not yet supported. Currently available: Twitter only`
          );
      }

      return metrics;
    } catch (error) {
      console.error(`Error fetching ${platform} metrics with cache:`, error);
      throw error;
    }
  }

  static async getUserData(platform: SocialPlatform, accessToken: string) {
    try {
      switch (platform) {
        case "twitter":
          const twitterService = new TwitterService(accessToken);
          return await twitterService.getUserData();

        case "instagram":
          throw new Error("Instagram temporarily disabled");

        case "linkedin":
          const linkedinUserService = new LinkedInService(accessToken);
          return await linkedinUserService.getUserData();

        default:
          throw new Error(`Platform ${platform} not yet supported`);
      }
    } catch (error) {
      console.error(`Error fetching ${platform} user data:`, error);
      throw error;
    }
  }

  static async getRecentContent(
    platform: SocialPlatform,
    accessToken: string,
    count: number = 10
  ) {
    try {
      switch (platform) {
        case "twitter":
          const twitterService = new TwitterService(accessToken);
          return await twitterService.getRecentTweets(count);

        case "instagram":
          throw new Error("Instagram temporarily disabled");

        case "linkedin":
          const linkedinContentService = new LinkedInService(accessToken);
          return await linkedinContentService.getRecentPosts(count);

        default:
          throw new Error(`Platform ${platform} not yet supported`);
      }
    } catch (error: any) {
      console.error(`Error fetching ${platform} content:`, error);

      // If it's a token expiration error, provide a more specific message
      if (error.message === "TWITTER_TOKEN_EXPIRED") {
        throw new Error(
          "Twitter token has expired. Please reconnect your Twitter account in Settings."
        );
      }

      // If it's a LinkedIn error, provide specific message
      if (error.message.includes("LinkedIn")) {
        throw new Error(
          "LinkedIn API access is limited. Some features may not be available."
        );
      }

      // If it's a rate limit error, provide a helpful message
      if (
        error.message === "TWITTER_RATE_LIMITED" ||
        error.message === "TWITTER_FREE_PLAN_LIMIT"
      ) {
        throw new Error(
          "Twitter Free plan limit: Only 1 timeline request per 15 minutes. Please wait 15 minutes before trying again."
        );
      }

      throw error;
    }
  }
}

// Export OAuth URL generators
export { getTwitterAuthUrl } from "./twitter";
export { getInstagramAuthUrl } from "./instagram";
export { getLinkedInAuthUrl } from "./linkedin";

export * from "./twitter";
export * from "./instagram";
export * from "./linkedin";
