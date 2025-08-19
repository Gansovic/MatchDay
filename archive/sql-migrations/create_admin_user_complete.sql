-- Create complete admin user for MatchDay application
-- This script creates an admin user in both auth.users and user_profiles tables
-- with all required fields and proper relationships

-- Admin credentials:
-- Email: admin@matchday.com
-- Password: AdminMatch2025!
-- Display Name: Admin User
-- Role: Administrator

-- First, delete any existing admin user to ensure clean creation
DELETE FROM user_profiles WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.identities WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';

-- Create admin user in auth.users table with proper Supabase structure
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_sent_at,
    recovery_token,
    email_change_sent_at,
    email_change,
    email_change_confirm_status,
    banned_until,
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
    email_change_token_new,
    email_change_token_current,
    email_change_confirm_status_new,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@matchday.com',
    crypt('AdminMatch2025!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NULL,
    '',
    NULL,
    '',
    0,
    NULL,
    '{"provider": "email", "providers": ["email"], "role": "admin"}',
    '{"full_name": "Admin User", "display_name": "Admin User", "role": "admin"}',
    false,
    NOW(),
    NOW(),
    '+1-555-ADMIN',
    NOW(),
    '',
    '',
    NULL,
    '',
    '',
    0,
    '',
    NULL,
    false,
    NULL
);

-- Create identity record for email authentication
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "admin@matchday.com", "email_verified": true, "role": "admin"}',
    'email',
    NOW(),
    NOW(),
    NOW()
);

-- Create user profile with all required fields
INSERT INTO user_profiles (
    id,
    full_name,
    display_name,
    bio,
    phone,
    preferred_position,
    date_of_birth,
    location,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Admin User',
    'Admin User',
    'MatchDay Application Administrator - Full system access for managing leagues, teams, and users.',
    '+1-555-ADMIN',
    'Administrator',
    '1990-01-01',
    'System Administration',
    NULL,
    NOW(),
    NOW()
);

-- Verify the admin user was created successfully
SELECT 
    'Admin user created successfully!' as status,
    au.email,
    up.display_name,
    up.preferred_position,
    up.bio,
    au.created_at
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'admin@matchday.com';

-- Display login credentials
SELECT 
    '=== ADMIN LOGIN CREDENTIALS ===' as info,
    'Email: admin@matchday.com' as email,
    'Password: AdminMatch2025!' as password,
    'Access Level: Administrator' as role,
    'Created: ' || NOW()::text as created_time;