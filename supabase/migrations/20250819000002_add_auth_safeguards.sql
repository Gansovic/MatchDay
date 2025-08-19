-- Migration Safeguards for Auth Tables
-- This migration adds protection mechanisms for critical auth infrastructure

-- Create a function to check auth system integrity
CREATE OR REPLACE FUNCTION check_auth_system_integrity()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  table_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
  role_enum_exists BOOLEAN;
  triggers_exist BOOLEAN;
  errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check if user_profiles table exists and has required columns
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_profiles';
  
  IF table_count = 0 THEN
    errors := array_append(errors, 'user_profiles table does not exist');
  ELSE
    -- Check for required columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
      errors := array_append(errors, 'user_profiles.role column is missing');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'id'
    ) THEN
      errors := array_append(errors, 'user_profiles.id column is missing');
    END IF;
  END IF;

  -- Check if app_user_role enum exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'app_user_role'
  ) INTO role_enum_exists;
  
  IF NOT role_enum_exists THEN
    errors := array_append(errors, 'app_user_role enum does not exist');
  END IF;

  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'user_profiles';
  
  IF policy_count < 3 THEN
    errors := array_append(errors, 'Insufficient RLS policies on user_profiles (expected at least 3)');
  END IF;

  -- Check critical functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname = 'get_user_role_safe';
  
  IF function_count = 0 THEN
    errors := array_append(errors, 'get_user_role_safe function does not exist');
  END IF;

  -- Check for user profile trigger
  SELECT COUNT(*) > 0 INTO triggers_exist
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname = 'user_profiles';

  -- Build result
  result := json_build_object(
    'healthy', array_length(errors, 1) IS NULL OR array_length(errors, 1) = 0,
    'timestamp', NOW(),
    'checks', json_build_object(
      'user_profiles_table_exists', table_count > 0,
      'role_enum_exists', role_enum_exists,
      'sufficient_policies', policy_count >= 3,
      'critical_functions_exist', function_count > 0,
      'triggers_exist', triggers_exist
    ),
    'errors', errors
  );

  RETURN result;
END;
$$;

-- Create emergency auth recovery function
CREATE OR REPLACE FUNCTION emergency_auth_recovery()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recovery_log TEXT := '';
BEGIN
  recovery_log := recovery_log || 'Starting emergency auth recovery...' || E'\n';

  -- Ensure RLS is enabled on user_profiles
  BEGIN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    recovery_log := recovery_log || 'RLS enabled on user_profiles' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      recovery_log := recovery_log || 'Failed to enable RLS: ' || SQLERRM || E'\n';
  END;

  -- Recreate basic "users can view own profile" policy if missing
  BEGIN
    DROP POLICY IF EXISTS "Emergency: Users can view own profile" ON user_profiles;
    CREATE POLICY "Emergency: Users can view own profile" ON user_profiles
      FOR SELECT
      USING (auth.uid() = id);
    recovery_log := recovery_log || 'Emergency view policy created' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      recovery_log := recovery_log || 'Failed to create emergency view policy: ' || SQLERRM || E'\n';
  END;

  -- Recreate basic "users can update own profile" policy if missing
  BEGIN
    DROP POLICY IF EXISTS "Emergency: Users can update own profile" ON user_profiles;
    CREATE POLICY "Emergency: Users can update own profile" ON user_profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    recovery_log := recovery_log || 'Emergency update policy created' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      recovery_log := recovery_log || 'Failed to create emergency update policy: ' || SQLERRM || E'\n';
  END;

  -- Ensure service role has full access
  BEGIN
    DROP POLICY IF EXISTS "Emergency: Service role access" ON user_profiles;
    CREATE POLICY "Emergency: Service role access" ON user_profiles
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
    recovery_log := recovery_log || 'Emergency service role policy created' || E'\n';
  EXCEPTION
    WHEN OTHERS THEN
      recovery_log := recovery_log || 'Failed to create emergency service policy: ' || SQLERRM || E'\n';
  END;

  recovery_log := recovery_log || 'Emergency auth recovery completed';
  
  RETURN recovery_log;
END;
$$;

-- Create a function to backup critical auth configuration
CREATE OR REPLACE FUNCTION backup_auth_config()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_backup JSON;
  policies JSON;
  functions JSON;
BEGIN
  -- Backup RLS policies
  SELECT json_agg(
    json_build_object(
      'policyname', policyname,
      'permissive', permissive,
      'roles', roles,
      'cmd', cmd,
      'qual', qual,
      'with_check', with_check
    )
  ) INTO policies
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'user_profiles';

  -- Backup function definitions (simplified)
  SELECT json_agg(
    json_build_object(
      'function_name', proname,
      'return_type', pg_get_function_result(oid),
      'arguments', pg_get_function_arguments(oid),
      'language', (SELECT lanname FROM pg_language WHERE oid = prolang)
    )
  ) INTO functions
  FROM pg_proc 
  WHERE proname IN ('get_user_role_safe', 'create_development_user', 'emergency_auth_recovery', 'check_auth_system_integrity');

  config_backup := json_build_object(
    'backup_timestamp', NOW(),
    'table_exists', EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ),
    'rls_enabled', (
      SELECT row_security 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'user_profiles'
    ),
    'policies', policies,
    'functions', functions
  );

  RETURN config_backup;
END;
$$;

-- Create validation function for migrations
CREATE OR REPLACE FUNCTION validate_auth_after_migration()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  integrity_check JSON;
  is_healthy BOOLEAN;
BEGIN
  -- Run integrity check
  SELECT check_auth_system_integrity() INTO integrity_check;
  
  -- Extract healthy status
  SELECT (integrity_check->>'healthy')::BOOLEAN INTO is_healthy;
  
  IF NOT is_healthy THEN
    RAISE WARNING 'Auth system validation failed after migration: %', integrity_check->>'errors';
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions appropriately
GRANT EXECUTE ON FUNCTION check_auth_system_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_auth_recovery() TO service_role;
GRANT EXECUTE ON FUNCTION backup_auth_config() TO service_role;
GRANT EXECUTE ON FUNCTION validate_auth_after_migration() TO service_role;

-- Create a table to track auth system status
CREATE TABLE IF NOT EXISTS auth_system_status (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_healthy BOOLEAN NOT NULL,
  integrity_report JSON,
  notes TEXT,
  created_by TEXT DEFAULT current_user
);

-- Enable RLS on the status table
ALTER TABLE auth_system_status ENABLE ROW LEVEL SECURITY;

-- Only service role and authenticated users can read status
CREATE POLICY "Authenticated users can view auth status" ON auth_system_status
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert status records
CREATE POLICY "Service role can manage auth status" ON auth_system_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to log auth system status
CREATE OR REPLACE FUNCTION log_auth_system_status()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  integrity_report JSON;
  is_healthy BOOLEAN;
  status_id UUID;
BEGIN
  -- Check integrity
  SELECT check_auth_system_integrity() INTO integrity_report;
  SELECT (integrity_report->>'healthy')::BOOLEAN INTO is_healthy;
  
  -- Insert status record
  INSERT INTO auth_system_status (is_healthy, integrity_report, notes)
  VALUES (is_healthy, integrity_report, 'Automated status check')
  RETURNING gen_random_uuid() INTO status_id;
  
  RETURN status_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_auth_system_status() TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION check_auth_system_integrity() IS 'Validates the integrity of the auth system, checking tables, policies, functions, and triggers';
COMMENT ON FUNCTION emergency_auth_recovery() IS 'Emergency function to restore basic auth functionality if system is broken';
COMMENT ON FUNCTION backup_auth_config() IS 'Creates a backup of critical auth configuration for disaster recovery';
COMMENT ON FUNCTION validate_auth_after_migration() IS 'Validates auth system integrity after migrations - should be called by migration scripts';
COMMENT ON TABLE auth_system_status IS 'Tracks the health status of the auth system over time';

-- Run initial integrity check and log it
SELECT log_auth_system_status();