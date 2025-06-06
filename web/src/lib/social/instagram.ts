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
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserData(): Promise<InstagramUserData> {
    try {
      // First get the user's Facebook pages (required for Instagram Business API)
      const pagesResponse = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: {
          access_token: this.accessToken,
        },
      });

      // Find Instagram business account
      let instagramAccountId = null;
      for (const page of pagesResponse.data.data) {
        try {
          const instagramResponse = await axios.get(`${this.baseUrl}/${page.id}`, {
            params: {
              fields: 'instagram_business_account',
              access_token: this.accessToken,
            },
          });

          if (instagramResponse.data.instagram_business_account) {
            instagramAccountId = instagramResponse.data.instagram_business_account.id;
            break;
          }
        } catch (error) {
          // Continue to next page if this one doesn't have Instagram
          continue;
        }
      }

      if (!instagramAccountId) {
        throw new Error('No Instagram Business account found. Please convert to a Business or Creator account.');
      }

      // Get Instagram account details
      const response = await axios.get(`${this.baseUrl}/${instagramAccountId}`, {
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count',
          access_token: this.accessToken,
        },
      });

      return {
        id: response.data.id,
        username: response.data.username,
        account_type: response.data.account_type,
        media_count: response.data.media_count || 0,
        followers_count: response.data.followers_count || 0,
        follows_count: response.data.follows_count || 0,
      };
    } catch (error) {
      console.error('Instagram Graph API error:', error);
      throw new Error('Failed to fetch Instagram user data. Ensure you have a Business or Creator account.');
    }
  }

  async getMetrics(): Promise<InstagramMetrics> {
    try {
      const userData = await this.getUserData();
      
      // Get recent media for engagement calculation
      const mediaResponse = await axios.get(`${this.baseUrl}/${userData.id}/media`, {
        params: {
          fields: 'id,like_count,comments_count,timestamp,media_type',
          limit: 25, // Get more posts for better engagement calculation
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

      const engagementRate = userData.followers_count && userData.followers_count > 0 && mediaCount > 0 
        ? (totalEngagement / (userData.followers_count * mediaCount)) * 100 
        : 0;

      return {
        followers_count: userData.followers_count || 0,
        following_count: userData.follows_count || 0,
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
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
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

  async getInsights(mediaId: string) {
    try {
      // Get detailed insights for a specific post
      const response = await axios.get(`${this.baseUrl}/${mediaId}/insights`, {
        params: {
          metric: 'engagement,impressions,reach,saved',
          access_token: this.accessToken,
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Instagram insights error:', error);
      throw new Error('Failed to fetch media insights');
    }
  }
}

// OAuth helper functions for Instagram Graph API (via Facebook Login)
export function getInstagramAuthUrl(): string {
  const clientId = process.env.INSTAGRAM_CLIENT_ID; // This is actually Facebook App ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;
  const scopes = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement';
  
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state: 'instagram_auth',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.INSTAGRAM_CLIENT_ID; // Facebook App ID
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET; // Facebook App Secret
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

  try {
    // Step 1: Exchange code for short-lived Facebook access token
    const shortTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const shortToken = shortTokenResponse.data.access_token;

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortToken,
      },
    });

    return {
      access_token: longTokenResponse.data.access_token,
    };
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    throw new Error('Failed to exchange Instagram authorization code');
  }
}

// Helper function to check if user has Instagram Business account
export async function checkInstagramBusinessAccount(accessToken: string): Promise<boolean> {
  try {
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
      },
    });

    for (const page of pagesResponse.data.data) {
      try {
        const instagramResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: accessToken,
          },
        });

        if (instagramResponse.data.instagram_business_account) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}