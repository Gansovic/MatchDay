-- Admin System Migration
-- Adds admin functionality to existing MatchDay database

-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('player', 'captain', 'admin', 'league_admin', 'app_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to existing users table or create users table if it doesn't exist
DO $$ BEGIN
    -- Check if users table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            display_name TEXT,
            avatar_url TEXT,
            role user_role DEFAULT 'player',
            preferred_position TEXT,
            bio TEXT,
            date_of_birth DATE,
            location TEXT,
            phone TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add role column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            ALTER TABLE users ADD COLUMN role user_role DEFAULT 'player';
        END IF;
        
        -- Add other missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
            ALTER TABLE users ADD COLUMN full_name TEXT;
        END IF;
    END IF;
END $$;

-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    target_roles user_role[] DEFAULT ARRAY['app_admin'],
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES auth.users(id)
);

-- Create admin sessions table for enhanced security
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_target_roles ON system_notifications USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_system_notifications_unread ON system_notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active ON admin_sessions(admin_user_id, is_active, expires_at);

-- Enable RLS on admin tables
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin tables
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'league_admin', 'app_admin'))
);

CREATE POLICY "App admins can view all notifications" ON system_notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'app_admin')
);

CREATE POLICY "League admins can view their notifications" ON system_notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('league_admin', 'app_admin'))
    AND 'league_admin' = ANY(target_roles)
);

CREATE POLICY "Admins can manage their sessions" ON admin_sessions FOR ALL USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'league_admin', 'app_admin'))
);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_audit_logs (
        admin_user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        inet_client_addr()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user profiles triggers for admin tracking
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE admin_audit_logs TO authenticated;
GRANT ALL ON TABLE system_notifications TO authenticated;
GRANT ALL ON TABLE admin_sessions TO authenticated;