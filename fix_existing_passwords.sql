-- Fix Existing User Passwords
-- This script updates the encrypted_password field for existing users
-- Run this when users exist but have incorrect password hashes

-- Update admin user password hash
UPDATE auth.users 
SET 
    encrypted_password = crypt('admin123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@matchday.com';

-- Update player user password hash  
UPDATE auth.users 
SET 
    encrypted_password = crypt('player123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'player@matchday.com';

-- Ensure identities exist for email authentication
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    u.id,
    ('{"sub": "' || u.id || '", "email": "' || u.email || '"}')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email IN ('admin@matchday.com', 'player@matchday.com')
ON CONFLICT (provider, id) DO UPDATE SET
    updated_at = NOW(),
    last_sign_in_at = NOW();

-- Ensure user_profiles exist with correct roles
INSERT INTO user_profiles (id, full_name, display_name, role)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'admin@matchday.com' THEN 'Admin User'
        WHEN u.email = 'player@matchday.com' THEN 'Player User'
    END,
    CASE 
        WHEN u.email = 'admin@matchday.com' THEN 'Admin User'
        WHEN u.email = 'player@matchday.com' THEN 'Player User'
    END,
    CASE 
        WHEN u.email = 'admin@matchday.com' THEN 'league_admin'::app_user_role
        WHEN u.email = 'player@matchday.com' THEN 'player'::app_user_role
    END
FROM auth.users u
WHERE u.email IN ('admin@matchday.com', 'player@matchday.com')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

-- Test password validation
SELECT 
    'Password validation results:' as message;

SELECT 
    u.email,
    CASE 
        WHEN u.email = 'admin@matchday.com' AND u.encrypted_password = crypt('admin123!', u.encrypted_password) THEN 'VALID'
        WHEN u.email = 'player@matchday.com' AND u.encrypted_password = crypt('player123!', u.encrypted_password) THEN 'VALID'
        ELSE 'INVALID'
    END as password_status,
    p.role,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email IN ('admin@matchday.com', 'player@matchday.com')
ORDER BY u.email;

-- Final status
SELECT 
    COUNT(*) as users_fixed,
    'Passwords updated successfully' as status
FROM auth.users 
WHERE email IN ('admin@matchday.com', 'player@matchday.com')
AND email_confirmed_at IS NOT NULL;