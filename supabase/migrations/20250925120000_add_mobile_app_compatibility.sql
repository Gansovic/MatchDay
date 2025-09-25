-- Add missing columns to leagues table for mobile app compatibility
-- This migration adds sport_type and league_type columns that the mobile app expects

-- Step 1: Add sport_type and league_type columns to leagues table
ALTER TABLE leagues
ADD COLUMN IF NOT EXISTS sport_type VARCHAR(50) DEFAULT 'football',
ADD COLUMN IF NOT EXISTS league_type VARCHAR(50) DEFAULT 'casual';

-- Step 2: Add missing columns to teams table for better mobile support
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS team_color VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15;

-- Step 3: Update existing leagues with sensible defaults
UPDATE leagues
SET sport_type = 'football', league_type = 'casual'
WHERE sport_type IS NULL OR league_type IS NULL;

-- Step 4: Update existing teams with sensible defaults
UPDATE teams
SET team_color = '#2563eb', max_players = 15
WHERE team_color IS NULL OR max_players IS NULL;

-- Step 5: Make the columns NOT NULL after setting defaults
ALTER TABLE leagues
ALTER COLUMN sport_type SET NOT NULL,
ALTER COLUMN league_type SET NOT NULL;

ALTER TABLE teams
ALTER COLUMN team_color SET NOT NULL,
ALTER COLUMN max_players SET NOT NULL;

-- Step 6: Add useful indexes for mobile app queries
CREATE INDEX IF NOT EXISTS idx_leagues_sport_type ON leagues(sport_type);
CREATE INDEX IF NOT EXISTS idx_leagues_league_type ON leagues(league_type);
CREATE INDEX IF NOT EXISTS idx_leagues_active ON leagues(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN leagues.sport_type IS 'Type of sport: football, basketball, tennis, volleyball, baseball, etc.';
COMMENT ON COLUMN leagues.league_type IS 'Competition level: competitive, casual, friendly, professional';
COMMENT ON COLUMN teams.team_color IS 'Hex color code for team identification in UI';
COMMENT ON COLUMN teams.max_players IS 'Maximum number of players allowed on this team';

-- Step 8: Create a view for mobile app compatibility if needed
CREATE OR REPLACE VIEW leagues_mobile_view AS
SELECT
    id,
    name,
    description,
    sport_type,
    league_type,
    is_active,
    is_public,
    max_teams,
    created_by,
    created_at,
    updated_at,
    -- Calculate team counts
    (SELECT COUNT(*) FROM teams WHERE league_id = leagues.id AND is_active = true) as current_teams_count,
    -- Calculate available spots
    GREATEST(0, max_teams - (SELECT COUNT(*) FROM teams WHERE league_id = leagues.id AND is_active = true)) as available_spots,
    -- Determine if recruiting
    (max_teams - (SELECT COUNT(*) FROM teams WHERE league_id = leagues.id AND is_active = true)) > 0 as is_recruiting
FROM leagues
WHERE is_active = true;

COMMENT ON VIEW leagues_mobile_view IS 'Mobile-optimized view of leagues with calculated team counts and availability';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added mobile app compatibility columns';
    RAISE NOTICE 'Added sport_type and league_type to leagues table';
    RAISE NOTICE 'Added team_color and max_players to teams table';
    RAISE NOTICE 'Created leagues_mobile_view for optimized mobile queries';
    RAISE NOTICE 'Database is now aligned between webapp and mobile app';
END $$;