"use client";

import { CalendarView, CalendarEvent, CalendarDay } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  calendarView: CalendarView;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: string) => void;
  onEventCreate: (date: string) => void;
  getPlatformIcon: (platform: string) => string;
  getStatusColor: (status: string) => string;
}

export function CalendarGrid({
  calendarView,
  onEventClick,
  onDateClick,
  onEventCreate,
  getPlatformIcon,
  getStatusColor,
}: CalendarGridProps) {
  const { type, days } = calendarView;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderMonthView = () => {
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => (
                <CalendarDayCell
                  key={day.date}
                  day={day}
                  viewType="month"
                  onEventClick={onEventClick}
                  onDateClick={onDateClick}
                  onEventCreate={onEventCreate}
                  getPlatformIcon={getPlatformIcon}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="space-y-4">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => (
            <div key={day.date} className="text-center">
              <div className="text-sm font-medium text-muted-foreground">
                {weekDays[index]}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-1",
                  day.isToday && "text-primary"
                )}
              >
                {new Date(day.date).getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Week content */}
        <div className="grid grid-cols-7 gap-4 min-h-[400px]">
          {days.map((day) => (
            <CalendarDayCell
              key={day.date}
              day={day}
              viewType="week"
              onEventClick={onEventClick}
              onDateClick={onDateClick}
              onEventCreate={onEventCreate}
              getPlatformIcon={getPlatformIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const day = days[0];
    if (!day) return null;

    return (
      <div className="space-y-6">
        {/* Day header */}
        <div className="text-center">
          <h3 className="text-2xl font-bold">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
        </div>

        {/* Day content */}
        <CalendarDayCell
          day={day}
          viewType="day"
          onEventClick={onEventClick}
          onDateClick={onDateClick}
          onEventCreate={onEventCreate}
          getPlatformIcon={getPlatformIcon}
          getStatusColor={getStatusColor}
        />
      </div>
    );
  };

  switch (type) {
    case 'month':
      return renderMonthView();
    case 'week':
      return renderWeekView();
    case 'day':
      return renderDayView();
    default:
      return renderMonthView();
  }
}

interface CalendarDayCellProps {
  day: CalendarDay;
  viewType: 'month' | 'week' | 'day';
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: string) => void;
  onEventCreate: (date: string) => void;
  getPlatformIcon: (platform: string) => string;
  getStatusColor: (status: string) => string;
}

function CalendarDayCell({
  day,
  viewType,
  onEventClick,
  onDateClick,
  onEventCreate,
  getPlatformIcon,
  getStatusColor,
}: CalendarDayCellProps) {
  const { date, events, isToday, isCurrentMonth, optimalTimes } = day;
  const dayNumber = new Date(date).getDate();

  const cellHeight = {
    month: 'min-h-[120px]',
    week: 'min-h-[400px]',
    day: 'min-h-[600px]',
  }[viewType];

  const showOptimalTimes = viewType !== 'month' && optimalTimes.length > 0;
  const maxEventsToShow = viewType === 'month' ? 2 : 10;

  return (
    <div
      className={cn(
        "border rounded-lg p-2 cursor-pointer transition-colors hover:bg-muted/50",
        cellHeight,
        isToday && "border-primary bg-primary/5",
        !isCurrentMonth && viewType === 'month' && "opacity-50",
        viewType === 'day' && "border-2"
      )}
      onClick={() => onDateClick(date)}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "text-sm font-medium",
            isToday && "text-primary font-bold",
            !isCurrentMonth && "text-muted-foreground"
          )}
        >
          {viewType === 'month' ? dayNumber : ''}
        </span>
        
        {events.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {events.length}
          </Badge>
        )}
      </div>

      {/* Optimal times indicator */}
      {showOptimalTimes && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Optimal times</span>
          </div>
          <div className="space-y-1">
            {optimalTimes.slice(0, 3).map((time, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs p-1 bg-yellow-50 rounded"
              >
                <span>{getPlatformIcon(time.platform)}</span>
                <span>{time.hour}:00</span>
                <Badge variant="outline" className="text-xs">
                  {time.score}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      <div className="space-y-1">
        {events.slice(0, maxEventsToShow).map((event) => (
          <div
            key={event.id}
            className="p-2 rounded border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">
                {getPlatformIcon(event.platform)}
              </span>
              <Badge className={cn("text-xs", getStatusColor(event.status))}>
                {event.status}
              </Badge>
              {event.is_optimal_time && (
                <Zap className="w-3 h-3 text-yellow-500" />
              )}
            </div>
            
            <p className="text-xs font-medium truncate mb-1">
              {event.title}
            </p>

            {/* Hashtags */}
            {event.hashtags && event.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {event.hashtags.slice(0, 5).map((hashtag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-700 px-1 rounded"
                  >
                    {hashtag}
                  </span>
                ))}
                {event.hashtags.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{event.hashtags.length - 5}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(event.scheduled_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Show more indicator */}
        {events.length > maxEventsToShow && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{events.length - maxEventsToShow} more
          </div>
        )}

        {/* Add event button */}
        {viewType !== 'month' && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEventCreate(date);
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Event
          </Button>
        )}
      </div>
    </div>
  );
}
