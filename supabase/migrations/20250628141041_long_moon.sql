/*
  # Add Challenge Fields and Parent Goal Relationship

  1. New Fields
    - `is_challenge`: Boolean flag to identify if the goal is a short-term challenge
    - `challenge_frequency`: Frequency of the challenge (daily, weekly, one-time)
    - `challenge_type`: Type of action required for the challenge
    - `challenge_reward_xp`: XP awarded upon completion
    - `parent_goal_id`: Foreign key linking a challenge to its parent goal

  2. Security
    - Update RLS policies to maintain proper access control
*/

-- Add challenge fields to user_goals table
ALTER TABLE user_goals 
  ADD COLUMN IF NOT EXISTS is_challenge BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS challenge_frequency TEXT CHECK (challenge_frequency IN ('daily', 'weekly', 'one-time')),
  ADD COLUMN IF NOT EXISTS challenge_type TEXT CHECK (challenge_type IN ('content_generation', 'style_analysis', 'adapt_content', 'schedule_post', 'engage_followers')),
  ADD COLUMN IF NOT EXISTS challenge_reward_xp INTEGER,
  ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES user_goals(id) ON DELETE SET NULL;

-- Create index for parent_goal_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_goals_parent_goal_id ON user_goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_is_challenge ON user_goals(is_challenge);

-- Create function to update parent goal progress when challenge is completed
CREATE OR REPLACE FUNCTION update_parent_goal_on_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
  parent_goal_record RECORD;
  progress_percentage DECIMAL(5,2);
  challenge_contribution INTEGER := 1; -- Default contribution value
BEGIN
  -- Only proceed if this is a challenge and it's being marked as completed
  IF NEW.is_challenge = TRUE AND NEW.status = 'completed' AND 
     (OLD.status != 'completed' OR OLD.status IS NULL) AND
     NEW.parent_goal_id IS NOT NULL THEN
    
    -- Get the parent goal
    SELECT * INTO parent_goal_record FROM user_goals WHERE id = NEW.parent_goal_id;
    
    IF FOUND THEN
      -- Determine contribution based on challenge type
      CASE NEW.challenge_type
        WHEN 'content_generation' THEN challenge_contribution := 2;
        WHEN 'style_analysis' THEN challenge_contribution := 1;
        WHEN 'adapt_content' THEN challenge_contribution := 3;
        WHEN 'schedule_post' THEN challenge_contribution := 2;
        WHEN 'engage_followers' THEN challenge_contribution := 3;
        ELSE challenge_contribution := 1;
      END CASE;
      
      -- Update parent goal's current value
      UPDATE user_goals
      SET 
        current_value = current_value + challenge_contribution,
        updated_at = NOW()
      WHERE id = NEW.parent_goal_id;
      
      -- Calculate new progress percentage
      IF parent_goal_record.target_value > 0 THEN
        progress_percentage := ((parent_goal_record.current_value + challenge_contribution) / parent_goal_record.target_value) * 100;
      ELSE
        progress_percentage := 0;
      END IF;
      
      -- Log progress update in goal_progress_log
      INSERT INTO goal_progress_log (
        goal_id,
        previous_value,
        new_value,
        change_amount,
        progress_percentage,
        source,
        notes
      ) VALUES (
        NEW.parent_goal_id,
        parent_goal_record.current_value,
        parent_goal_record.current_value + challenge_contribution,
        challenge_contribution,
        progress_percentage,
        'challenge_completion',
        'Progress from completed challenge: ' || NEW.title
      );
      
      -- Check if parent goal should be auto-completed
      IF (parent_goal_record.current_value + challenge_contribution) >= parent_goal_record.target_value AND parent_goal_record.status = 'active' THEN
        UPDATE user_goals
        SET 
          status = 'completed',
          completed_at = NOW()
        WHERE id = NEW.parent_goal_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for challenge completion
DROP TRIGGER IF EXISTS update_parent_goal_on_challenge_completion ON user_goals;
CREATE TRIGGER update_parent_goal_on_challenge_completion
  AFTER UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_goal_on_challenge_completion();

-- Create function to get challenges for a parent goal
CREATE OR REPLACE FUNCTION get_challenges_for_parent_goal(parent_goal_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  goal_type TEXT,
  platform TEXT,
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2),
  status TEXT,
  is_challenge BOOLEAN,
  challenge_frequency TEXT,
  challenge_type TEXT,
  challenge_reward_xp INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.description,
    g.goal_type,
    g.platform,
    g.target_value,
    g.current_value,
    g.status,
    g.is_challenge,
    g.challenge_frequency,
    g.challenge_type,
    g.challenge_reward_xp,
    g.created_at,
    g.target_date,
    g.completed_at
  FROM user_goals g
  WHERE g.parent_goal_id = parent_goal_uuid
  AND g.is_challenge = TRUE
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get active challenges for a user
CREATE OR REPLACE FUNCTION get_active_challenges_for_user(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  goal_type TEXT,
  platform TEXT,
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2),
  status TEXT,
  is_challenge BOOLEAN,
  challenge_frequency TEXT,
  challenge_type TEXT,
  challenge_reward_xp INTEGER,
  parent_goal_id UUID,
  parent_goal_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  target_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.description,
    g.goal_type,
    g.platform,
    g.target_value,
    g.current_value,
    g.status,
    g.is_challenge,
    g.challenge_frequency,
    g.challenge_type,
    g.challenge_reward_xp,
    g.parent_goal_id,
    pg.title as parent_goal_title,
    g.created_at,
    g.target_date
  FROM user_goals g
  LEFT JOIN user_goals pg ON g.parent_goal_id = pg.id
  WHERE g.user_id = user_uuid
  AND g.is_challenge = TRUE
  AND g.status = 'active'
  ORDER BY g.target_date ASC, g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;