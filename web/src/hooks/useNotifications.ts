"use client";

import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '@/lib/notifications/notification-service';
import {
  NotificationPreferences,
  InAppNotification,
  NotificationPermissionState,
  PostingReminder,
} from '@/types/notifications';
import { toast } from 'sonner';

export function useNotifications(userId?: string) {
  const [notificationService] = useState(() => new NotificationService());
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    supported: false,
    requested: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences and permission state
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load notification preferences
        const prefs = await notificationService.getUserNotificationPreferences(userId);
        setPreferences(prefs);

        // Check browser notification permission
        const permState = await notificationService.requestNotificationPermission();
        setPermissionState(permState);

        // Load in-app notifications
        const notifications = await notificationService.getInAppNotifications(userId);
        setInAppNotifications(notifications);
      } catch (error) {
        console.error('Error loading notification data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, notificationService]);

  // Check for pending reminders periodically
  useEffect(() => {
    if (!userId || !preferences?.browser_notifications) return;

    const checkReminders = async () => {
      try {
        const pendingReminders = await notificationService.getPendingReminders(userId);
        
        for (const reminder of pendingReminders) {
          const scheduledPost = (reminder as any).scheduled_posts;
          if (!scheduledPost) continue;

          const scheduledTime = new Date(scheduledPost.scheduled_at);
          const now = new Date();
          const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));

          // Check quiet hours
          if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
            if (notificationService.isQuietHours(preferences.quiet_hours_start, preferences.quiet_hours_end)) {
              continue;
            }
          }

          const message = notificationService.formatReminderMessage(scheduledPost, minutesUntil);
          
          const success = await notificationService.showBrowserNotification({
            title: 'Posting Reminder',
            body: message,
            tag: `reminder-${reminder.id}`,
            requireInteraction: minutesUntil <= 5, // Require interaction for immediate reminders
            data: {
              url: '/dashboard/calendar',
              reminderId: reminder.id,
              postId: reminder.scheduled_post_id,
            },
          });

          if (success) {
            await notificationService.markReminderAsSent(reminder.id);
            
            // Also create in-app notification
            await notificationService.createInAppNotification(userId, {
              title: 'Posting Reminder',
              message,
              type: 'reminder',
              action_url: '/dashboard/calendar',
              action_label: 'View Calendar',
              scheduled_post_id: reminder.scheduled_post_id,
            });
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [userId, preferences, notificationService]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const updated = await notificationService.updateNotificationPreferences(userId, newPreferences);
      if (updated) {
        setPreferences(updated);
        toast.success('Notification preferences updated');
      }
      return updated;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update notification preferences');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, notificationService]);

  const requestBrowserPermission = useCallback(async () => {
    const permState = await notificationService.requestNotificationPermission();
    setPermissionState(permState);
    
    if (permState.permission === 'granted') {
      toast.success('Browser notifications enabled');
    } else if (permState.permission === 'denied') {
      toast.error('Browser notifications denied. Please enable in browser settings.');
    }
    
    return permState;
  }, [notificationService]);

  const scheduleReminders = useCallback(async (
    scheduledPostId: string,
    scheduledTime: Date,
    reminderIntervals?: number[]
  ) => {
    if (!userId) {
      console.log('No userId available for scheduling reminders');
      return [];
    }

    // Use default intervals if no preferences are set
    const intervals = reminderIntervals || preferences?.reminder_intervals || [15, 60];

    try {
      const reminders = await notificationService.schedulePostingReminders(
        userId,
        scheduledPostId,
        scheduledTime,
        intervals
      );

      if (reminders.length > 0) {
        console.log(`Successfully scheduled ${reminders.length} reminders`);
        // Don't show toast here as it's called from ContentScheduler
      } else {
        console.log('No reminders were scheduled (possibly all in the past)');
      }

      return reminders;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      // Don't show error toast here as it's handled in ContentScheduler
      return [];
    }
  }, [userId, preferences, notificationService]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await notificationService.markNotificationAsRead(notificationId);
    if (success) {
      setInAppNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
    return success;
  }, [notificationService]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const notifications = await notificationService.getInAppNotifications(userId);
      setInAppNotifications(notifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [userId, notificationService]);

  const unreadCount = inAppNotifications.filter(n => !n.is_read).length;

  return {
    // State
    preferences,
    inAppNotifications,
    permissionState,
    isLoading,
    unreadCount,
    
    // Actions
    updatePreferences,
    requestBrowserPermission,
    scheduleReminders,
    markAsRead,
    refreshNotifications,
    
    // Service instance for advanced usage
    notificationService,
  };
}
