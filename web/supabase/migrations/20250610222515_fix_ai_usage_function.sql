-- Fix AI usage function parameter order to match expected signature
-- Drop existing functions first
DROP FUNCTION IF EXISTS get_daily_ai_usage(uuid, text, date);
DROP FUNCTION IF EXISTS increment_ai_usage(uuid, text, integer);

-- Recreate function with correct parameter order that matches the error message
CREATE OR REPLACE FUNCTION get_daily_ai_usage(
  p_date date,
  p_feature_type text,
  p_user_id uuid
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

-- Recreate increment function with consistent naming
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
