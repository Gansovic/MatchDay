-- Simplify scheduling for amateur leagues
-- Amateur leagues play ONE day per week at ONE time with multiple courts
-- Example: Thursday 19:00-21:00 with 4 courts = 8 games per matchday

-- Drop old complex columns from seasons table
ALTER TABLE seasons
DROP COLUMN IF EXISTS available_match_days,
DROP COLUMN IF EXISTS matches_per_matchday,
DROP COLUMN IF EXISTS time_slots,
DROP COLUMN IF EXISTS venue_count,
DROP COLUMN IF EXISTS rest_days_between_matches;

-- Add simplified amateur league scheduling columns
ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS match_day VARCHAR(20) DEFAULT 'saturday' CHECK (match_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
ADD COLUMN IF NOT EXISTS match_start_time TIME DEFAULT '19:00:00',
ADD COLUMN IF NOT EXISTS match_end_time TIME DEFAULT '21:00:00',
ADD COLUMN IF NOT EXISTS courts_available INTEGER DEFAULT 1 CHECK (courts_available > 0),
ADD COLUMN IF NOT EXISTS games_per_court INTEGER DEFAULT 2 CHECK (games_per_court > 0),
ADD COLUMN IF NOT EXISTS rest_weeks_between_matches INTEGER DEFAULT 0 CHECK (rest_weeks_between_matches >= 0);

-- Add court assignment and matchday tracking to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS court_number INTEGER,
ADD COLUMN IF NOT EXISTS matchday_number INTEGER,
ADD COLUMN IF NOT EXISTS match_time TIME,
DROP COLUMN IF EXISTS time_slot_id;

-- Update indexes
DROP INDEX IF EXISTS idx_matches_time_slot;
CREATE INDEX IF NOT EXISTS idx_matches_court ON matches(season_id, court_number);

-- Add helpful comments
COMMENT ON COLUMN seasons.match_day IS 'Day of week when matches are played (e.g., "thursday")';
COMMENT ON COLUMN seasons.match_start_time IS 'Start time of match window (e.g., 19:00:00)';
COMMENT ON COLUMN seasons.match_end_time IS 'End time of match window (e.g., 21:00:00)';
COMMENT ON COLUMN seasons.courts_available IS 'Number of courts/pitches available simultaneously';
COMMENT ON COLUMN seasons.games_per_court IS 'Number of games that can be played per court during the match window';
COMMENT ON COLUMN seasons.rest_weeks_between_matches IS 'Minimum weeks a team must rest between matches (0 = can play every week)';
COMMENT ON COLUMN matches.court_number IS 'Court/pitch number for this match (1, 2, 3, etc.)';
COMMENT ON COLUMN matches.matchday_number IS 'Sequential matchday number (e.g., Week 1, Week 2, Week 3)';
COMMENT ON COLUMN matches.match_time IS 'Time of the match (all matches in a matchday have the same time)';

-- Update existing seasons with sensible defaults
UPDATE seasons
SET
  match_day = 'saturday',
  match_start_time = '19:00:00',
  match_end_time = '21:00:00',
  courts_available = 1,
  games_per_court = 2,
  rest_weeks_between_matches = 0
WHERE
  match_day IS NULL
  OR match_start_time IS NULL
  OR match_end_time IS NULL
  OR courts_available IS NULL
  OR games_per_court IS NULL
  OR rest_weeks_between_matches IS NULL;
