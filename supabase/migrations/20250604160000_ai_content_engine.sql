/*
  # AI Content Engine Tables

  1. New Tables
    - `user_style_profiles`: Store analyzed user writing styles
    - `content_suggestions`: Store generated content suggestions
    - `content_adaptations`: Store cross-platform content adaptations
    - `ai_usage_tracking`: Track AI API usage for rate limiting

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create user_style_profiles table
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tone text NOT NULL,
  topics text[] DEFAULT '{}',
  writing_patterns text[] DEFAULT '{}',
  engagement_strategies text[] DEFAULT '{}',
  vocabulary_level text NOT NULL DEFAULT 'professional',
  emoji_usage text NOT NULL DEFAULT 'minimal',
  hashtag_style text NOT NULL DEFAULT 'moderate usage',
  content_length_preference text NOT NULL DEFAULT 'medium',
  analyzed_posts_count integer DEFAULT 0,
  confidence_score integer DEFAULT 0,
  last_analyzed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create content_suggestions table
CREATE TABLE IF NOT EXISTS content_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  platform text NOT NULL,
  hashtags text[] DEFAULT '{}',
  engagement_score integer DEFAULT 0,
  prompt text,
  tone text,
  is_saved boolean DEFAULT false,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_adaptations table
CREATE TABLE IF NOT EXISTS content_adaptations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_content text NOT NULL,
  adapted_content jsonb NOT NULL, -- Store platform-specific adaptations
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_usage_tracking table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature_type text NOT NULL, -- 'content_generation', 'style_analysis', 'adaptation'
  usage_count integer DEFAULT 1,
  date_used date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_type, date_used)
);

-- Enable Row Level Security
ALTER TABLE user_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- User style profiles policies
CREATE POLICY "Users can read own style profile"
  ON user_style_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style profile"
  ON user_style_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style profile"
  ON user_style_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Content suggestions policies
CREATE POLICY "Users can read own content suggestions"
  ON content_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content suggestions"
  ON content_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content suggestions"
  ON content_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content suggestions"
  ON content_suggestions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Content adaptations policies
CREATE POLICY "Users can read own content adaptations"
  ON content_adaptations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content adaptations"
  ON content_adaptations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content adaptations"
  ON content_adaptations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI usage tracking policies
CREATE POLICY "Users can read own AI usage"
  ON ai_usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON ai_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage"
  ON ai_usage_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER set_user_style_profiles_updated_at
  BEFORE UPDATE ON user_style_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_content_suggestions_updated_at
  BEFORE UPDATE ON content_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_content_adaptations_updated_at
  BEFORE UPDATE ON content_adaptations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_ai_usage_tracking_updated_at
  BEFORE UPDATE ON ai_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_content_suggestions_user_platform ON content_suggestions(user_id, platform);
CREATE INDEX idx_content_suggestions_created_at ON content_suggestions(created_at DESC);
CREATE INDEX idx_ai_usage_tracking_user_date ON ai_usage_tracking(user_id, date_used);
CREATE INDEX idx_content_adaptations_user_created ON content_adaptations(user_id, created_at DESC);

-- Create function to get daily AI usage
CREATE OR REPLACE FUNCTION get_daily_ai_usage(
  p_user_id uuid,
  p_feature_type text,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS integer AS $$
BEGIN
  RETURN COALESCE(
    (SELECT usage_count 
     FROM ai_usage_tracking 
     WHERE user_id = p_user_id 
       AND feature_type = p_feature_type 
       AND date_used = p_date),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_feature_type text,
  p_increment integer DEFAULT 1
)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO ai_usage_tracking (user_id, feature_type, usage_count, date_used)
  VALUES (p_user_id, p_feature_type, p_increment, CURRENT_DATE)
  ON CONFLICT (user_id, feature_type, date_used)
  DO UPDATE SET 
    usage_count = ai_usage_tracking.usage_count + p_increment,
    updated_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
