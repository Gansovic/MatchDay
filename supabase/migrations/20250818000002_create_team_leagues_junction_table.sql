-- Create team_leagues junction table for many-to-many relationship between teams and leagues
-- This table enables teams to join multiple leagues simultaneously

-- Create the team_leagues junction table
CREATE TABLE team_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_team_league UNIQUE(team_id, league_id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_team_leagues_team_id ON team_leagues(team_id);
CREATE INDEX idx_team_leagues_league_id ON team_leagues(league_id);
CREATE INDEX idx_team_leagues_is_active ON team_leagues(is_active);
CREATE INDEX idx_team_leagues_joined_at ON team_leagues(joined_at);
CREATE INDEX idx_team_leagues_composite ON team_leagues(team_id, league_id, is_active);

-- Create a composite index for common queries (active memberships)
CREATE INDEX idx_team_leagues_active_memberships ON team_leagues(team_id, is_active) WHERE is_active = true;
CREATE INDEX idx_league_teams_active_memberships ON team_leagues(league_id, is_active) WHERE is_active = true;

-- Row Level Security (RLS)
ALTER TABLE team_leagues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view team-league relationships for teams they are members of
CREATE POLICY "Users can view their team's league memberships" ON team_leagues
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_leagues.team_id 
            AND team_members.user_id = auth.uid()
            AND team_members.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_leagues.team_id 
            AND teams.captain_id = auth.uid()
        )
    );

-- Policy: League admins can view team memberships in their leagues
CREATE POLICY "League admins can view team memberships in their leagues" ON team_leagues
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_leagues.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Policy: Team captains can manage their team's league memberships (insert/update)
CREATE POLICY "Team captains can manage league memberships" ON team_leagues
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_leagues.team_id 
            AND teams.captain_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_leagues.team_id 
            AND teams.captain_id = auth.uid()
        )
    );

-- Policy: League admins can manage team memberships in their leagues
CREATE POLICY "League admins can manage team memberships" ON team_leagues
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_leagues.league_id 
            AND leagues.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_leagues.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_leagues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_team_leagues_updated_at
    BEFORE UPDATE ON team_leagues
    FOR EACH ROW
    EXECUTE FUNCTION update_team_leagues_updated_at();

-- Function to handle team league membership validation
CREATE OR REPLACE FUNCTION validate_team_league_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if league is active and public
    IF NOT EXISTS (
        SELECT 1 FROM leagues 
        WHERE id = NEW.league_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Cannot join inactive league';
    END IF;
    
    -- Check if team exists and is not archived
    IF NOT EXISTS (
        SELECT 1 FROM teams 
        WHERE id = NEW.team_id 
        AND COALESCE(is_archived, false) = false
    ) THEN
        RAISE EXCEPTION 'Cannot add archived team to league';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate team league memberships
CREATE TRIGGER trigger_validate_team_league_membership
    BEFORE INSERT OR UPDATE ON team_leagues
    FOR EACH ROW
    EXECUTE FUNCTION validate_team_league_membership();

-- View to get team leagues with league details
CREATE VIEW team_leagues_with_details AS
SELECT 
    tl.id,
    tl.team_id,
    tl.league_id,
    tl.joined_at,
    tl.is_active,
    tl.created_at,
    tl.updated_at,
    t.name as team_name,
    t.team_color,
    NULL as team_logo_url,
    l.name as league_name,
    l.description as league_description,
    l.sport_type,
    l.league_type,
    l.location as league_location,
    l.season_start,
    l.season_end,
    l.is_public as league_is_public
FROM team_leagues tl
JOIN teams t ON tl.team_id = t.id
JOIN leagues l ON tl.league_id = l.id;

-- Function to get teams in a league
CREATE OR REPLACE FUNCTION get_league_teams(league_uuid UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR(255),
    team_color VARCHAR(7),
    team_logo_url TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.team_color,
        NULL as logo_url,
        tl.joined_at,
        tl.is_active,
        COUNT(tm.id) as member_count
    FROM team_leagues tl
    JOIN teams t ON tl.team_id = t.id
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
    WHERE tl.league_id = league_uuid 
    AND tl.is_active = true
    GROUP BY t.id, t.name, t.team_color, t.logo_url, tl.joined_at, tl.is_active
    ORDER BY tl.joined_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get leagues for a team
CREATE OR REPLACE FUNCTION get_team_leagues(team_uuid UUID)
RETURNS TABLE (
    league_id UUID,
    league_name VARCHAR(255),
    league_description TEXT,
    sport_type VARCHAR(50),
    league_type VARCHAR(50),
    location VARCHAR(255),
    season_start DATE,
    season_end DATE,
    joined_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.description,
        l.sport_type,
        l.league_type,
        l.location,
        l.season_start,
        l.season_end,
        tl.joined_at,
        tl.is_active
    FROM team_leagues tl
    JOIN leagues l ON tl.league_id = l.id
    WHERE tl.team_id = team_uuid 
    AND tl.is_active = true
    AND l.is_active = true
    ORDER BY tl.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE team_leagues IS 'Junction table enabling many-to-many relationship between teams and leagues. Teams can now participate in multiple leagues simultaneously.';
COMMENT ON COLUMN team_leagues.team_id IS 'Reference to the team';
COMMENT ON COLUMN team_leagues.league_id IS 'Reference to the league';
COMMENT ON COLUMN team_leagues.joined_at IS 'When the team joined this league';
COMMENT ON COLUMN team_leagues.is_active IS 'Whether the team is currently active in this league';