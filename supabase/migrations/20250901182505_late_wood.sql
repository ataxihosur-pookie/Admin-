/*
  # Fix user profile access for authentication

  1. Security Updates
    - Update RLS policies to allow users to read their own profiles
    - Add policy for authenticated users to access their profile data
    - Ensure admin users can access the system

  2. Changes
    - Drop existing restrictive policies
    - Add new policies that allow proper user access
    - Fix the uid() function usage for RLS
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies that work properly
CREATE POLICY "Enable read access for users to their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users to create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users to their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to read all user profiles
CREATE POLICY "Enable admin access to all profiles"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );