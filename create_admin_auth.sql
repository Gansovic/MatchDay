-- Create admin user properly using Supabase auth functions
-- This ensures proper password hashing and user state

-- First, insert into auth.users with proper password hashing
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
    banned_until,
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
    crypt('password123', gen_salt('bf')),
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
    NULL,
    '',
    NULL,
    false,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('password123', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- Insert into auth.identities for email provider
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
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "admin@matchday.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, id) DO UPDATE SET
    updated_at = NOW();

-- Update the user_profiles table to match
INSERT INTO user_profiles (
    id,
    full_name,
    bio,
    phone
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Admin User',
    'MatchDay Administrator',
    '+1234567890'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio;

SELECT 'Admin user created successfully for Supabase Auth!' as message;