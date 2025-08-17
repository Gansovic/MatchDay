-- Migration: Create user profile trigger
-- Purpose: Automatically create a user profile in public.users when a new auth user is created
-- Date: 2025-08-17

-- Step 1: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new row into public.users
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Update function to handle metadata updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the corresponding row in public.users
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_update();

-- Step 5: Sync existing auth users to public.users
-- This ensures any existing auth users have corresponding profiles
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

-- Step 6: Add comments
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user profile in public.users when a new auth user is created';
COMMENT ON FUNCTION public.handle_user_update IS 'Syncs updates from auth.users to public.users';

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE (full_name, phone, date_of_birth, position, preferred_foot, bio, profile_image_url) ON public.users TO authenticated;