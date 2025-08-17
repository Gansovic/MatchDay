-- Simple fix: Create function that only handles user_profiles table
-- The user_profiles table references auth.users directly, so this should work

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Create simple function to handle new user signup - only creates user_profiles record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into user_profiles table (this is what the application expects)
    -- The foreign key references auth.users(id) directly, so NEW.id should work
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

-- Create simple function to handle user metadata updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
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

-- Sync existing auth users to user_profiles table
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
COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile in user_profiles table when a new auth user is created';
COMMENT ON FUNCTION public.handle_user_update IS 'Syncs updates from auth.users to user_profiles table';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT UPDATE (full_name, avatar_url, bio, phone) ON public.user_profiles TO authenticated;