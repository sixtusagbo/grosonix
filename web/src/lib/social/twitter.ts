import { TwitterApi } from 'twitter-api-v2';

export interface TwitterUserData {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  profile_image_url?: string;
  verified?: boolean;
}

export interface TwitterMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
}

export class TwitterService {
  private client: TwitterApi;

  constructor(accessToken: string) {
    this.client = new TwitterApi(accessToken);
  }

  async getUserData(): Promise<TwitterUserData> {
    try {
      const user = await this.client.v2.me({
        'user.fields': [
          'id',
          'username', 
          'name',
          'public_metrics',
          'profile_image_url',
          'verified'
        ]
      });

      return {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count || 0,
        following_count: user.data.public_metrics?.following_count || 0,
        tweet_count: user.data.public_metrics?.tweet_count || 0,
        profile_image_url: user.data.profile_image_url,
        verified: user.data.verified || false,
      };
    } catch (error) {
      console.error('Twitter API error:', error);
      throw new Error('Failed to fetch Twitter user data');
    }
  }

  async getMetrics(): Promise<TwitterMetrics> {
    try {
      const userData = await this.getUserData();
      
      // Get recent tweets for engagement calculation
      const tweets = await this.client.v2.userTimeline(userData.id, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'created_at']
      });

      let totalEngagement = 0;
      let totalImpressions = 0;

      if (tweets.data) {
        tweets.data.forEach(tweet => {
          const metrics = tweet.public_metrics;
          if (metrics) {
            totalEngagement += metrics.like_count + metrics.retweet_count + metrics.reply_count;
            // Estimate impressions based on followers (rough calculation)
            totalImpressions += userData.followers_count * 0.1; // Assume 10% reach
          }
        });
      }

      const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

      return {
        followers_count: userData.followers_count,
        following_count: userData.following_count,
        tweet_count: userData.tweet_count,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        growth_rate: 0, // Will be calculated with historical data
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Twitter metrics error:', error);
      throw new Error('Failed to fetch Twitter metrics');
    }
  }

  async getRecentTweets(count: number = 10) {
    try {
      const user = await this.client.v2.me();
      const tweets = await this.client.v2.userTimeline(user.data.id, {
        max_results: count,
        'tweet.fields': ['public_metrics', 'created_at', 'text'],
        exclude: ['retweets', 'replies']
      });

      return tweets.data?.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        metrics: tweet.public_metrics,
      })) || [];
    } catch (error) {
      console.error('Twitter tweets error:', error);
      throw new Error('Failed to fetch recent tweets');
    }
  }
}

// OAuth helper functions
export function getTwitterAuthUrl(): string {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4001';
  const redirectUri = `${baseUrl}/api/auth/twitter/callback`;
  const scopes = 'tweet.read users.read follows.read offline.access';
  
  // Generate a proper code challenge for PKCE
  const codeVerifier = 'grosonix_twitter_auth_challenge_2024';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    state: 'twitter_auth',
    code_challenge: codeVerifier,
    code_challenge_method: 'plain',
  });

  console.log('Twitter OAuth URL:', `https://twitter.com/i/oauth2/authorize?${params.toString()}`);
  console.log('Redirect URI:', redirectUri);

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitterCode(code: string): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4001';
  const redirectUri = `${baseUrl}/api/auth/twitter/callback`;
  const codeVerifier = 'grosonix_twitter_auth_challenge_2024';

  console.log('Exchanging Twitter code with redirect URI:', redirectUri);

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Twitter token exchange error:', errorText);
    throw new Error(`Failed to exchange Twitter authorization code: ${errorText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}