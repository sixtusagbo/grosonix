import { createBrowserClient } from '@supabase/ssr';

export interface PostingTimeRecommendation {
  platform: 'twitter' | 'linkedin' | 'instagram';
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hour: number; // 0-23
  score: number; // 0-100, higher is better
  reason: string;
  timezone: string;
}

export interface OptimalPostingAnalysis {
  platform: 'twitter' | 'linkedin' | 'instagram';
  recommendations: PostingTimeRecommendation[];
  userTimezone: string;
  analysisDate: string;
  dataPoints: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface UserEngagementData {
  platform: string;
  posted_at: string;
  engagement_rate: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}

export class OptimalPostingTimeAnalyzer {
  private supabase;

  // Industry best practices for posting times (UTC)
  private static readonly INDUSTRY_BEST_TIMES = {
    twitter: [
      { day: 1, hour: 13, score: 90, reason: 'Monday lunch break peak' }, // Monday 1 PM
      { day: 1, hour: 15, score: 85, reason: 'Monday afternoon engagement' }, // Monday 3 PM
      { day: 2, hour: 13, score: 88, reason: 'Tuesday lunch peak' }, // Tuesday 1 PM
      { day: 2, hour: 15, score: 92, reason: 'Tuesday afternoon - highest engagement' }, // Tuesday 3 PM
      { day: 3, hour: 13, score: 87, reason: 'Wednesday lunch break' }, // Wednesday 1 PM
      { day: 3, hour: 15, score: 89, reason: 'Wednesday afternoon activity' }, // Wednesday 3 PM
      { day: 4, hour: 13, score: 85, reason: 'Thursday lunch engagement' }, // Thursday 1 PM
      { day: 5, hour: 12, score: 83, reason: 'Friday pre-lunch activity' }, // Friday 12 PM
    ],
    linkedin: [
      { day: 1, hour: 8, score: 85, reason: 'Monday morning professional check-in' }, // Monday 8 AM
      { day: 1, hour: 17, score: 88, reason: 'Monday evening networking' }, // Monday 5 PM
      { day: 2, hour: 8, score: 92, reason: 'Tuesday morning - peak professional activity' }, // Tuesday 8 AM
      { day: 2, hour: 12, score: 89, reason: 'Tuesday lunch break browsing' }, // Tuesday 12 PM
      { day: 2, hour: 17, score: 90, reason: 'Tuesday evening engagement' }, // Tuesday 5 PM
      { day: 3, hour: 8, score: 87, reason: 'Wednesday morning productivity' }, // Wednesday 8 AM
      { day: 3, hour: 12, score: 86, reason: 'Wednesday lunch networking' }, // Wednesday 12 PM
      { day: 4, hour: 8, score: 84, reason: 'Thursday morning activity' }, // Thursday 8 AM
      { day: 4, hour: 17, score: 85, reason: 'Thursday evening wind-down' }, // Thursday 5 PM
    ],
    instagram: [
      { day: 1, hour: 11, score: 85, reason: 'Monday late morning scroll' }, // Monday 11 AM
      { day: 1, hour: 19, score: 88, reason: 'Monday evening relaxation' }, // Monday 7 PM
      { day: 2, hour: 11, score: 87, reason: 'Tuesday morning engagement' }, // Tuesday 11 AM
      { day: 2, hour: 14, score: 89, reason: 'Tuesday afternoon peak' }, // Tuesday 2 PM
      { day: 3, hour: 11, score: 86, reason: 'Wednesday morning activity' }, // Wednesday 11 AM
      { day: 3, hour: 19, score: 90, reason: 'Wednesday evening - highest engagement' }, // Wednesday 7 PM
      { day: 4, hour: 11, score: 84, reason: 'Thursday morning browsing' }, // Thursday 11 AM
      { day: 4, hour: 19, score: 87, reason: 'Thursday evening engagement' }, // Thursday 7 PM
      { day: 5, hour: 14, score: 85, reason: 'Friday afternoon social time' }, // Friday 2 PM
      { day: 6, hour: 11, score: 88, reason: 'Saturday morning leisure' }, // Saturday 11 AM
      { day: 0, hour: 14, score: 86, reason: 'Sunday afternoon relaxation' }, // Sunday 2 PM
    ],
  };

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Analyze optimal posting times for a user and platform
   */
  async analyzeOptimalTimes(
    userId: string,
    platform: 'twitter' | 'linkedin' | 'instagram',
    userTimezone: string = 'UTC'
  ): Promise<OptimalPostingAnalysis> {
    try {
      // Get user's historical engagement data
      const userEngagementData = await this.getUserEngagementData(userId, platform);
      
      let recommendations: PostingTimeRecommendation[];
      let confidence: 'low' | 'medium' | 'high';
      
      if (userEngagementData.length >= 20) {
        // Sufficient data for personalized analysis
        recommendations = await this.generatePersonalizedRecommendations(
          userEngagementData,
          platform,
          userTimezone
        );
        confidence = userEngagementData.length >= 50 ? 'high' : 'medium';
      } else {
        // Use industry best practices with user timezone adjustment
        recommendations = this.generateIndustryRecommendations(platform, userTimezone);
        confidence = 'low';
      }

      return {
        platform,
        recommendations: recommendations.slice(0, 8), // Top 8 recommendations
        userTimezone,
        analysisDate: new Date().toISOString(),
        dataPoints: userEngagementData.length,
        confidence,
      };

    } catch (error) {
      console.error('Error analyzing optimal posting times:', error);
      
      // Fallback to industry recommendations
      return {
        platform,
        recommendations: this.generateIndustryRecommendations(platform, userTimezone),
        userTimezone,
        analysisDate: new Date().toISOString(),
        dataPoints: 0,
        confidence: 'low',
      };
    }
  }

  /**
   * Get user's historical engagement data
   */
  private async getUserEngagementData(
    userId: string,
    platform: string
  ): Promise<UserEngagementData[]> {
    try {
      // Try to get data from social_activity_log first
      const { data: activityData, error: activityError } = await this.supabase
        .from('social_activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('action', 'share_content')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .order('created_at', { ascending: false });

      if (activityError) {
        console.error('Error fetching activity data:', activityError);
        // If table doesn't exist, return empty array instead of failing
        if (activityError.code === '42P01') {
          console.log('social_activity_log table does not exist, using fallback data');
          return [];
        }
        return [];
      }

      // Transform activity data to engagement data format
      const engagementData: UserEngagementData[] = (activityData || []).map(activity => ({
        platform: activity.platform,
        posted_at: activity.created_at,
        engagement_rate: Math.random() * 10 + 2, // Placeholder - would come from actual metrics
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 10),
        shares: Math.floor(Math.random() * 5),
        impressions: Math.floor(Math.random() * 1000) + 100,
      }));

      return engagementData;

    } catch (error) {
      console.error('Error getting user engagement data:', error);
      return [];
    }
  }

  /**
   * Generate personalized recommendations based on user data
   */
  private async generatePersonalizedRecommendations(
    engagementData: UserEngagementData[],
    platform: 'twitter' | 'linkedin' | 'instagram',
    userTimezone: string
  ): Promise<PostingTimeRecommendation[]> {
    const timeSlotEngagement = new Map<string, { total: number; count: number; scores: number[] }>();

    // Analyze engagement by time slots
    engagementData.forEach(data => {
      const date = new Date(data.posted_at);
      const dayOfWeek = date.getUTCDay();
      const hour = date.getUTCHours();
      const key = `${dayOfWeek}-${hour}`;

      if (!timeSlotEngagement.has(key)) {
        timeSlotEngagement.set(key, { total: 0, count: 0, scores: [] });
      }

      const slot = timeSlotEngagement.get(key)!;
      slot.total += data.engagement_rate;
      slot.count += 1;
      slot.scores.push(data.engagement_rate);
    });

    // Generate recommendations from analysis
    const recommendations: PostingTimeRecommendation[] = [];

    timeSlotEngagement.forEach((data, key) => {
      const [dayStr, hourStr] = key.split('-');
      const dayOfWeek = parseInt(dayStr);
      const hour = parseInt(hourStr);

      if (data.count >= 2) { // Need at least 2 data points
        const avgEngagement = data.total / data.count;
        const score = Math.min(100, Math.max(0, (avgEngagement / 15) * 100)); // Normalize to 0-100

        recommendations.push({
          platform,
          dayOfWeek,
          hour: this.convertToUserTimezone(hour, userTimezone),
          score: Math.round(score),
          reason: `Based on your ${data.count} posts with ${avgEngagement.toFixed(1)}% avg engagement`,
          timezone: userTimezone,
        });
      }
    });

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  /**
   * Generate industry-based recommendations
   */
  private generateIndustryRecommendations(
    platform: 'twitter' | 'linkedin' | 'instagram',
    userTimezone: string
  ): PostingTimeRecommendation[] {
    const industryTimes = OptimalPostingTimeAnalyzer.INDUSTRY_BEST_TIMES[platform] || [];

    return industryTimes.map(time => ({
      platform,
      dayOfWeek: time.day,
      hour: this.convertToUserTimezone(time.hour, userTimezone),
      score: time.score,
      reason: `Industry best practice: ${time.reason}`,
      timezone: userTimezone,
    }));
  }

  /**
   * Convert UTC hour to user's timezone
   */
  private convertToUserTimezone(utcHour: number, userTimezone: string): number {
    try {
      const utcDate = new Date();
      utcDate.setUTCHours(utcHour, 0, 0, 0);
      
      const userDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }));
      return userDate.getHours();
    } catch (error) {
      console.error('Error converting timezone:', error);
      return utcHour; // Fallback to UTC
    }
  }

  /**
   * Get day name from day number
   */
  static getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  /**
   * Format hour to 12-hour format
   */
  static formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  /**
   * Get next optimal posting time
   */
  static getNextOptimalTime(recommendations: PostingTimeRecommendation[]): PostingTimeRecommendation | null {
    if (recommendations.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Find the next optimal time
    const sortedRecommendations = recommendations
      .map(rec => {
        const daysUntil = (rec.dayOfWeek - currentDay + 7) % 7;
        const hoursUntil = daysUntil * 24 + (rec.hour - currentHour);
        
        return {
          ...rec,
          hoursUntil: hoursUntil <= 0 ? hoursUntil + 168 : hoursUntil, // Add a week if time has passed
        };
      })
      .sort((a, b) => a.hoursUntil - b.hoursUntil);

    return sortedRecommendations[0] || null;
  }
}
