-- Create social_activity_log table for tracking user social media activity
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_activity_log_user_id ON social_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_platform ON social_activity_log(platform);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_activity_type ON social_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_activity_date ON social_activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_created_at ON social_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_user_platform ON social_activity_log(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_activity_log_user_date ON social_activity_log(user_id, activity_date);

-- Enable Row Level Security (RLS)
ALTER TABLE social_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own social activity" 
    ON social_activity_log FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social activity" 
    ON social_activity_log FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social activity" 
    ON social_activity_log FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social activity" 
    ON social_activity_log FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON social_activity_log TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to get activity summary
CREATE OR REPLACE FUNCTION get_activity_summary(
    p_user_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    platform TEXT,
    activity_type TEXT,
    total_count BIGINT,
    total_engagement BIGINT,
    total_reach BIGINT,
    total_impressions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sal.platform,
        sal.activity_type,
        COUNT(*) as total_count,
        COALESCE(SUM(sal.engagement_count), 0) as total_engagement,
        COALESCE(SUM(sal.reach_count), 0) as total_reach,
        COALESCE(SUM(sal.impression_count), 0) as total_impressions
    FROM social_activity_log sal
    WHERE sal.user_id = p_user_id
    AND sal.activity_date >= p_start_date
    AND sal.activity_date <= p_end_date
    GROUP BY sal.platform, sal.activity_type
    ORDER BY sal.platform, sal.activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get daily activity counts
CREATE OR REPLACE FUNCTION get_daily_activity_counts(
    p_user_id UUID,
    p_platform TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    activity_date DATE,
    platform TEXT,
    post_count BIGINT,
    engagement_count BIGINT,
    reach_count BIGINT,
    impression_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sal.activity_date,
        sal.platform,
        COUNT(CASE WHEN sal.activity_type = 'post' THEN 1 END) as post_count,
        COALESCE(SUM(sal.engagement_count), 0) as engagement_count,
        COALESCE(SUM(sal.reach_count), 0) as reach_count,
        COALESCE(SUM(sal.impression_count), 0) as impression_count
    FROM social_activity_log sal
    WHERE sal.user_id = p_user_id
    AND sal.activity_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    AND (p_platform IS NULL OR sal.platform = p_platform)
    GROUP BY sal.activity_date, sal.platform
    ORDER BY sal.activity_date DESC, sal.platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
