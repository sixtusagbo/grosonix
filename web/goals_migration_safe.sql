-- Safe migration for Goals System
-- This version handles existing objects gracefully

-- 1. Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('followers', 'engagement_rate', 'posts_count', 'likes', 'comments', 'shares', 'impressions', 'custom')),
    platform TEXT CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'all')),
    target_value DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create goal_progress_log table
CREATE TABLE IF NOT EXISTS goal_progress_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
    previous_value DECIMAL(12,2) NOT NULL,
    new_value DECIMAL(12,2) NOT NULL,
    change_amount DECIMAL(12,2) NOT NULL,
    progress_percentage DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'automatic', 'api_sync')),
    notes TEXT
);

-- 3. Create goal_milestones table
CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
    milestone_percentage DECIMAL(5,2) NOT NULL CHECK (milestone_percentage > 0 AND milestone_percentage <= 100),
    milestone_value DECIMAL(12,2) NOT NULL,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS is implicit for CREATE INDEX)
DO $$ 
BEGIN
    -- Indexes for user_goals
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_goals_user_id') THEN
        CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_goals_status') THEN
        CREATE INDEX idx_user_goals_status ON user_goals(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_goals_goal_type') THEN
        CREATE INDEX idx_user_goals_goal_type ON user_goals(goal_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_goals_platform') THEN
        CREATE INDEX idx_user_goals_platform ON user_goals(platform);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_goals_target_date') THEN
        CREATE INDEX idx_user_goals_target_date ON user_goals(target_date);
    END IF;
    
    -- Indexes for goal_progress_log
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_progress_log_goal_id') THEN
        CREATE INDEX idx_goal_progress_log_goal_id ON goal_progress_log(goal_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_progress_log_recorded_at') THEN
        CREATE INDEX idx_goal_progress_log_recorded_at ON goal_progress_log(recorded_at);
    END IF;
    
    -- Indexes for goal_milestones
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_milestones_goal_id') THEN
        CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_milestones_is_achieved') THEN
        CREATE INDEX idx_goal_milestones_is_achieved ON goal_milestones(is_achieved);
    END IF;
END $$;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_goals_updated_at') THEN
        CREATE TRIGGER update_user_goals_updated_at 
            BEFORE UPDATE ON user_goals 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (DROP IF EXISTS first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
CREATE POLICY "Users can view their own goals" ON user_goals
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
CREATE POLICY "Users can insert their own goals" ON user_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
CREATE POLICY "Users can update their own goals" ON user_goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;
CREATE POLICY "Users can delete their own goals" ON user_goals
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for goal_progress_log
DROP POLICY IF EXISTS "Users can view progress for their own goals" ON goal_progress_log;
CREATE POLICY "Users can view progress for their own goals" ON goal_progress_log
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_progress_log.goal_id 
        AND (user_goals.user_id = auth.uid() OR user_goals.is_public = true)
    ));

DROP POLICY IF EXISTS "Users can insert progress for their own goals" ON goal_progress_log;
CREATE POLICY "Users can insert progress for their own goals" ON goal_progress_log
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_progress_log.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update progress for their own goals" ON goal_progress_log;
CREATE POLICY "Users can update progress for their own goals" ON goal_progress_log
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_progress_log.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete progress for their own goals" ON goal_progress_log;
CREATE POLICY "Users can delete progress for their own goals" ON goal_progress_log
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_progress_log.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

-- RLS policies for goal_milestones
DROP POLICY IF EXISTS "Users can view milestones for their own goals" ON goal_milestones;
CREATE POLICY "Users can view milestones for their own goals" ON goal_milestones
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_milestones.goal_id 
        AND (user_goals.user_id = auth.uid() OR user_goals.is_public = true)
    ));

DROP POLICY IF EXISTS "Users can insert milestones for their own goals" ON goal_milestones;
CREATE POLICY "Users can insert milestones for their own goals" ON goal_milestones
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_milestones.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update milestones for their own goals" ON goal_milestones;
CREATE POLICY "Users can update milestones for their own goals" ON goal_milestones
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_milestones.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete milestones for their own goals" ON goal_milestones;
CREATE POLICY "Users can delete milestones for their own goals" ON goal_milestones
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM user_goals 
        WHERE user_goals.id = goal_milestones.goal_id 
        AND user_goals.user_id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON user_goals TO authenticated;
GRANT ALL ON goal_progress_log TO authenticated;
GRANT ALL ON goal_milestones TO authenticated;
