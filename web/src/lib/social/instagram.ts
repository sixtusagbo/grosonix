import axios from 'axios';

export interface InstagramUserData {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count?: number;
  follows_count?: number;
}

export interface InstagramMetrics {
  followers_count: number;
  following_count: number;
  media_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
}

export class InstagramService {
  private accessToken: string;
  private baseUrl = 'https://graph.instagram.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserData(): Promise<InstagramUserData> {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: this.accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Instagram API error:', error);
      throw new Error('Failed to fetch Instagram user data');
    }
  }

  async getBusinessAccountData(): Promise<InstagramUserData & { followers_count: number; follows_count: number }> {
    try {
      // First get basic user data
      const userData = await this.getUserData();
      
      // For business accounts, we can get follower metrics
      const response = await axios.get(`${this.baseUrl}/${userData.id}`, {
        params: {
          fields: 'followers_count,follows_count,media_count',
          access_token: this.accessToken,
        },
      });

      return {
        ...userData,
        followers_count: response.data.followers_count || 0,
        follows_count: response.data.follows_count || 0,
      };
    } catch (error) {
      console.error('Instagram business data error:', error);
      // Fallback to basic data if business metrics aren't available
      const userData = await this.getUserData();
      return {
        ...userData,
        followers_count: 0,
        follows_count: 0,
      };
    }
  }

  async getMetrics(): Promise<InstagramMetrics> {
    try {
      const userData = await this.getBusinessAccountData();
      
      // Get recent media for engagement calculation
      const mediaResponse = await axios.get(`${this.baseUrl}/${userData.id}/media`, {
        params: {
          fields: 'id,like_count,comments_count,timestamp',
          limit: 10,
          access_token: this.accessToken,
        },
      });

      let totalEngagement = 0;
      const mediaCount = mediaResponse.data.data?.length || 0;

      if (mediaResponse.data.data) {
        mediaResponse.data.data.forEach((media: any) => {
          totalEngagement += (media.like_count || 0) + (media.comments_count || 0);
        });
      }

      const engagementRate = userData.followers_count > 0 && mediaCount > 0 
        ? (totalEngagement / (userData.followers_count * mediaCount)) * 100 
        : 0;

      return {
        followers_count: userData.followers_count,
        following_count: userData.follows_count,
        media_count: userData.media_count,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        growth_rate: 0, // Will be calculated with historical data
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Instagram metrics error:', error);
      throw new Error('Failed to fetch Instagram metrics');
    }
  }

  async getRecentMedia(count: number = 10) {
    try {
      const userData = await this.getUserData();
      const response = await axios.get(`${this.baseUrl}/${userData.id}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count',
          limit: count,
          access_token: this.accessToken,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Instagram media error:', error);
      throw new Error('Failed to fetch recent media');
    }
  }
}

// OAuth helper functions
export function getInstagramAuthUrl(): string {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;
  const scopes = 'user_profile,user_media';
  
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

  // Step 1: Exchange code for short-lived token
  const shortTokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const shortToken = shortTokenResponse.data.access_token;

  // Step 2: Exchange short-lived token for long-lived token
  const longTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
    params: {
      grant_type: 'ig_exchange_token',
      client_secret: clientSecret,
      access_token: shortToken,
    },
  });

  return {
    access_token: longTokenResponse.data.access_token,
  };
}