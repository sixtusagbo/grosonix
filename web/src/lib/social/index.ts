import { TwitterService } from './twitter';
// import { InstagramService } from './instagram'; // Temporarily disabled
// import { LinkedInService } from './linkedin'; // Temporarily disabled

export type SocialPlatform = 'twitter' | 'instagram' | 'linkedin';
export type PlatformFilter = SocialPlatform | 'overview';

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
  static async getMetrics(platform: SocialPlatform, accessToken: string): Promise<SocialMetrics> {
    try {
      let metrics;
      
      switch (platform) {
        case 'twitter':
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
          
        case 'instagram':
          // Temporarily disabled
          throw new Error('Instagram metrics temporarily disabled');

        case 'linkedin':
          // Temporarily disabled
          throw new Error('LinkedIn metrics temporarily disabled');

        default:
          throw new Error(`Platform ${platform} not yet supported. Currently available: Twitter only`);
      }
      
      return metrics;
    } catch (error) {
      console.error(`Error fetching ${platform} metrics:`, error);
      throw error;
    }
  }

  static async getUserData(platform: SocialPlatform, accessToken: string) {
    try {
      switch (platform) {
        case 'twitter':
          const twitterService = new TwitterService(accessToken);
          return await twitterService.getUserData();
          
        case 'instagram':
          throw new Error('Instagram temporarily disabled');

        case 'linkedin':
          throw new Error('LinkedIn temporarily disabled');

        default:
          throw new Error(`Platform ${platform} not yet supported`);
      }
    } catch (error) {
      console.error(`Error fetching ${platform} user data:`, error);
      throw error;
    }
  }

  static async getRecentContent(platform: SocialPlatform, accessToken: string, count: number = 10) {
    try {
      switch (platform) {
        case 'twitter':
          const twitterService = new TwitterService(accessToken);
          return await twitterService.getRecentTweets(count);
          
        case 'instagram':
          throw new Error('Instagram temporarily disabled');

        case 'linkedin':
          throw new Error('LinkedIn temporarily disabled');

        default:
          throw new Error(`Platform ${platform} not yet supported`);
      }
    } catch (error) {
      console.error(`Error fetching ${platform} content:`, error);
      throw error;
    }
  }
}

// Export OAuth URL generators
export { getTwitterAuthUrl } from './twitter';
export { getInstagramAuthUrl } from './instagram';
export { getLinkedInAuthUrl } from './linkedin';

export * from './twitter';
export * from './instagram';
export * from './linkedin';