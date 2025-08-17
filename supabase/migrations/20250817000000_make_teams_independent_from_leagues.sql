-- Migration: Make teams independent from leagues
-- Purpose: Teams should persist when their league is deleted, preserving player stats
-- Date: 2025-08-17

-- Step 1: Drop existing foreign key constraint on teams.league_id
ALTER TABLE teams 
DROP CONSTRAINT IF EXISTS teams_league_id_fkey;

-- Step 2: Add new foreign key constraint with SET NULL instead of CASCADE
-- This means when a league is deleted, the team's league_id will be set to NULL
ALTER TABLE teams 
ADD CONSTRAINT teams_league_id_fkey 
FOREIGN KEY (league_id) 
REFERENCES leagues(id) 
ON DELETE SET NULL;

-- Step 3: Make league_id nullable (if it isn't already)
ALTER TABLE teams 
ALTER COLUMN league_id DROP NOT NULL;

-- Step 4: Fix team_stats table - should also handle league deletion gracefully
ALTER TABLE team_stats 
DROP CONSTRAINT IF EXISTS team_stats_league_id_fkey;

ALTER TABLE team_stats 
ADD CONSTRAINT team_stats_league_id_fkey 
FOREIGN KEY (league_id) 
REFERENCES leagues(id) 
ON DELETE SET NULL;

ALTER TABLE team_stats 
ALTER COLUMN league_id DROP NOT NULL;

-- Step 5: Fix matches table - matches should be deleted when league is deleted
-- (matches don't make sense without a league context)
-- Keep CASCADE for matches as they are league-specific events

-- Step 6: Add an archived flag to teams for better management
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Step 7: Add a previous_league_name column to preserve league context
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS previous_league_name VARCHAR(255);

-- Step 8: Create a trigger to capture league name before it's deleted
CREATE OR REPLACE FUNCTION capture_league_name_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all teams in this league to capture the league name
    UPDATE teams 
    SET previous_league_name = (
        SELECT name FROM leagues WHERE id = OLD.league_id
    )
    WHERE league_id = OLD.league_id 
    AND previous_league_name IS NULL;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before league deletion
DROP TRIGGER IF EXISTS before_league_delete_capture_name ON teams;
CREATE TRIGGER before_league_delete_capture_name
    BEFORE UPDATE OF league_id ON teams
    FOR EACH ROW
    WHEN (NEW.league_id IS NULL AND OLD.league_id IS NOT NULL)
    EXECUTE FUNCTION capture_league_name_before_delete();

-- Step 9: Create an index for orphaned teams (teams without a league)
CREATE INDEX IF NOT EXISTS idx_teams_orphaned 
ON teams(league_id) 
WHERE league_id IS NULL;

-- Step 10: Create a view for orphaned teams for easier management
CREATE OR REPLACE VIEW orphaned_teams AS
SELECT 
    t.*,
    t.previous_league_name as last_known_league,
    COUNT(DISTINCT tm.user_id) as active_members,
    COUNT(DISTINCT ps.id) as total_stats_records
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
LEFT JOIN player_stats ps ON t.id = ps.team_id
WHERE t.league_id IS NULL
GROUP BY t.id, t.name, t.captain_id, t.location, t.founded_year, 
         t.max_players, t.min_players, t.team_color, t.team_bio, 
         t.is_recruiting, t.is_archived, t.previous_league_name,
         t.created_at, t.updated_at, t.league_id;

-- Add a comment explaining the new behavior
COMMENT ON COLUMN teams.league_id IS 'Reference to the league. Can be NULL if league was deleted. Teams persist independently.';
COMMENT ON COLUMN teams.previous_league_name IS 'Stores the name of the last league this team belonged to, preserved when league is deleted.';
COMMENT ON COLUMN teams.is_archived IS 'Indicates if the team is archived (e.g., inactive or from a deleted league).';

-- Step 11: Create a function to reassign orphaned teams to a new league
CREATE OR REPLACE FUNCTION reassign_team_to_league(
    p_team_id UUID,
    p_new_league_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_team_exists BOOLEAN;
    v_league_exists BOOLEAN;
BEGIN
    -- Check if team exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE id = p_team_id) INTO v_team_exists;
    
    -- Check if league exists and is active
    SELECT EXISTS(SELECT 1 FROM leagues WHERE id = p_new_league_id AND is_active = true) INTO v_league_exists;
    
    IF NOT v_team_exists THEN
        RAISE EXCEPTION 'Team with ID % does not exist', p_team_id;
    END IF;
    
    IF NOT v_league_exists THEN
        RAISE EXCEPTION 'League with ID % does not exist or is not active', p_new_league_id;
    END IF;
    
    -- Update the team's league
    UPDATE teams 
    SET 
        league_id = p_new_league_id,
        previous_league_name = NULL,
        is_archived = false,
        updated_at = NOW()
    WHERE id = p_team_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reassign_team_to_league IS 'Reassigns an orphaned team to a new league';