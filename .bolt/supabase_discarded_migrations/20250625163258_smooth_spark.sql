/*
  # Fix track_content_interaction function

  1. Changes
    - Fix the track_content_interaction function parameter order
    - Ensure the function signature matches what's being called from the API

  2. Details
    - The function was being called with parameters in a different order than defined
    - This migration fixes the function signature to match the expected parameter order
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS track_content_interaction(uuid, uuid, text, text, integer);

-- Recreate the function with the correct parameter order
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