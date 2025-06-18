-- Combined migration script to create all missing tables
-- Run this in your Supabase SQL Editor

-- 1. Create social_activity_log table
CREATE TABLE IF NOT EXISTS social_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram')),
    activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'like', 'comment', 'share', 'follow', 'unfollow')),
    activity_data JSONB NOT NULL DEFAULT '{}',
    post_id TEXT,
    engagement_count INTEGER DEFAULT 0,
    reach_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activity_date DATE DEFAULT CURRENT_DATE
);

-- 2. Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    hashtags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    engagement_prediction DECIMAL(5,2),
    optimal_time_score INTEGER,
    is_optimal_time BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    browser_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT false,
    reminder_intervals INTEGER[] DEFAULT ARRAY[15, 60],
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Create posting reminders table
CREATE TABLE IF NOT EXISTS posting_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type TEXT CHECK (reminder_type IN ('browser', 'email', 'in_app')) DEFAULT 'browser',
    status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create in-app notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('reminder', 'success', 'warning', 'info')) DEFAULT 'info',
    action_url TEXT,
    action_label TEXT,
    is_read BOOLEAN DEFAULT false,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_activity_log_user_id ON social_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_platform ON social_activity_log(platform);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_activity_date ON social_activity_log(activity_date);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_user_id ON posting_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_scheduled_post_id ON posting_reminders(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_reminder_time ON posting_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_status ON posting_reminders(status);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at 
    BEFORE UPDATE ON scheduled_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posting_reminders_updated_at 
    BEFORE UPDATE ON posting_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE social_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for social_activity_log
CREATE POLICY "Users can view their own social activity" ON social_activity_log
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social activity" ON social_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social activity" ON social_activity_log
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social activity" ON social_activity_log
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scheduled posts" ON scheduled_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for posting_reminders
CREATE POLICY "Users can view their own posting reminders" ON posting_reminders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own posting reminders" ON posting_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posting reminders" ON posting_reminders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posting reminders" ON posting_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for in_app_notifications
CREATE POLICY "Users can view their own in-app notifications" ON in_app_notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own in-app notifications" ON in_app_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own in-app notifications" ON in_app_notifications
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own in-app notifications" ON in_app_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON social_activity_log TO authenticated;
GRANT ALL ON scheduled_posts TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON posting_reminders TO authenticated;
GRANT ALL ON in_app_notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
