import { createBrowserClient } from '@supabase/ssr';
import { CalendarEvent, CalendarDay, CalendarView, CalendarFilters, CalendarStats, OptimalTimeSlot } from '@/types/calendar';
import { OptimalPostingTimeAnalyzer } from '@/lib/analytics/optimal-posting-time';

export class CalendarService {
  private supabase;
  private optimalTimeAnalyzer;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.optimalTimeAnalyzer = new OptimalPostingTimeAnalyzer();
  }

  /**
   * Get calendar events for a specific date range
   */
  async getCalendarEvents(
    userId: string,
    startDate: string,
    endDate: string,
    filters?: CalendarFilters
  ): Promise<CalendarEvent[]> {
    try {
      let query = this.supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true });

      // Apply platform filters
      if (filters?.platforms && filters.platforms.length > 0) {
        query = query.in('platform', filters.platforms);
      }

      // Apply status filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }

      return (data || []).map(this.transformToCalendarEvent);
    } catch (error) {
      console.error('Error in getCalendarEvents:', error);
      return [];
    }
  }

  /**
   * Generate calendar view for a specific month
   */
  async generateCalendarView(
    userId: string,
    year: number,
    month: number,
    viewType: 'month' | 'week' | 'day' = 'month'
  ): Promise<CalendarView> {
    const currentDate = new Date(year, month, 1);
    const startDate = this.getCalendarStartDate(currentDate, viewType);
    const endDate = this.getCalendarEndDate(currentDate, viewType);

    // Get events for the date range
    const events = await this.getCalendarEvents(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Get optimal times for the period
    const optimalTimes = await this.getOptimalTimesForPeriod(
      userId,
      startDate,
      endDate
    );

    // Generate calendar days
    const days = this.generateCalendarDays(
      startDate,
      endDate,
      events,
      optimalTimes,
      currentDate
    );

    return {
      type: viewType,
      currentDate,
      days,
    };
  }

  /**
   * Create or update a scheduled post
   */
  async saveScheduledPost(event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    try {
      const postData = {
        title: event.title,
        content: event.content,
        platform: event.platform,
        scheduled_at: event.scheduled_at,
        status: event.status || 'scheduled',
        user_id: event.user_id,
        hashtags: event.hashtags || [],
        media_urls: event.media_urls || [],
        engagement_prediction: event.engagement_prediction,
        optimal_time_score: event.optimal_time_score,
        is_optimal_time: event.is_optimal_time,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (event.id) {
        // Update existing post
        result = await this.supabase
          .from('scheduled_posts')
          .update(postData)
          .eq('id', event.id)
          .eq('user_id', event.user_id)
          .select()
          .single();
      } else {
        // Create new post
        result = await this.supabase
          .from('scheduled_posts')
          .insert({
            ...postData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving scheduled post:', result.error);
        console.error('Post data that failed:', postData);
        return null;
      }

      return this.transformToCalendarEvent(result.data);
    } catch (error) {
      console.error('Error in saveScheduledPost:', error);
      return null;
    }
  }

  /**
   * Delete a scheduled post
   */
  async deleteScheduledPost(eventId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting scheduled post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteScheduledPost:', error);
      return false;
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(userId: string, startDate: string, endDate: string): Promise<CalendarStats> {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_posts')
        .select('platform, status, scheduled_at')
        .eq('user_id', userId)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate);

      if (error) {
        console.error('Error fetching calendar stats:', error);
        return this.getEmptyStats();
      }

      const events = data || [];
      const today = new Date().toISOString().split('T')[0];

      const stats: CalendarStats = {
        totalScheduled: events.filter(e => e.status === 'scheduled').length,
        totalPublished: events.filter(e => e.status === 'published').length,
        totalDrafts: events.filter(e => e.status === 'draft').length,
        upcomingToday: events.filter(e => 
          e.status === 'scheduled' && 
          e.scheduled_at?.startsWith(today)
        ).length,
        optimalTimeUsage: 0, // Would calculate based on optimal time analysis
        platformBreakdown: {
          twitter: events.filter(e => e.platform === 'twitter').length,
          linkedin: events.filter(e => e.platform === 'linkedin').length,
          instagram: events.filter(e => e.platform === 'instagram').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error in getCalendarStats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get optimal times for a specific date range
   */
  private async getOptimalTimesForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, OptimalTimeSlot[]>> {
    const optimalTimesMap = new Map<string, OptimalTimeSlot[]>();

    try {
      // Get optimal times for each platform
      const platforms: ('twitter' | 'linkedin' | 'instagram')[] = ['twitter', 'linkedin', 'instagram'];
      
      for (const platform of platforms) {
        const analysis = await this.optimalTimeAnalyzer.analyzeOptimalTimes(
          userId,
          platform,
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );

        // Map recommendations to time slots for each day
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = this._formatDateToLocalYYYYMMDD(currentDate);
          const dayOfWeek = currentDate.getDay();

          // Find recommendations for this day of week
          const dayRecommendations = analysis.recommendations.filter(
            rec => rec.dayOfWeek === dayOfWeek
          );

          if (dayRecommendations.length > 0) {
            const existingSlots = optimalTimesMap.get(dateKey) || [];
            const newSlots = dayRecommendations.map(rec => ({
              hour: rec.hour,
              platform,
              score: rec.score,
              reason: rec.reason,
            }));

            optimalTimesMap.set(dateKey, [...existingSlots, ...newSlots]);
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } catch (error) {
      console.error('Error getting optimal times for period:', error);
    }

    return optimalTimesMap;
  }

  /**
   * Generate calendar days for the view
   */
  private generateCalendarDays(
    startDate: Date,
    endDate: Date,
    events: CalendarEvent[],
    optimalTimes: Map<string, OptimalTimeSlot[]>,
    currentDate: Date
  ): CalendarDay[] {
    const days: CalendarDay[] = [];
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dateKey = this._formatDateToLocalYYYYMMDD(currentDay);
      
      // Filter events for this day using local date comparison
      const dayEvents = events.filter(event => 
        this._getEventLocalYYYYMMDD(event) === dateKey
      );

      days.push({
        date: dateKey,
        events: dayEvents,
        isToday: this.isSameDay(currentDay, today),
        isCurrentMonth: currentDay.getMonth() === currentMonth,
        optimalTimes: optimalTimes.get(dateKey) || [],
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }

  /**
   * Helper methods
   */
  private getCalendarStartDate(date: Date, viewType: 'month' | 'week' | 'day'): Date {
    switch (viewType) {
      case 'month':
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const startOfWeek = new Date(firstDay);
        startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());
        return startOfWeek;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart;
      case 'day':
        return new Date(date);
      default:
        return new Date(date);
    }
  }

  private getCalendarEndDate(date: Date, viewType: 'month' | 'week' | 'day'): Date {
    switch (viewType) {
      case 'month':
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const endOfWeek = new Date(lastDay);
        endOfWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
        return endOfWeek;
      case 'week':
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + (6 - date.getDay()));
        return weekEnd;
      case 'day':
        return new Date(date);
      default:
        return new Date(date);
    }
  }

  private transformToCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id,
      title: data.title || 'Untitled Post',
      content: data.content,
      platform: data.platform,
      scheduled_at: data.scheduled_at,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
      hashtags: data.hashtags || [],
      media_urls: data.media_urls || [],
      engagement_prediction: data.engagement_prediction,
      optimal_time_score: data.optimal_time_score,
      is_optimal_time: data.is_optimal_time,
    };
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private getEmptyStats(): CalendarStats {
    return {
      totalScheduled: 0,
      totalPublished: 0,
      totalDrafts: 0,
      upcomingToday: 0,
      optimalTimeUsage: 0,
      platformBreakdown: {
        twitter: 0,
        linkedin: 0,
        instagram: 0,
      },
    };
  }

  /**
   * Format a Date object to a YYYY-MM-DD string using local date components
   */
  private _formatDateToLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Extract the local YYYY-MM-DD string from a CalendarEvent's scheduled_at property
   */
  private _getEventLocalYYYYMMDD(event: CalendarEvent): string {
    const eventDate = new Date(event.scheduled_at);
    return this._formatDateToLocalYYYYMMDD(eventDate);
  }
}