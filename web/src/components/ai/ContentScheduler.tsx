"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Zap,
  Save,
  X,
} from 'lucide-react';
import { ContentSuggestion } from '@/types/ai';
import { useOptimalPostingTime, useUserTimezone } from '@/hooks/useOptimalPostingTime';
import { OptimalPostingTimeAnalyzer, PostingTimeRecommendation } from '@/lib/analytics/optimal-posting-time';
import { CalendarService } from '@/lib/calendar/calendar-service';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface ContentSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentSuggestion;
  userId: string;
}

export function ContentScheduler({
  isOpen,
  onClose,
  content,
  userId,
}: ContentSchedulerProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PostingTimeRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PostingTimeRecommendation | null>(null);

  const { analyzeOptimalTimes } = useOptimalPostingTime();
  const { scheduleReminders } = useNotifications(userId);
  const timezone = useUserTimezone();
  const calendarService = new CalendarService();

  // Load optimal posting times when dialog opens
  useEffect(() => {
    if (isOpen && content.platform) {
      loadOptimalTimes();
      generateDefaultTitle();
      setDefaultDateTime();
    }
  }, [isOpen, content.platform]);

  const loadOptimalTimes = async () => {
    if (!content.platform) return;

    try {
      const result = await analyzeOptimalTimes(content.platform as any, timezone);
      if (result) {
        setRecommendations(result.analysis.recommendations);
        
        // Auto-select the next optimal time
        if (result.next_optimal_time) {
          setSelectedRecommendation(result.next_optimal_time);
          const nextTime = getNextOptimalDateTime(result.next_optimal_time);
          setScheduledDate(nextTime.date);
          setScheduledTime(nextTime.time);
        }
      }
    } catch (error) {
      console.error('Error loading optimal times:', error);
    }
  };

  const generateDefaultTitle = () => {
    // Generate a title from the first 50 characters of content
    const contentPreview = content.content.substring(0, 50).trim();
    const defaultTitle = contentPreview.length < content.content.length 
      ? `${contentPreview}...` 
      : contentPreview;
    setTitle(defaultTitle);
  };

  const setDefaultDateTime = () => {
    // Set default to tomorrow at 9 AM if no optimal time is selected
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('09:00');
  };

  const getNextOptimalDateTime = (recommendation: PostingTimeRecommendation) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    // Calculate days until the recommended day
    let daysUntil = (recommendation.dayOfWeek - currentDay + 7) % 7;
    
    // If it's the same day but the hour has passed, schedule for next week
    if (daysUntil === 0 && recommendation.hour <= currentHour) {
      daysUntil = 7;
    }
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntil);
    targetDate.setHours(recommendation.hour, 0, 0, 0);
    
    return {
      date: targetDate.toISOString().split('T')[0],
      time: `${recommendation.hour.toString().padStart(2, '0')}:00`,
    };
  };

  const useOptimalTime = (recommendation: PostingTimeRecommendation) => {
    setSelectedRecommendation(recommendation);
    const nextTime = getNextOptimalDateTime(recommendation);
    setScheduledDate(nextTime.date);
    setScheduledTime(nextTime.time);
  };

  const handleSchedule = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for the scheduled post');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledDateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        title: title.trim(),
        content: content.content,
        platform: content.platform || 'twitter',
        scheduled_at: scheduledDateTime.toISOString(),
        status: 'scheduled' as const,
        hashtags: content.hashtags || [],
        media_urls: [],
        is_optimal_time: !!selectedRecommendation,
        optimal_time_score: selectedRecommendation?.score,
        user_id: userId,
      };

      console.log('Attempting to save scheduled post:', eventData);
      const savedEvent = await calendarService.saveScheduledPost(eventData);
      console.log('Save result:', savedEvent);

      if (savedEvent) {
        // Schedule reminders for the post
        try {
          await scheduleReminders(savedEvent.id, scheduledDateTime);
          toast.success('Content scheduled successfully with reminders!');
        } catch (reminderError) {
          console.error('Error scheduling reminders:', reminderError);
          toast.success('Content scheduled successfully (reminders failed)');
        }

        onClose();

        // Reset form
        setTitle('');
        setScheduledDate('');
        setScheduledTime('');
        setSelectedRecommendation(null);
      } else {
        console.error('saveScheduledPost returned null');
        toast.error('Failed to schedule content - please check console for details');
      }
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast.error(`Failed to schedule content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-500 bg-red-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {getPlatformIcon(content.platform || 'twitter')}
              </span>
              <span className="font-medium capitalize">
                {content.platform || 'twitter'}
              </span>
              <Badge variant="outline">
                {content.engagement_score}% engagement
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Content Preview:</p>
            <p className="text-sm">{content.content}</p>
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {content.hashtags.map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {hashtag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium">Post Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this scheduled post"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Optimal Times */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Optimal Times</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div
                    key={index}
                    className={`group p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecommendation === rec
                        ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                        : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => useOptimalTime(rec)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 transition-colors ${
                          selectedRecommendation === rec
                            ? 'text-yellow-700'
                            : 'text-muted-foreground group-hover:text-blue-600'
                        }`} />
                        <div>
                          <div className={`font-medium text-sm transition-colors ${
                            selectedRecommendation === rec
                              ? 'text-yellow-900'
                              : 'text-foreground group-hover:text-blue-700'
                          }`}>
                            {OptimalPostingTimeAnalyzer.getDayName(rec.dayOfWeek)} at{' '}
                            {OptimalPostingTimeAnalyzer.formatHour(rec.hour)}
                          </div>
                          <div className={`text-xs transition-colors ${
                            selectedRecommendation === rec
                              ? 'text-yellow-700'
                              : 'text-muted-foreground group-hover:text-blue-600'
                          }`}>
                            {rec.reason}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getScoreColor(rec.score)} ${
                        selectedRecommendation === rec
                          ? 'border-yellow-600'
                          : ''
                      }`}>
                        {rec.score}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timezone Info */}
          <div className="text-xs text-muted-foreground">
            Times shown in {timezone}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-6 border-t">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Scheduling...' : 'Schedule Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
