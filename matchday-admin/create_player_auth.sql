-- Create Test Player User for MatchDay Development
-- This script creates a test player user with predetermined credentials
-- Run this against your local Supabase instance (localhost:54321)

-- Create the auth user with confirmed email
DO $$
DECLARE
    player_user_id UUID;
BEGIN
    -- First, check if the user already exists
    SELECT id INTO player_user_id 
    FROM auth.users 
    WHERE email = 'player@matchday.com'
    LIMIT 1;
    
    IF player_user_id IS NULL THEN
        -- Create new auth user
        player_user_id := gen_random_uuid();
        
        -- Insert into auth.users table
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_token,
            recovery_token, 
            email_change_token_new,
            email_change,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            player_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'player@matchday.com',
            -- Password: player123! (bcrypt hash)
            '$2a$10$PkZPKsYr5F2OPgRAcDrYfOujWIT2UV8z2qgYtViHSWbXLKJYcPvIW',
            NOW(),
            '',
            '',
            '',
            '',
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']
            ),
            jsonb_build_object(
                'name', 'Test Player',
                'role', 'player'
            ),
            NOW(),
            NOW(),
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL
        );
        
        -- Create identity for the user
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            provider,
            identity_data,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            player_user_id,
            player_user_id::text,
            'email',
            jsonb_build_object(
                'sub', player_user_id::text,
                'email', 'player@matchday.com',
                'email_verified', true,
                'provider', 'email'
            ),
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Create user profile in public schema
        INSERT INTO public.user_profiles (
            id,
            display_name,
            full_name,
            preferred_position,
            location,
            bio,
            role,
            created_at,
            updated_at
        ) VALUES (
            player_user_id,
            'Test Player',
            'Test Player User',
            'Forward',
            'San Francisco, CA',
            'Test player account for development and testing',
            'player',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully created test player user';
        RAISE NOTICE 'Email: player@matchday.com';
        RAISE NOTICE 'Password: player123!';
        RAISE NOTICE 'User ID: %', player_user_id;
    ELSE
        -- Update existing user's password
        UPDATE auth.users 
        SET 
            encrypted_password = '$2a$10$PkZPKsYr5F2OPgRAcDrYfOujWIT2UV8z2qgYtViHSWbXLKJYcPvIW',
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = player_user_id;
        
        -- Ensure user profile exists with correct role
        INSERT INTO public.user_profiles (
            id,
            display_name,
            full_name,
            preferred_position,
            location,
            bio,
            role,
            created_at,
            updated_at
        ) VALUES (
            player_user_id,
            'Test Player',
            'Test Player User',
            'Forward',
            'San Francisco, CA',
            'Test player account for development and testing',
            'player',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'player',
            display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
            updated_at = NOW();
        
        RAISE NOTICE 'Updated existing player user';
        RAISE NOTICE 'Email: player@matchday.com';
        RAISE NOTICE 'Password: player123!';
        RAISE NOTICE 'User ID: %', player_user_id;
    END IF;
    
END $$;

-- Verify the user was created successfully
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.display_name,
    p.role,
    p.preferred_position
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'player@matchday.com';