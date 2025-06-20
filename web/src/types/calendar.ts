export interface CalendarEvent {
  id: string;
  title: string;
  content: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'all';
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  created_at: string;
  updated_at: string;
  user_id: string;
  hashtags?: string[];
  media_urls?: string[];
  engagement_prediction?: number;
  optimal_time_score?: number;
  is_optimal_time?: boolean;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  optimalTimes: OptimalTimeSlot[];
}

export interface OptimalTimeSlot {
  hour: number;
  platform: 'twitter' | 'linkedin' | 'instagram';
  score: number;
  reason: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  currentDate: Date;
  days: CalendarDay[];
}

export interface ContentDraft {
  id?: string;
  title: string;
  content: string;
  platform: 'twitter' | 'linkedin' | 'instagram';
  hashtags: string[];
  media_urls: string[];
  scheduled_at?: string;
  status: 'draft' | 'scheduled';
  user_id: string;
}

export interface CalendarFilters {
  platforms: ('twitter' | 'linkedin' | 'instagram')[];
  status: ('draft' | 'scheduled' | 'published' | 'failed')[];
  dateRange: {
    start: string;
    end: string;
  };
  showOptimalTimes: boolean;
}

export interface CalendarStats {
  totalScheduled: number;
  totalPublished: number;
  totalDrafts: number;
  upcomingToday: number;
  optimalTimeUsage: number;
  platformBreakdown: {
    twitter: number;
    linkedin: number;
    instagram: number;
  };
}
