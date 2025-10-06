/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table cause infinite recursion
    - Policies are querying the users table from within the policy itself
    - This creates a circular dependency during authentication

  2. Solution
    - Drop existing problematic policies
    - Create simplified policies that use auth.uid() directly
    - Avoid self-referencing queries in policy conditions

  3. New Policies
    - Users can read their own profile using auth.uid()
    - Users can update their own profile using auth.uid()
    - Remove admin policy that causes recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);