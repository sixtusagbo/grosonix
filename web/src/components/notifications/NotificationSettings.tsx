"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  BellOff,
  Clock,
  Mail,
  Monitor,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPreferences } from '@/types/notifications';

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const {
    preferences,
    permissionState,
    isLoading,
    updatePreferences,
    requestBrowserPermission,
  } = useNotifications(userId);

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({
    browser_notifications: false,
    email_notifications: false,
    reminder_intervals: [15, 60],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [newInterval, setNewInterval] = useState('');

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        browser_notifications: preferences.browser_notifications,
        email_notifications: preferences.email_notifications,
        reminder_intervals: preferences.reminder_intervals || [15, 60],
        quiet_hours_start: preferences.quiet_hours_start || '22:00',
        quiet_hours_end: preferences.quiet_hours_end || '08:00',
        timezone: preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    await updatePreferences(localPreferences);
  };

  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (enabled && permissionState.permission !== 'granted') {
      const newPermissionState = await requestBrowserPermission();
      if (newPermissionState.permission !== 'granted') {
        return;
      }
    }

    setLocalPreferences(prev => ({
      ...prev,
      browser_notifications: enabled,
    }));
  };

  const addReminderInterval = () => {
    const minutes = parseInt(newInterval);
    if (isNaN(minutes) || minutes <= 0) return;

    const currentIntervals = localPreferences.reminder_intervals || [];
    if (!currentIntervals.includes(minutes)) {
      setLocalPreferences(prev => ({
        ...prev,
        reminder_intervals: [...currentIntervals, minutes].sort((a, b) => a - b),
      }));
    }
    setNewInterval('');
  };

  const removeReminderInterval = (minutes: number) => {
    setLocalPreferences(prev => ({
      ...prev,
      reminder_intervals: (prev.reminder_intervals || []).filter(m => m !== minutes),
    }));
  };

  const formatInterval = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getPermissionIcon = () => {
    switch (permissionState.permission) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getPermissionText = () => {
    if (!permissionState.supported) {
      return 'Browser notifications not supported';
    }
    
    switch (permissionState.permission) {
      case 'granted':
        return 'Browser notifications enabled';
      case 'denied':
        return 'Browser notifications blocked';
      default:
        return 'Browser notifications not requested';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive posting reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <Label htmlFor="browser-notifications">Browser Notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get desktop notifications for posting reminders
                </p>
              </div>
              <Switch
                id="browser-notifications"
                checked={localPreferences.browser_notifications}
                onCheckedChange={handleBrowserNotificationToggle}
                disabled={!permissionState.supported}
              />
            </div>

            {/* Permission Status */}
            <div className="flex items-center gap-2 text-sm">
              {getPermissionIcon()}
              <span className={
                permissionState.permission === 'granted' 
                  ? 'text-green-600' 
                  : permissionState.permission === 'denied'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }>
                {getPermissionText()}
              </span>
              {permissionState.permission === 'denied' && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => window.open('chrome://settings/content/notifications', '_blank')}
                >
                  Enable in browser settings
                </Button>
              )}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive email reminders for scheduled posts
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={localPreferences.email_notifications}
              onCheckedChange={(checked) =>
                setLocalPreferences(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>

          {/* Reminder Intervals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <Label>Reminder Times</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Set how far in advance you want to be reminded before posts go live
            </p>

            {/* Current Intervals */}
            <div className="flex flex-wrap gap-2">
              {(localPreferences.reminder_intervals || []).map((minutes) => (
                <Badge key={minutes} variant="secondary" className="flex items-center gap-1">
                  {formatInterval(minutes)} before
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => removeReminderInterval(minutes)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            {/* Add New Interval */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Minutes"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                className="w-32"
                min="1"
                max="10080" // 1 week
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addReminderInterval}
                disabled={!newInterval || isNaN(parseInt(newInterval))}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Quick add:</span>
              {[5, 15, 30, 60, 120, 1440].map((minutes) => (
                <Button
                  key={minutes}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    const currentIntervals = localPreferences.reminder_intervals || [];
                    if (!currentIntervals.includes(minutes)) {
                      setLocalPreferences(prev => ({
                        ...prev,
                        reminder_intervals: [...currentIntervals, minutes].sort((a, b) => a - b),
                      }));
                    }
                  }}
                  disabled={(localPreferences.reminder_intervals || []).includes(minutes)}
                >
                  {formatInterval(minutes)}
                </Button>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              <Label>Quiet Hours</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Don't send notifications during these hours
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={localPreferences.quiet_hours_start}
                  onChange={(e) =>
                    setLocalPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={localPreferences.quiet_hours_end}
                  onChange={(e) =>
                    setLocalPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={localPreferences.timezone}
              onValueChange={(value) =>
                setLocalPreferences(prev => ({ ...prev, timezone: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
