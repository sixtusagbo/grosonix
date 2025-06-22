/*
  # Content Analytics Tables

  1. New Tables
    - `content_analytics`: Track user interactions with content suggestions
    - `content_performance_metrics`: Aggregate analytics data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create content_analytics table to track user interactions
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  suggestion_id uuid REFERENCES content_suggestions(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('generated', 'viewed', 'saved', 'discarded', 'copied', 'used')),
  platform text NOT NULL,
  engagement_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create content_performance_metrics table for aggregated analytics
CREATE TABLE IF NOT EXISTS content_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date_period date DEFAULT CURRENT_DATE,
  platform text NOT NULL,
  total_generated integer DEFAULT 0,
  total_saved integer DEFAULT 0,
  total_discarded integer DEFAULT 0,
  total_used integer DEFAULT 0,
  save_rate decimal(5,2) DEFAULT 0.00,
  avg_engagement_score decimal(5,2) DEFAULT 0.00,
  top_performing_topics text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date_period, platform)
);

-- Enable Row Level Security
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Content analytics policies
CREATE POLICY "Users can read own content analytics"
  ON content_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content analytics"
  ON content_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Content performance metrics policies
CREATE POLICY "Users can read own performance metrics"
  ON content_performance_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics"
  ON content_performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance metrics"
  ON content_performance_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for performance metrics updated_at
CREATE TRIGGER set_content_performance_metrics_updated_at
  BEFORE UPDATE ON content_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_content_analytics_user_date ON content_analytics(user_id, created_at DESC);
CREATE INDEX idx_content_analytics_action_type ON content_analytics(user_id, action_type);
CREATE INDEX idx_content_performance_metrics_user_date ON content_performance_metrics(user_id, date_period DESC);

-- Function to track content interaction
CREATE OR REPLACE FUNCTION track_content_interaction(
  p_user_id uuid,
  p_suggestion_id uuid,
  p_action_type text,
  p_platform text,
  p_engagement_score integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Insert the interaction record
  INSERT INTO content_analytics (user_id, suggestion_id, action_type, platform, engagement_score)
  VALUES (p_user_id, p_suggestion_id, p_action_type, p_platform, p_engagement_score);
  
  -- Update or create performance metrics for today
  INSERT INTO content_performance_metrics (
    user_id, 
    date_period, 
    platform,
    total_generated,
    total_saved,
    total_discarded,
    total_used
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    p_platform,
    CASE WHEN p_action_type = 'generated' THEN 1 ELSE 0 END,
    CASE WHEN p_action_type = 'saved' THEN 1 ELSE 0 END,
    CASE WHEN p_action_type = 'discarded' THEN 1 ELSE 0 END,
    CASE WHEN p_action_type = 'used' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date_period, platform)
  DO UPDATE SET
    total_generated = content_performance_metrics.total_generated + 
      CASE WHEN p_action_type = 'generated' THEN 1 ELSE 0 END,
    total_saved = content_performance_metrics.total_saved + 
      CASE WHEN p_action_type = 'saved' THEN 1 ELSE 0 END,
    total_discarded = content_performance_metrics.total_discarded + 
      CASE WHEN p_action_type = 'discarded' THEN 1 ELSE 0 END,
    total_used = content_performance_metrics.total_used + 
      CASE WHEN p_action_type = 'used' THEN 1 ELSE 0 END,
    save_rate = CASE 
      WHEN (content_performance_metrics.total_generated + 
            CASE WHEN p_action_type = 'generated' THEN 1 ELSE 0 END) > 0 
      THEN ROUND(
        ((content_performance_metrics.total_saved + 
          CASE WHEN p_action_type = 'saved' THEN 1 ELSE 0 END)::decimal / 
         (content_performance_metrics.total_generated + 
          CASE WHEN p_action_type = 'generated' THEN 1 ELSE 0 END)) * 100, 2)
      ELSE 0 
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_generated bigint,
  total_saved bigint,
  total_discarded bigint,
  total_used bigint,
  overall_save_rate decimal,
  avg_engagement_score decimal,
  most_active_platform text,
  daily_metrics jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      DATE(ca.created_at) as date,
      ca.platform,
      COUNT(*) FILTER (WHERE ca.action_type = 'generated') as generated,
      COUNT(*) FILTER (WHERE ca.action_type = 'saved') as saved,
      COUNT(*) FILTER (WHERE ca.action_type = 'discarded') as discarded,
      COUNT(*) FILTER (WHERE ca.action_type = 'used') as used,
      AVG(ca.engagement_score) as avg_score
    FROM content_analytics ca
    WHERE ca.user_id = p_user_id 
      AND ca.created_at >= CURRENT_DATE - INTERVAL '%s days' % p_days
    GROUP BY DATE(ca.created_at), ca.platform
  ),
  platform_totals AS (
    SELECT 
      ca.platform,
      COUNT(*) as total_actions
    FROM content_analytics ca
    WHERE ca.user_id = p_user_id 
      AND ca.created_at >= CURRENT_DATE - INTERVAL '%s days' % p_days
    GROUP BY ca.platform
    ORDER BY total_actions DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(SUM(ds.generated), 0) as total_generated,
    COALESCE(SUM(ds.saved), 0) as total_saved,
    COALESCE(SUM(ds.discarded), 0) as total_discarded,
    COALESCE(SUM(ds.used), 0) as total_used,
    CASE 
      WHEN SUM(ds.generated) > 0 
      THEN ROUND((SUM(ds.saved)::decimal / SUM(ds.generated)) * 100, 2)
      ELSE 0 
    END as overall_save_rate,
    ROUND(COALESCE(AVG(ds.avg_score), 0), 2) as avg_engagement_score,
    (SELECT platform FROM platform_totals LIMIT 1) as most_active_platform,
    jsonb_agg(
      jsonb_build_object(
        'date', ds.date,
        'platform', ds.platform,
        'generated', ds.generated,
        'saved', ds.saved,
        'discarded', ds.discarded,
        'used', ds.used,
        'avg_score', ROUND(ds.avg_score, 2)
      ) ORDER BY ds.date DESC
    ) as daily_metrics
  FROM daily_stats ds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;