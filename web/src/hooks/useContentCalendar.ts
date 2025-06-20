import { useState, useEffect, useCallback } from 'react';
import { CalendarView, CalendarEvent, CalendarFilters, CalendarStats } from '@/types/calendar';
import { CalendarService } from '@/lib/calendar/calendar-service';
import { toast } from 'sonner';

export function useContentCalendar(userId?: string) {
  const [calendarView, setCalendarView] = useState<CalendarView | null>(null);
  const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [filters, setFilters] = useState<CalendarFilters>({
    platforms: ['twitter', 'linkedin', 'instagram'],
    status: ['draft', 'scheduled', 'published'],
    dateRange: {
      start: '',
      end: '',
    },
    showOptimalTimes: true,
  });

  const calendarService = new CalendarService();

  const loadCalendarView = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const view = await calendarService.generateCalendarView(
        userId,
        currentDate.getFullYear(),
        currentDate.getMonth(),
        viewType
      );

      setCalendarView(view);

      // Load stats for the same period
      const startDate = view.days[0]?.date;
      const endDate = view.days[view.days.length - 1]?.date;

      if (startDate && endDate) {
        const stats = await calendarService.getCalendarStats(userId, startDate, endDate);
        setCalendarStats(stats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentDate, viewType]);

  const saveEvent = async (event: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    if (!userId) return null;

    try {
      const savedEvent = await calendarService.saveScheduledPost({
        ...event,
        user_id: userId,
      });

      if (savedEvent) {
        toast.success(event.id ? 'Event updated successfully' : 'Event created successfully');
        await loadCalendarView(); // Refresh the calendar
        return savedEvent;
      } else {
        toast.error('Failed to save event');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save event';
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await calendarService.deleteScheduledPost(eventId, userId);

      if (success) {
        toast.success('Event deleted successfully');
        await loadCalendarView(); // Refresh the calendar
        return true;
      } else {
        toast.error('Failed to delete event');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      toast.error(errorMessage);
      return false;
    }
  };

  const navigateToDate = (date: Date) => {
    setCurrentDate(date);
  };

  const navigateToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const changeViewType = (newViewType: 'month' | 'week' | 'day') => {
    setViewType(newViewType);
  };

  const updateFilters = (newFilters: Partial<CalendarFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getEventsForDate = (date: string): CalendarEvent[] => {
    if (!calendarView) return [];
    
    const day = calendarView.days.find(d => d.date === date);
    return day?.events || [];
  };

  const getOptimalTimesForDate = (date: string) => {
    if (!calendarView) return [];
    
    const day = calendarView.days.find(d => d.date === date);
    return day?.optimalTimes || [];
  };

  const isDateInCurrentView = (date: Date): boolean => {
    if (!calendarView) return false;
    
    const dateString = date.toISOString().split('T')[0];
    return calendarView.days.some(day => day.date === dateString);
  };

  const getTotalEventsCount = (): number => {
    if (!calendarView) return 0;
    
    return calendarView.days.reduce((total, day) => total + day.events.length, 0);
  };

  const getUpcomingEvents = (limit: number = 5): CalendarEvent[] => {
    if (!calendarView) return [];
    
    const now = new Date();
    const allEvents = calendarView.days.flatMap(day => day.events);
    
    return allEvents
      .filter(event => new Date(event.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, limit);
  };

  // Load calendar when dependencies change
  useEffect(() => {
    loadCalendarView();
  }, [loadCalendarView]);

  return {
    // State
    calendarView,
    calendarStats,
    isLoading,
    error,
    currentDate,
    viewType,
    filters,

    // Actions
    saveEvent,
    deleteEvent,
    navigateToDate,
    navigateToPrevious,
    navigateToNext,
    navigateToToday,
    changeViewType,
    updateFilters,
    refreshCalendar: loadCalendarView,

    // Helpers
    getEventsForDate,
    getOptimalTimesForDate,
    isDateInCurrentView,
    getTotalEventsCount,
    getUpcomingEvents,
  };
}
