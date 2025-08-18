-- Migrate existing team-league relationships to the new junction table
-- This migration will populate team_leagues with data from teams.league_id

-- First, insert existing team-league relationships into the junction table
INSERT INTO team_leagues (team_id, league_id, joined_at, is_active, created_at, updated_at)
SELECT 
    t.id as team_id,
    t.league_id,
    COALESCE(t.created_at, NOW()) as joined_at,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM teams t
WHERE t.league_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates in case this migration runs multiple times
    SELECT 1 FROM team_leagues tl 
    WHERE tl.team_id = t.id AND tl.league_id = t.league_id
  );

-- Also populate with approved team league requests that aren't reflected in teams.league_id
-- This catches cases where a team was approved for multiple leagues but teams.league_id only shows the last one
INSERT INTO team_leagues (team_id, league_id, joined_at, is_active, created_at, updated_at)
SELECT DISTINCT
    tlr.team_id,
    tlr.league_id,
    COALESCE(tlr.reviewed_at, tlr.created_at) as joined_at,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM team_league_requests tlr
WHERE tlr.status = 'approved'
  AND NOT EXISTS (
    -- Avoid duplicates with data already inserted from teams table
    SELECT 1 FROM team_leagues tl 
    WHERE tl.team_id = tlr.team_id AND tl.league_id = tlr.league_id
  );

-- Update the team_league_requests table trigger to use the junction table
-- Replace the existing trigger function with one that manages the junction table
CREATE OR REPLACE FUNCTION handle_team_league_request_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If request is being approved, add entry to team_leagues junction table
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Insert into junction table if not already exists
        INSERT INTO team_leagues (team_id, league_id, joined_at, is_active, created_at, updated_at)
        VALUES (NEW.team_id, NEW.league_id, NOW(), true, NOW(), NOW())
        ON CONFLICT (team_id, league_id) 
        DO UPDATE SET 
            is_active = true,
            joined_at = CASE 
                WHEN team_leagues.is_active = false THEN NOW() 
                ELSE team_leagues.joined_at 
            END,
            updated_at = NOW();
        
        -- Set reviewed_at timestamp
        NEW.reviewed_at = NOW();
        
        -- Keep teams.league_id for backward compatibility (set to the most recent league)
        -- This will be deprecated in a future migration
        UPDATE teams 
        SET league_id = NEW.league_id,
            updated_at = NOW()
        WHERE id = NEW.team_id;
    END IF;
    
    -- If request is being rejected or withdrawn, ensure team is removed from the league
    IF NEW.status IN ('rejected', 'withdrawn') AND OLD.status = 'approved' THEN
        -- Deactivate the team-league relationship in junction table
        UPDATE team_leagues 
        SET is_active = false, updated_at = NOW()
        WHERE team_id = NEW.team_id AND league_id = NEW.league_id;
        
        -- Update teams.league_id to NULL only if this was the current league
        UPDATE teams 
        SET league_id = CASE 
            WHEN league_id = NEW.league_id THEN NULL 
            ELSE league_id 
        END,
        updated_at = NOW()
        WHERE id = NEW.team_id;
        
        -- Set reviewed_at timestamp for rejections
        IF NEW.status = 'rejected' THEN
            NEW.reviewed_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the primary league for backward compatibility
-- This helps maintain the teams.league_id field for existing code
CREATE OR REPLACE FUNCTION get_team_primary_league(team_uuid UUID)
RETURNS UUID AS $$
DECLARE
    primary_league_id UUID;
BEGIN
    -- Get the most recently joined active league as primary
    SELECT league_id INTO primary_league_id
    FROM team_leagues 
    WHERE team_id = team_uuid 
      AND is_active = true
    ORDER BY joined_at DESC, created_at DESC
    LIMIT 1;
    
    RETURN primary_league_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to sync teams.league_id with the primary league from junction table
CREATE OR REPLACE FUNCTION sync_team_primary_league()
RETURNS TRIGGER AS $$
DECLARE
    primary_league_id UUID;
BEGIN
    -- Get the primary league for the affected team
    SELECT get_team_primary_league(NEW.team_id) INTO primary_league_id;
    
    -- Update the teams table with the primary league
    UPDATE teams 
    SET league_id = primary_league_id,
        updated_at = NOW()
    WHERE id = NEW.team_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep teams.league_id in sync with primary league
CREATE TRIGGER trigger_sync_team_primary_league
    AFTER INSERT OR UPDATE OR DELETE ON team_leagues
    FOR EACH ROW
    EXECUTE FUNCTION sync_team_primary_league();

-- Create a view for backward compatibility that shows teams with their primary league
CREATE OR REPLACE VIEW teams_with_primary_league AS
SELECT 
    t.*,
    l.id as primary_league_id,
    l.name as primary_league_name,
    l.description as primary_league_description,
    l.sport_type as primary_league_sport_type,
    l.league_type as primary_league_type,
    l.location as primary_league_location
FROM teams t
LEFT JOIN team_leagues tl ON t.id = tl.team_id AND tl.is_active = true
LEFT JOIN leagues l ON tl.league_id = l.id
WHERE tl.joined_at = (
    -- Get the most recent league membership for each team
    SELECT MAX(tl2.joined_at)
    FROM team_leagues tl2
    WHERE tl2.team_id = t.id AND tl2.is_active = true
) OR tl.team_id IS NULL; -- Include teams with no league memberships

-- Update existing teams to have correct league_id based on junction table
UPDATE teams 
SET league_id = get_team_primary_league(teams.id),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT team_id 
    FROM team_leagues 
    WHERE is_active = true
);

-- Create a function to get team league count
CREATE OR REPLACE FUNCTION get_team_league_count(team_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM team_leagues 
        WHERE team_id = team_uuid 
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Add some helpful comments
COMMENT ON FUNCTION get_team_primary_league(UUID) IS 'Returns the primary league ID for a team (most recently joined active league)';
COMMENT ON FUNCTION get_team_league_count(UUID) IS 'Returns the number of active leagues a team is participating in';
COMMENT ON FUNCTION get_league_teams(UUID) IS 'Returns all active teams in a specific league with their details';
COMMENT ON FUNCTION get_team_leagues(UUID) IS 'Returns all active leagues for a specific team';

-- Log migration completion
DO $$
DECLARE
    migrated_count INTEGER;
    total_teams INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM team_leagues;
    SELECT COUNT(*) INTO total_teams FROM teams WHERE league_id IS NOT NULL;
    
    RAISE NOTICE 'Team-league migration completed. Migrated % relationships from % teams with league assignments.', 
        migrated_count, total_teams;
END $$;