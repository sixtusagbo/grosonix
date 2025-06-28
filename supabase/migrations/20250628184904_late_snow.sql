/*
  # Add Subscription Update Policy

  1. Changes
    - Add RLS policy to allow users to update their own subscriptions
    - This is critical for the subscription management functionality to work properly

  2. Security
    - Users can only update their own subscription records
    - Maintains proper access control while enabling necessary functionality
*/

-- Add RLS policy for users to update their own subscriptions
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT UPDATE ON subscriptions TO authenticated;