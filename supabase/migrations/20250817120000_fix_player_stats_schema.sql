-- Migration: Fix player_stats table schema
-- Purpose: Add missing league_id foreign key and update table structure to match expected schema
-- Date: 2025-08-17

-- Step 1: Add missing columns to player_stats table
ALTER TABLE player_stats 
ADD COLUMN IF NOT EXISTS league_id UUID,
ADD COLUMN IF NOT EXISTS season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_started INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shots_on_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passes_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passes_attempted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tackles_won INTEGER DEFAULT 0;

-- Step 2: Rename user_id to player_id for consistency
ALTER TABLE player_stats 
RENAME COLUMN user_id TO player_id;

-- Step 3: Update existing records to populate league_id from team relationships
UPDATE player_stats 
SET league_id = teams.league_id 
FROM teams 
WHERE player_stats.team_id = teams.id 
AND player_stats.league_id IS NULL;

-- Step 4: Add foreign key constraint for league_id
ALTER TABLE player_stats 
ADD CONSTRAINT fk_player_stats_league_id 
FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;

-- Step 5: Make league_id NOT NULL now that all records are populated
ALTER TABLE player_stats 
ALTER COLUMN league_id SET NOT NULL;

-- Step 6: Remove match_id foreign key as this should be aggregated stats, not per-match
ALTER TABLE player_stats 
DROP COLUMN IF EXISTS match_id;

-- Step 7: Add proper constraints
ALTER TABLE player_stats 
ADD CONSTRAINT chk_games_played CHECK (games_played >= 0),
ADD CONSTRAINT chk_games_started CHECK (games_started >= 0 AND games_started <= games_played),
ADD CONSTRAINT chk_goals CHECK (goals >= 0),
ADD CONSTRAINT chk_assists CHECK (assists >= 0),
ADD CONSTRAINT chk_yellow_cards CHECK (yellow_cards >= 0),
ADD CONSTRAINT chk_red_cards CHECK (red_cards >= 0),
ADD CONSTRAINT chk_minutes_played CHECK (minutes_played >= 0);

-- Step 8: Create unique constraint for player per league per team per season
ALTER TABLE player_stats 
ADD CONSTRAINT uq_player_league_team_season 
UNIQUE (player_id, league_id, team_id, season_year);

-- Step 9: Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_player_season ON player_stats(player_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_league_season ON player_stats(league_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_season ON player_stats(team_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_performance ON player_stats(league_id, goals DESC, assists DESC);

-- Step 10: Add table comment
COMMENT ON TABLE player_stats IS 'Player statistics aggregated by league, team, and season';
COMMENT ON COLUMN player_stats.league_id IS 'Foreign key to leagues table';
COMMENT ON COLUMN player_stats.season_year IS 'Year of the season these stats belong to';