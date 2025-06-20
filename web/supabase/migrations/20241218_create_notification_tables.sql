-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    browser_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT false,
    reminder_intervals INTEGER[] DEFAULT ARRAY[15, 60], -- Minutes before posting
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create posting reminders table
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

-- Create in-app notifications table
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
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_user_id ON posting_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_scheduled_post_id ON posting_reminders(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_reminder_time ON posting_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_posting_reminders_status ON posting_reminders(status);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_expires_at ON in_app_notifications(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posting_reminders_updated_at 
    BEFORE UPDATE ON posting_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

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

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM in_app_notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    DELETE FROM posting_reminders 
    WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending reminders
CREATE OR REPLACE FUNCTION get_pending_reminders(user_uuid UUID)
RETURNS TABLE (
    reminder_id UUID,
    scheduled_post_id UUID,
    reminder_time TIMESTAMP WITH TIME ZONE,
    post_title TEXT,
    post_content TEXT,
    post_platform TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id as reminder_id,
        pr.scheduled_post_id,
        pr.reminder_time,
        sp.title as post_title,
        sp.content as post_content,
        sp.platform as post_platform,
        sp.scheduled_at
    FROM posting_reminders pr
    JOIN scheduled_posts sp ON pr.scheduled_post_id = sp.id
    WHERE pr.user_id = user_uuid
    AND pr.status = 'pending'
    AND pr.reminder_time <= NOW()
    ORDER BY pr.reminder_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
