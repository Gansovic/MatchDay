-- Fix user profile trigger to create records in user_profiles table
-- This fixes the signup issue where users are created in public.users but not user_profiles

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Create updated function to handle new user signup
-- This function creates records in both users and user_profiles tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users table
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'player')::user_role,
        NOW(),
        NOW()
    );
    
    -- Insert into user_profiles table (this is what the application expects)
    INSERT INTO public.user_profiles (
        id,
        full_name,
        avatar_url,
        bio,
        phone,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'phone',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated function to handle user metadata updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update public.users table
    UPDATE public.users
    SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
        date_of_birth = CASE 
            WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
            ELSE date_of_birth 
        END,
        position = CASE 
            WHEN NEW.raw_user_meta_data->>'position' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'position')::position_type 
            ELSE position 
        END,
        preferred_foot = COALESCE(NEW.raw_user_meta_data->>'preferred_foot', preferred_foot),
        bio = COALESCE(NEW.raw_user_meta_data->>'bio', bio),
        profile_image_url = COALESCE(NEW.raw_user_meta_data->>'profile_image_url', profile_image_url),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Update user_profiles table (this is what the application uses)
    UPDATE public.user_profiles
    SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        bio = COALESCE(NEW.raw_user_meta_data->>'bio', bio),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_update();

-- Sync existing auth users to both tables
-- First ensure they exist in public.users
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'role', 'player')::user_role,
    au.created_at,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Then ensure they exist in user_profiles
INSERT INTO public.user_profiles (id, full_name, avatar_url, bio, phone, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'bio',
    au.raw_user_meta_data->>'phone',
    au.created_at,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);

-- Add comments
COMMENT ON FUNCTION public.handle_new_user IS 'Creates user records in both users and user_profiles tables when a new auth user is created';
COMMENT ON FUNCTION public.handle_user_update IS 'Syncs updates from auth.users to both users and user_profiles tables';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT UPDATE (full_name, phone, date_of_birth, position, preferred_foot, bio, profile_image_url) ON public.users TO authenticated;
GRANT UPDATE (full_name, avatar_url, bio, phone) ON public.user_profiles TO authenticated;