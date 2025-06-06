import axios from 'axios';

export interface LinkedInUserData {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  headline?: string;
}

export interface LinkedInMetrics {
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate: number;
  last_updated: string;
}

export class LinkedInService {
  private accessToken: string;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserData(): Promise<LinkedInUserData> {
    try {
      const response = await axios.get(`${this.baseUrl}/people/~`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline)',
        },
      });

      const data = response.data;
      return {
        id: data.id,
        firstName: data.firstName?.localized?.en_US || '',
        lastName: data.lastName?.localized?.en_US || '',
        headline: data.headline?.localized?.en_US,
        profilePicture: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
    } catch (error) {
      console.error('LinkedIn API error:', error);
      throw new Error('Failed to fetch LinkedIn user data');
    }
  }

  async getMetrics(): Promise<LinkedInMetrics> {
    try {
      // LinkedIn API has limited access to follower counts for personal profiles
      // This would require LinkedIn Marketing API for full metrics
      
      // For now, we'll return mock data structure
      // In production, you'd need to implement proper LinkedIn Marketing API integration
      return {
        followers_count: 0, // Requires LinkedIn Marketing API
        following_count: 0, // Not available in basic API
        posts_count: 0, // Would need to count user's posts
        engagement_rate: 0, // Requires post metrics
        growth_rate: 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('LinkedIn metrics error:', error);
      throw new Error('Failed to fetch LinkedIn metrics');
    }
  }

  async getRecentPosts(count: number = 10) {
    try {
      // Get user's posts (requires specific permissions)
      const userData = await this.getUserData();
      const response = await axios.get(`${this.baseUrl}/shares`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        params: {
          q: 'owners',
          owners: `urn:li:person:${userData.id}`,
          count,
          projection: '(elements*(id,text,created,content))',
        },
      });

      return response.data.elements || [];
    } catch (error) {
      console.error('LinkedIn posts error:', error);
      throw new Error('Failed to fetch recent posts');
    }
  }
}

// OAuth helper functions
export function getLinkedInAuthUrl(): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
  const scopes = 'r_liteprofile r_emailaddress w_member_social';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    state: 'linkedin_auth',
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;

  const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    access_token: response.data.access_token,
  };
}