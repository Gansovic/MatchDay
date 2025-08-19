-- Add tournament format support to leagues and matches tables

-- Create tournament format enum
CREATE TYPE tournament_format AS ENUM ('league', 'knockout', 'league_with_playoffs');

-- Create match type enum  
CREATE TYPE match_type AS ENUM ('regular_season', 'playoff', 'final', 'semifinal', 'quarterfinal');

-- Add tournament configuration fields to leagues table
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS tournament_format tournament_format NOT NULL DEFAULT 'league',
ADD COLUMN IF NOT EXISTS match_frequency INTEGER DEFAULT 7, -- Days between matches
ADD COLUMN IF NOT EXISTS playoff_teams_count INTEGER DEFAULT 4, -- Number of teams advancing to playoffs
ADD COLUMN IF NOT EXISTS tournament_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fixtures_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fixtures_generated_at TIMESTAMP WITH TIME ZONE;

-- Add match classification fields to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type match_type DEFAULT 'regular_season',
ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1, -- For knockout stages
ADD COLUMN IF NOT EXISTS match_day INTEGER; -- For league fixtures (1, 2, 3, etc.)

-- Update scheduled_date column name for consistency (if needed)
-- The database.types.ts shows it as scheduled_date, but migration shows match_date
-- Let's add the scheduled_date column for consistency
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

-- Copy data from match_date to scheduled_date if match_date exists
UPDATE matches 
SET scheduled_date = match_date 
WHERE scheduled_date IS NULL AND match_date IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leagues_tournament_format ON leagues(tournament_format);
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_matches_round_number ON matches(round_number);
CREATE INDEX IF NOT EXISTS idx_matches_match_day ON matches(match_day);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_date ON matches(scheduled_date);

-- Comments for documentation
COMMENT ON COLUMN leagues.tournament_format IS 'Type of tournament: league (round-robin), knockout (elimination), or league_with_playoffs (hybrid)';
COMMENT ON COLUMN leagues.match_frequency IS 'Days between matches for scheduling (default 7 for weekly)';
COMMENT ON COLUMN leagues.playoff_teams_count IS 'Number of top teams that advance to playoffs (for league_with_playoffs format)';
COMMENT ON COLUMN leagues.tournament_start_date IS 'When the tournament fixtures should start (overrides season_start for scheduling)';
COMMENT ON COLUMN leagues.fixtures_generated IS 'Whether fixtures have been automatically generated for this league';
COMMENT ON COLUMN matches.match_type IS 'Classification of match within tournament structure';
COMMENT ON COLUMN matches.round_number IS 'Round number for knockout stages (1=first round, 2=quarterfinals, etc.)';
COMMENT ON COLUMN matches.match_day IS 'Match day number for league fixtures (1, 2, 3, etc.)';