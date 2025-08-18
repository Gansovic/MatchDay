-- Fix RLS policies to prevent infinite recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "League admins can view league member profiles" ON user_profiles;
DROP POLICY IF EXISTS "App admins can view all profiles" ON user_profiles;

-- Simple, non-recursive policies

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (simplified to avoid recursion)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Insert policy for new profiles (typically handled by triggers)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create a separate function to check user roles safely
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS app_user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_user_role;
BEGIN
  -- Bypass RLS to get the role
  SELECT role INTO user_role 
  FROM user_profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'player');
END;
$$;

-- League admins can view profiles of users in their leagues (using the safe function)
CREATE POLICY "League admins can view league member profiles" ON user_profiles
    FOR SELECT
    USING (
        get_user_role(auth.uid()) IN ('league_admin', 'app_admin') AND
        (
            -- App admins can see everyone
            get_user_role(auth.uid()) = 'app_admin' OR
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