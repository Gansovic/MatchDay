-- Fix user role system - SECURITY HARDENED VERSION
-- This migration adds role-based access control without hardcoded test data
-- 
-- IMPORTANT: This replaces 20250818000000_add_user_roles_fixed.sql 
-- The previous migration contained hardcoded credentials which is a security risk

-- Create a new enum for roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_user_role AS ENUM ('player', 'league_admin', 'app_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to user_profiles table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE user_profiles 
    ADD COLUMN role app_user_role NOT NULL DEFAULT 'player';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "League admins can view league member profiles" ON user_profiles;
DROP POLICY IF EXISTS "App admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

-- Create a safe function to check user roles without RLS recursion
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id UUID)
RETURNS app_user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_user_role;
BEGIN
  -- Bypass RLS to safely get the role
  SELECT role INTO user_role 
  FROM user_profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'player');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO anon;

-- Simple, non-recursive RLS policies

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (but not their role unless they're app_admin)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = get_user_role_safe(auth.uid()) OR 
         get_user_role_safe(auth.uid()) = 'app_admin')
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Service role can do anything (for admin operations and edge functions)
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- League admins can view profiles of users in their leagues
CREATE POLICY "League admins can view league member profiles" ON user_profiles
    FOR SELECT
    USING (
        get_user_role_safe(auth.uid()) IN ('league_admin', 'app_admin') AND
        (
            -- App admins can see everyone
            get_user_role_safe(auth.uid()) = 'app_admin' OR
            -- League admins can see members of their leagues
            EXISTS (
                SELECT 1 
                FROM leagues l
                JOIN teams t ON t.league_id = l.id
                JOIN team_members tm ON tm.team_id = t.id
                WHERE l.created_by = auth.uid() 
                AND tm.user_id = user_profiles.id
            )
        )
    );

-- Add a comment to track that this is the secure version
COMMENT ON TYPE app_user_role IS 'User roles for MatchDay - secure version without test data';
COMMENT ON FUNCTION get_user_role_safe(UUID) IS 'Safely retrieves user role bypassing RLS to prevent recursion';

-- Create a function to safely create development users (only callable by service role)
CREATE OR REPLACE FUNCTION create_development_user(
  user_email TEXT,
  user_id UUID,
  user_role app_user_role DEFAULT 'player',
  display_name TEXT DEFAULT 'Development User'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow this in non-production environments
  -- This check would need to be customized based on your environment detection
  IF COALESCE(current_setting('app.environment', true), 'development') = 'production' THEN
    RAISE EXCEPTION 'Cannot create development users in production environment';
  END IF;

  -- Insert or update user profile (not auth.users - that should be done via Supabase Auth)
  INSERT INTO user_profiles (id, display_name, full_name, role)
  VALUES (user_id, display_name, display_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute only to service role for security
REVOKE EXECUTE ON FUNCTION create_development_user(TEXT, UUID, app_user_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_development_user(TEXT, UUID, app_user_role, TEXT) TO service_role;

COMMENT ON FUNCTION create_development_user(TEXT, UUID, app_user_role, TEXT) IS 'Safely creates development users - only works in non-production environments';