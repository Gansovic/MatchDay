-- Create the missing league_admins table that the schema is expecting
-- This should resolve the "Could not find a relationship between 'leagues' and 'league_admins'" error

CREATE TABLE IF NOT EXISTS league_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'owner', 'moderator')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE league_admins IS 'Stores league administrators and their roles';
COMMENT ON COLUMN league_admins.league_id IS 'References the league being administered';
COMMENT ON COLUMN league_admins.user_id IS 'References the user who is an admin';
COMMENT ON COLUMN league_admins.role IS 'Admin role level (admin, owner, moderator)';
COMMENT ON COLUMN league_admins.granted_by IS 'User who granted this admin role';

-- Enable Row Level Security
ALTER TABLE league_admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY league_admins_select_own ON league_admins
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = granted_by OR
        EXISTS (
            SELECT 1 FROM league_admins la 
            WHERE la.league_id = league_admins.league_id 
            AND la.user_id = auth.uid()
            AND la.role IN ('admin', 'owner')
        )
    );

CREATE POLICY league_admins_insert ON league_admins
    FOR INSERT WITH CHECK (
        auth.uid() = granted_by OR
        EXISTS (
            SELECT 1 FROM leagues l 
            WHERE l.id = league_admins.league_id 
            AND l.created_by = auth.uid()
        )
    );

CREATE POLICY league_admins_update ON league_admins
    FOR UPDATE USING (
        auth.uid() = granted_by OR
        EXISTS (
            SELECT 1 FROM league_admins la 
            WHERE la.league_id = league_admins.league_id 
            AND la.user_id = auth.uid()
            AND la.role = 'owner'
        )
    );

CREATE POLICY league_admins_delete ON league_admins
    FOR DELETE USING (
        auth.uid() = granted_by OR
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM league_admins la 
            WHERE la.league_id = league_admins.league_id 
            AND la.user_id = auth.uid()
            AND la.role = 'owner'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_admins_league_id ON league_admins(league_id);
CREATE INDEX IF NOT EXISTS idx_league_admins_user_id ON league_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_league_admins_role ON league_admins(role);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_league_admins_updated_at 
    BEFORE UPDATE ON league_admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the league creator as an owner for existing leagues
INSERT INTO league_admins (league_id, user_id, role, granted_by, granted_at)
SELECT 
    id as league_id,
    created_by as user_id,
    'owner' as role,
    created_by as granted_by,
    created_at as granted_at
FROM leagues 
WHERE created_by IS NOT NULL
ON CONFLICT (league_id, user_id) DO NOTHING;