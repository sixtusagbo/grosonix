-- Create scheduled_posts table for content calendar
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_scheduled ON scheduled_posts(user_id, scheduled_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_posts_updated_at 
    BEFORE UPDATE ON scheduled_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled posts" 
    ON scheduled_posts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts" 
    ON scheduled_posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" 
    ON scheduled_posts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts" 
    ON scheduled_posts FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON scheduled_posts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
