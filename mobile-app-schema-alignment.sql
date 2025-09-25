-- Mobile App Schema Alignment Script
-- Run this in your Supabase SQL Editor to align database schema with mobile app expectations
-- This adds missing columns that the mobile app needs

-- Step 1: Add sport_type and league_type to leagues table
ALTER TABLE leagues
ADD COLUMN IF NOT EXISTS sport_type VARCHAR(50) DEFAULT 'football',
ADD COLUMN IF NOT EXISTS league_type VARCHAR(50) DEFAULT 'casual';

-- Step 2: Add team_color and max_players to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS team_color VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15;

-- Step 3: Update existing records with default values
UPDATE leagues
SET sport_type = COALESCE(sport_type, 'football'),
    league_type = COALESCE(league_type, 'casual')
WHERE sport_type IS NULL OR league_type IS NULL;

UPDATE teams
SET team_color = COALESCE(team_color, '#2563eb'),
    max_players = COALESCE(max_players, 15)
WHERE team_color IS NULL OR max_players IS NULL;

-- Step 4: Make columns NOT NULL after setting defaults
ALTER TABLE leagues
ALTER COLUMN sport_type SET NOT NULL,
ALTER COLUMN league_type SET NOT NULL;

ALTER TABLE teams
ALTER COLUMN team_color SET NOT NULL,
ALTER COLUMN max_players SET NOT NULL;

-- Step 5: Add useful indexes
CREATE INDEX IF NOT EXISTS idx_leagues_sport_type ON leagues(sport_type);
CREATE INDEX IF NOT EXISTS idx_leagues_league_type ON leagues(league_type);
CREATE INDEX IF NOT EXISTS idx_leagues_active ON leagues(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- Step 6: Verify the changes
SELECT 'Leagues with sport_type/league_type:' as status, COUNT(*) as count
FROM leagues
WHERE sport_type IS NOT NULL AND league_type IS NOT NULL

UNION ALL

SELECT 'Teams with team_color/max_players:' as status, COUNT(*) as count
FROM teams
WHERE team_color IS NOT NULL AND max_players IS NOT NULL

UNION ALL

SELECT 'Active leagues:' as status, COUNT(*) as count
FROM leagues
WHERE is_active = true

UNION ALL

SELECT 'Active teams:' as status, COUNT(*) as count
FROM teams
WHERE is_active = true;