"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid3X3,
  List,
  Clock,
  Eye,
} from 'lucide-react';
import { useContentCalendar } from '@/hooks/useContentCalendar';
import { CalendarGrid } from './CalendarGrid';
import { CalendarStats } from './CalendarStats';
import { EventModal } from './EventModal';
import { CalendarFilters } from './CalendarFilters';
import { CalendarEvent } from '@/types/calendar';

interface ContentCalendarProps {
  userId: string;
}

export function ContentCalendar({ userId }: ContentCalendarProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    calendarView,
    calendarStats,
    isLoading,
    error,
    currentDate,
    viewType,
    filters,
    saveEvent,
    deleteEvent,
    navigateToPrevious,
    navigateToNext,
    navigateToToday,
    changeViewType,
    updateFilters,
    refreshCalendar,
    getEventsForDate,
    getOptimalTimesForDate,
    getUpcomingEvents,
  } = useContentCalendar(userId);

  const handleCreateEvent = (date?: string) => {
    setSelectedEvent(null);
    setSelectedDate(date || null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const savedEvent = await saveEvent(eventData);
    if (savedEvent) {
      setShowEventModal(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    }
    return savedEvent;
  };

  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      setShowEventModal(false);
      setSelectedEvent(null);
    }
    return success;
  };

  const formatCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };

    if (viewType === 'day') {
      options.day = 'numeric';
      options.weekday = 'long';
    }

    return currentDate.toLocaleDateString('en-US', options);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Error Loading Calendar</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshCalendar} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan, schedule, and manage your social media content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => handleCreateEvent()}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      {calendarStats && (
        <CalendarStats stats={calendarStats} />
      )}

      {/* Filters */}
      {showFilters && (
        <CalendarFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToToday}
                >
                  Today
                </Button>
              </div>
              <h2 className="text-xl font-semibold">{formatCurrentDate()}</h2>
            </div>

            <div className="flex items-center gap-2">
              <Select value={viewType} onValueChange={(value: any) => changeViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">
                    <span className="flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4" />
                      Month
                    </span>
                  </SelectItem>
                  <SelectItem value="week">
                    <span className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Week
                    </span>
                  </SelectItem>
                  <SelectItem value="day">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Day
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          ) : calendarView ? (
            <CalendarGrid
              calendarView={calendarView}
              onEventClick={handleEditEvent}
              onDateClick={handleCreateEvent}
              onEventCreate={handleCreateEvent}
              getPlatformIcon={getPlatformIcon}
              getStatusColor={getStatusColor}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No calendar data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {calendarView && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getUpcomingEvents(5).length > 0 ? (
              <div className="space-y-3">
                {getUpcomingEvents(5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {getPlatformIcon(event.platform)}
                      </span>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No upcoming events scheduled
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedDate}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          getOptimalTimesForDate={getOptimalTimesForDate}
        />
      )}
    </div>
  );
}
