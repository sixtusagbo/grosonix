"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Save,
  Trash2,
  Calendar,
  Clock,
  Zap,
  Hash,
  Image,
} from 'lucide-react';
import { CalendarEvent, OptimalTimeSlot } from '@/types/calendar';
import { toast } from 'sonner';

interface EventModalProps {
  event: CalendarEvent | null;
  selectedDate: string | null;
  onSave: (event: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  onDelete: (eventId: string) => Promise<boolean>;
  onClose: () => void;
  getOptimalTimesForDate: (date: string) => OptimalTimeSlot[];
}

export function EventModal({
  event,
  selectedDate,
  onSave,
  onDelete,
  onClose,
  getOptimalTimesForDate,
}: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'twitter' as 'twitter' | 'linkedin' | 'instagram' | 'all',
    scheduled_date: '',
    scheduled_time: '',
    status: 'scheduled' as 'draft' | 'scheduled',
    hashtags: [] as string[],
    media_urls: [] as string[],
  });

  const [hashtagInput, setHashtagInput] = useState('');
  const [mediaInput, setMediaInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptimalTime, setSelectedOptimalTime] = useState<OptimalTimeSlot | null>(null);

  const isEditing = !!event;
  const optimalTimes = selectedDate ? getOptimalTimesForDate(selectedDate) : [];

  useEffect(() => {
    if (event) {
      const scheduledAt = new Date(event.scheduled_at);
      setFormData({
        title: event.title,
        content: event.content,
        platform: event.platform,
        scheduled_date: scheduledAt.toISOString().split('T')[0],
        scheduled_time: scheduledAt.toTimeString().slice(0, 5),
        status: event.status as 'draft' | 'scheduled',
        hashtags: event.hashtags || [],
        media_urls: event.media_urls || [],
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduled_date: selectedDate,
        scheduled_time: '12:00',
      }));
    }
  }, [event, selectedDate]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }

    if (!formData.scheduled_date || !formData.scheduled_time) {
      toast.error('Please select date and time');
      return;
    }

    setIsLoading(true);

    try {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      if (scheduledAt <= new Date() && formData.status === 'scheduled') {
        toast.error('Scheduled time must be in the future');
        setIsLoading(false);
        return;
      }

      const eventData: Partial<CalendarEvent> = {
        ...(event && { id: event.id }),
        title: formData.title,
        content: formData.content,
        platform: formData.platform,
        scheduled_at: scheduledAt.toISOString(),
        status: formData.status,
        hashtags: formData.hashtags,
        media_urls: formData.media_urls,
        is_optimal_time: !!selectedOptimalTime,
        optimal_time_score: selectedOptimalTime?.score,
      };

      const savedEvent = await onSave(eventData);
      if (savedEvent) {
        onClose();
      }
    } catch (error) {
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    setIsLoading(true);
    try {
      const success = await onDelete(event.id);
      if (success) {
        setShowDeleteDialog(false);
        onClose();
      }
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
      const hashtag = hashtagInput.trim().startsWith('#') 
        ? hashtagInput.trim() 
        : `#${hashtagInput.trim()}`;
      
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtag],
      }));
      setHashtagInput('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag),
    }));
  };

  const addMedia = () => {
    if (mediaInput.trim() && !formData.media_urls.includes(mediaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, mediaInput.trim()],
      }));
      setMediaInput('');
    }
  };

  const removeMedia = (url: string) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter(u => u !== url),
    }));
  };

  const useOptimalTime = (optimalTime: OptimalTimeSlot) => {
    setSelectedOptimalTime(optimalTime);
    setFormData(prev => ({
      ...prev,
      platform: optimalTime.platform,
      scheduled_time: `${optimalTime.hour.toString().padStart(2, '0')}:00`,
    }));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {isEditing ? 'Edit Event' : 'Create Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="What would you like to share?"
                  className="min-h-[100px]"
                />
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {formData.content.length} characters
                </div>
              </div>
            </div>

            {/* Platform and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Platform</label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, platform: value }))}
                >
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
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <span>📱</span> All Platforms
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Optimal Times */}
            {optimalTimes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Optimal Times for This Date</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {optimalTimes.slice(0, 3).map((time, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOptimalTime === time
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => useOptimalTime(time)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {getPlatformIcon(time.platform)}
                          </span>
                          <div>
                            <div className="font-medium text-sm">
                              {time.hour}:00 on {time.platform}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {time.reason}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {time.score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Hashtags
              </label>
              <div className="flex gap-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button onClick={addHashtag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((hashtag) => (
                    <Badge
                      key={hashtag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeHashtag(hashtag)}
                    >
                      {hashtag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Media URLs */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media URLs
              </label>
              <div className="flex gap-2">
                <Input
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  placeholder="Add media URL"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedia())}
                />
                <Button onClick={addMedia} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formData.media_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.media_urls.map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm truncate">{url}</span>
                      <Button
                        onClick={() => removeMedia(url)}
                        variant="ghost"
                        size="sm"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <div>
              {isEditing && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}