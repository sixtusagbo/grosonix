"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Send,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useOptimalPostingTime, useUserTimezone } from '@/hooks/useOptimalPostingTime';
import { OptimalPostingTimeAnalyzer, PostingTimeRecommendation } from '@/lib/analytics/optimal-posting-time';
import { toast } from 'sonner';

interface PostSchedulerProps {
  initialContent?: string;
  initialPlatform?: 'twitter' | 'linkedin' | 'instagram';
  onSchedule?: (scheduledPost: any) => void;
}

export function PostScheduler({
  initialContent = '',
  initialPlatform = 'twitter',
  onSchedule,
}: PostSchedulerProps) {
  const [content, setContent] = useState(initialContent);
  const [platform, setPlatform] = useState<'twitter' | 'linkedin' | 'instagram'>(initialPlatform);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [useOptimalTime, setUseOptimalTime] = useState(true);
  const [recommendations, setRecommendations] = useState<PostingTimeRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PostingTimeRecommendation | null>(null);

  const { analyzeOptimalTimes, isLoading } = useOptimalPostingTime();
  const timezone = useUserTimezone();

  // Load optimal posting times when platform changes
  useEffect(() => {
    const loadRecommendations = async () => {
      const result = await analyzeOptimalTimes(platform, timezone);
      if (result) {
        setRecommendations(result.analysis.recommendations);
        
        // Auto-select the next optimal time
        if (result.next_optimal_time) {
          setSelectedRecommendation(result.next_optimal_time);
          
          // Set the date and time inputs
          const nextTime = getNextOptimalDateTime(result.next_optimal_time);
          setScheduledDate(nextTime.date);
          setScheduledTime(nextTime.time);
        }
      }
    };

    if (useOptimalTime) {
      loadRecommendations();
    }
  }, [platform, timezone, useOptimalTime]);

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

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast.error('Please enter content to schedule');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledDateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    const scheduledPost = {
      content,
      platform,
      scheduled_at: scheduledDateTime.toISOString(),
      optimal_time_used: useOptimalTime,
      recommendation_score: selectedRecommendation?.score || null,
      timezone,
    };

    // Here you would typically save to your backend
    console.log('Scheduling post:', scheduledPost);
    
    toast.success(`Post scheduled for ${scheduledDateTime.toLocaleString()}`);
    
    if (onSchedule) {
      onSchedule(scheduledPost);
    }

    // Reset form
    setContent('');
    setScheduledDate('');
    setScheduledTime('');
  };

  const handleSaveDraft = () => {
    if (!content.trim()) {
      toast.error('Please enter content to save');
      return;
    }

    // Here you would save as draft
    toast.success('Draft saved successfully');
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Post
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Platform</label>
          <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twitter">
                <span className="flex items-center gap-2">
                  <span>𝕏</span> Twitter
                </span>
              </SelectItem>
              <SelectItem value="linkedin">
                <span className="flex items-center gap-2">
                  <span>💼</span> LinkedIn
                </span>
              </SelectItem>
              <SelectItem value="instagram">
                <span className="flex items-center gap-2">
                  <span>📷</span> Instagram
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <Textarea
            placeholder="What would you like to share?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="text-xs text-muted-foreground text-right">
            {content.length} characters
          </div>
        </div>

        {/* Optimal Time Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useOptimalTime"
            checked={useOptimalTime}
            onChange={(e) => setUseOptimalTime(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="useOptimalTime" className="text-sm font-medium">
            Use optimal posting time
          </label>
        </div>

        {/* Optimal Time Recommendations */}
        {useOptimalTime && recommendations.length > 0 && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Optimal Times for {platform}</span>
            </div>
            
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRecommendation === rec
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-blue-200 bg-white hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    setSelectedRecommendation(rec);
                    const nextTime = getNextOptimalDateTime(rec);
                    setScheduledDate(nextTime.date);
                    setScheduledTime(nextTime.time);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {OptimalPostingTimeAnalyzer.getDayName(rec.dayOfWeek)} at{' '}
                        {OptimalPostingTimeAnalyzer.formatHour(rec.hour)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.reason}
                      </div>
                    </div>
                    <Badge className={getScoreColor(rec.score)}>
                      {rec.score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Date/Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        </div>

        {/* Timezone Info */}
        <div className="text-xs text-muted-foreground">
          Times shown in {timezone}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSchedule} className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            Schedule Post
          </Button>
          <Button onClick={handleSaveDraft} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>

        {/* Warning for past times */}
        {scheduledDate && scheduledTime && new Date(`${scheduledDate}T${scheduledTime}`) <= new Date() && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">
              Please select a future date and time
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
