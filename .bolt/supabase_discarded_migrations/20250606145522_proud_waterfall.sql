/*
  # Add INSERT policy for profiles table

  1. Security
    - Add policy to allow authenticated users to insert their own profile
    - Ensures users can only create profiles for themselves using auth.uid()

  2. Changes
    - CREATE POLICY for INSERT operations on profiles table
    - Policy checks that the user can only insert a profile with their own auth.uid()
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);