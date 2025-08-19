-- Fix Authentication Credentials for MatchDay Application
-- This script properly sets up auth.users with correct bcrypt password hashes
-- for the specified user credentials and ensures user_profiles are synchronized

-- First, remove any existing test users to start fresh
DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' IN ('admin@matchday.com', 'player@matchday.com');
DELETE FROM user_profiles WHERE id IN ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
DELETE FROM auth.users WHERE email IN ('admin@matchday.com', 'player@matchday.com');

-- Insert admin user with correct bcrypt hash for 'admin123!'
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
    crypt('admin123!', gen_salt('bf')),
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
);

-- Insert player user with correct bcrypt hash for 'player123!'
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
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'player@matchday.com',
    crypt('player123!', gen_salt('bf')),
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
);

-- Insert corresponding identity records for email provider
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
);

-- Create corresponding user profiles
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
);

-- Verify the setup by checking if passwords can be validated
-- This will return true for each user if the password hash is correct
SELECT 
    email,
    encrypted_password = crypt('admin123!', encrypted_password) AS admin_password_correct
FROM auth.users 
WHERE email = 'admin@matchday.com';

SELECT 
    email,
    encrypted_password = crypt('player123!', encrypted_password) AS player_password_correct
FROM auth.users 
WHERE email = 'player@matchday.com';

-- Display final user information
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.display_name,
    p.role,
    'Password set correctly' as status
FROM auth.users u
JOIN user_profiles p ON u.id = p.id
WHERE u.email IN ('admin@matchday.com', 'player@matchday.com')
ORDER BY u.email;

-- Success message
SELECT 'Authentication credentials fixed successfully!' as message,
       'admin@matchday.com / admin123!' as admin_credentials,
       'player@matchday.com / player123!' as player_credentials;