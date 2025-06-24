export interface NotificationPreferences {
  id: string;
  user_id: string;
  browser_notifications: boolean;
  email_notifications: boolean;
  reminder_intervals: number[]; // Minutes before posting (e.g., [15, 60, 1440])
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface PostingReminder {
  id: string;
  user_id: string;
  scheduled_post_id: string;
  reminder_time: string; // ISO timestamp
  reminder_type: 'browser' | 'email' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'reminder' | 'success' | 'warning' | 'info';
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  scheduled_post_id?: string;
  created_at: string;
  expires_at?: string;
}

export interface NotificationSettings {
  browserEnabled: boolean;
  emailEnabled: boolean;
  reminderIntervals: number[];
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  requested: boolean;
}

export interface ReminderSchedule {
  postId: string;
  postTitle: string;
  platform: string;
  scheduledTime: Date;
  reminderTimes: Date[];
  content: string;
}
