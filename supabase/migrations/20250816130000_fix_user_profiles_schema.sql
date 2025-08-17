-- Fix user_profiles table schema to match application requirements

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS preferred_position VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Update display_name to use full_name if display_name is null
UPDATE user_profiles 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Create a function to automatically set display_name from full_name if not provided
CREATE OR REPLACE FUNCTION set_default_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL AND NEW.full_name IS NOT NULL THEN
        NEW.display_name := NEW.full_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set display_name
DROP TRIGGER IF EXISTS trigger_set_default_display_name ON user_profiles;
CREATE TRIGGER trigger_set_default_display_name
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_display_name();

-- Add index for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_position ON user_profiles(preferred_position);