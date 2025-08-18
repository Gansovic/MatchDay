-- Quick Authentication Restore Script
-- Run this after database resets to restore working authentication
-- This script assumes the schema is already in place

-- Update existing users or insert if they don't exist
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
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'admin@matchday.com',
    crypt('admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NULL,
    '',
    NULL,
    '',
    0,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User"}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
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
), (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'player@matchday.com',
    crypt('player123!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NULL,
    '',
    NULL,
    '',
    0,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Player User"}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
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
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('admin123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE auth.users.email = 'admin@matchday.com'
RETURNING id, email;

-- Update player user password separately to use correct password
UPDATE auth.users 
SET encrypted_password = crypt('player123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'player@matchday.com';

-- Insert or update identities
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "admin@matchday.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
), (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "player@matchday.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, id) DO UPDATE SET
    updated_at = NOW();

-- Insert or update user profiles
INSERT INTO user_profiles (
    id,
    full_name,
    display_name,
    bio,
    phone,
    role
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Admin User',
    'Admin User',
    'MatchDay League Administrator',
    '+1234567890',
    'league_admin'
), (
    '11111111-1111-1111-1111-111111111111',
    'Player User',
    'Player User',
    'MatchDay Player',
    '+1987654321',
    'player'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify authentication works
SELECT 'Authentication verification:' as status;
SELECT 
    email,
    CASE 
        WHEN encrypted_password = crypt('admin123!', encrypted_password) THEN 'VALID'
        ELSE 'INVALID'
    END as password_status
FROM auth.users 
WHERE email = 'admin@matchday.com';

SELECT 
    email,
    CASE 
        WHEN encrypted_password = crypt('player123!', encrypted_password) THEN 'VALID'
        ELSE 'INVALID'
    END as password_status
FROM auth.users 
WHERE email = 'player@matchday.com';

SELECT 'Setup complete! Credentials:' as message;
SELECT 'admin@matchday.com / admin123!' as admin_login;
SELECT 'player@matchday.com / player123!' as player_login;