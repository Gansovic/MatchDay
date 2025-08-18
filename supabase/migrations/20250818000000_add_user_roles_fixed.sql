-- Add user role system to MatchDay
-- This migration adds role-based access control for separate player and admin apps

-- First create a new enum for roles that better fits our needs
CREATE TYPE app_user_role AS ENUM ('player', 'league_admin', 'app_admin');

-- Add role column to user_profiles table with the new enum
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role app_user_role NOT NULL DEFAULT 'player';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Create admin test users in auth.users table first (if they don't exist)
-- These would normally be created through Supabase auth, but for testing we'll insert them
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'admin@matchday.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NOW(),
  '',
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NOW(),
  '',
  0,
  NULL,
  '',
  NOW()
), (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'player@matchday.com',
  crypt('player123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NOW(),
  '',
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NOW(),
  '',
  0,
  NULL,
  '',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create user profiles for test users
INSERT INTO user_profiles (id, full_name, role)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Admin User', 'league_admin'),
  ('11111111-1111-1111-1111-111111111111', 'Player User', 'player')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "League admins can view league member profiles" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (but not their role unless they're app_admin)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = (SELECT role FROM user_profiles WHERE id = auth.uid()) OR 
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'app_admin')
    );

-- League admins can view profiles of users in their leagues
CREATE POLICY "League admins can view league member profiles" ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM leagues l
            JOIN teams t ON t.league_id = l.id
            JOIN team_members tm ON tm.team_id = t.id
            WHERE l.created_by = auth.uid() 
            AND tm.user_id = user_profiles.id
        )
    );

-- App admins can view all profiles
CREATE POLICY "App admins can view all profiles" ON user_profiles
    FOR SELECT
    USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'app_admin');