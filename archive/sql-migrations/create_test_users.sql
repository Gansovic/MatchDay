-- Create test users with proper authentication
-- This script creates users in all required tables with correct relationships

-- First, create the auth users with proper password hashing
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'player@matchday.com',
  crypt('player123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'admin@matchday.com',
  crypt('admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create user profiles
INSERT INTO user_profiles (
  id,
  display_name,
  full_name,
  bio,
  location,
  preferred_position,
  role,
  date_of_birth,
  created_at,
  updated_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Test Player',
  'Test Player Full Name',
  'I love playing football and competing in leagues!',
  'Test City',
  'midfielder',
  'player',
  '1995-01-01',
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  'Test Admin',
  'Test Admin Full Name', 
  'League administrator managing competitions.',
  'Admin City',
  null,
  'league_admin',
  '1985-01-01',
  NOW(),
  NOW()
);

-- Create public users table records
INSERT INTO users (
  id,
  email,
  full_name,
  date_of_birth,
  position,
  role,
  bio,
  created_at,
  updated_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'player@matchday.com',
  'Test Player Full Name',
  '1995-01-01',
  'midfielder',
  'player',
  'I love playing football and competing in leagues!',
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  'admin@matchday.com',
  'Test Admin Full Name',
  '1985-01-01',
  null,
  'admin',
  'League administrator managing competitions.',
  NOW(),
  NOW()
);

-- Verify the users were created
SELECT 'auth.users' as table_name, id, email FROM auth.users WHERE email IN ('player@matchday.com', 'admin@matchday.com')
UNION ALL
SELECT 'user_profiles' as table_name, id::text, display_name FROM user_profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL  
SELECT 'public.users' as table_name, id::text, full_name FROM users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
