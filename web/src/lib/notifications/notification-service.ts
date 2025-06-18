import { createBrowserClient } from '@supabase/ssr';
import {
  NotificationPreferences,
  PostingReminder,
  InAppNotification,
  BrowserNotificationOptions,
  NotificationPermissionState,
  ReminderSchedule,
} from '@/types/notifications';

export class NotificationService {
  private supabase;
  private notificationWorker?: ServiceWorker;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.initializeServiceWorker();
  }

  // Browser Notification Management
  async requestNotificationPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) {
      return {
        permission: 'denied',
        supported: false,
        requested: false,
      };
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return {
      permission,
      supported: true,
      requested: permission !== 'default',
    };
  }

  async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
    const permissionState = await this.requestNotificationPermission();
    
    if (!permissionState.supported || permissionState.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/notification-icon.png',
        badge: options.badge || '/icons/notification-badge.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      });

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      return false;
    }
  }

  // Service Worker for background notifications
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-notifications.js');
        this.notificationWorker = registration.active || undefined;
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  // Database Operations
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return null;
    }

    return data;
  }

  async schedulePostingReminders(
    userId: string,
    scheduledPostId: string,
    scheduledTime: Date,
    reminderIntervals: number[]
  ): Promise<PostingReminder[]> {
    const reminders: Partial<PostingReminder>[] = [];
    const now = new Date();

    for (const interval of reminderIntervals) {
      const reminderTime = new Date(scheduledTime.getTime() - interval * 60 * 1000);
      
      // Only schedule future reminders
      if (reminderTime > now) {
        reminders.push({
          user_id: userId,
          scheduled_post_id: scheduledPostId,
          reminder_time: reminderTime.toISOString(),
          reminder_type: 'browser',
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }

    if (reminders.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('posting_reminders')
      .insert(reminders)
      .select();

    if (error) {
      console.error('Error scheduling reminders:', error);
      return [];
    }

    return data;
  }

  async getPendingReminders(userId: string): Promise<PostingReminder[]> {
    const { data, error } = await this.supabase
      .from('posting_reminders')
      .select(`
        *,
        scheduled_posts (
          title,
          content,
          platform,
          scheduled_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('reminder_time', new Date().toISOString())
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching pending reminders:', error);
      return [];
    }

    return data;
  }

  async markReminderAsSent(reminderId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('posting_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) {
      console.error('Error marking reminder as sent:', error);
      return false;
    }

    return true;
  }

  // In-App Notifications
  async createInAppNotification(
    userId: string,
    notification: Partial<InAppNotification>
  ): Promise<InAppNotification | null> {
    const { data, error } = await this.supabase
      .from('in_app_notifications')
      .insert({
        user_id: userId,
        ...notification,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating in-app notification:', error);
      return null;
    }

    return data;
  }

  async getInAppNotifications(userId: string, limit = 20): Promise<InAppNotification[]> {
    const { data, error } = await this.supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching in-app notifications:', error);
      return [];
    }

    return data;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }

  // Utility Methods
  isQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  formatReminderMessage(scheduledPost: any, minutesUntil: number): string {
    const platform = scheduledPost.platform;
    const platformIcon = platform === 'twitter' ? '𝕏' : platform === 'linkedin' ? '💼' : '📷';
    
    if (minutesUntil <= 0) {
      return `${platformIcon} Time to post "${scheduledPost.title}" on ${platform}!`;
    } else if (minutesUntil < 60) {
      return `${platformIcon} "${scheduledPost.title}" posts in ${minutesUntil} minutes on ${platform}`;
    } else {
      const hours = Math.floor(minutesUntil / 60);
      return `${platformIcon} "${scheduledPost.title}" posts in ${hours} hour${hours > 1 ? 's' : ''} on ${platform}`;
    }
  }
}
