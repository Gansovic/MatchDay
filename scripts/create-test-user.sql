-- Create a test user in the database
-- This user ID matches the one being used in authentication

-- First, ensure the user exists in the auth.users table (if using Supabase Auth)
-- Note: This might need to be done through Supabase dashboard or API

-- Create the user profile in the public.users table
INSERT INTO users (
    id,
    email,
    display_name,
    full_name,
    avatar_url,
    preferred_sport,
    bio,
    location,
    is_active,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test@example.com',
    'TestUser',
    'Test User',
    NULL,
    'football',
    'Test user for development',
    'Test Location',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Also create a default test user for when no auth is provided
INSERT INTO users (
    id,
    email,
    display_name,
    full_name,
    avatar_url,
    preferred_sport,
    bio,
    location,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'default@example.com',
    'DefaultUser',
    'Default Test User',
    NULL,
    'football',
    'Default test user for development',
    'Test Location',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();