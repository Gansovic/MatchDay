-- Add advanced scheduling configuration to seasons table
-- This enables venue capacity, day-of-week scheduling, and time slot management

-- Add scheduling configuration columns to seasons
ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS available_match_days TEXT[] DEFAULT ARRAY['saturday', 'sunday'],
ADD COLUMN IF NOT EXISTS matches_per_matchday INTEGER DEFAULT 2 CHECK (matches_per_matchday > 0),
ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '[
  {"id": "slot1", "time": "10:00:00", "label": "Morning"},
  {"id": "slot2", "time": "14:00:00", "label": "Afternoon"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS venue_count INTEGER DEFAULT 1 CHECK (venue_count > 0),
ADD COLUMN IF NOT EXISTS rest_days_between_matches INTEGER DEFAULT 3 CHECK (rest_days_between_matches >= 0);

-- Add scheduling details to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_time TIME,
ADD COLUMN IF NOT EXISTS time_slot_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS matchday_number INTEGER;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(season_id, matchday_number);
CREATE INDEX IF NOT EXISTS idx_matches_time ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_time_slot ON matches(time_slot_id);

-- Add helpful comments
COMMENT ON COLUMN seasons.available_match_days IS 'Days of week when matches can be scheduled (e.g., ["saturday", "sunday"])';
COMMENT ON COLUMN seasons.matches_per_matchday IS 'Maximum concurrent matches per matchday (based on venue capacity)';
COMMENT ON COLUMN seasons.time_slots IS 'Available time slots for matches [{id, time, label}]';
COMMENT ON COLUMN seasons.venue_count IS 'Number of available courts/pitches/venues';
COMMENT ON COLUMN seasons.rest_days_between_matches IS 'Minimum rest days required between team matches';
COMMENT ON COLUMN matches.matchday_number IS 'Sequential matchday number (e.g., matchday 1, 2, 3)';
COMMENT ON COLUMN matches.time_slot_id IS 'Reference to time slot configuration in season.time_slots';
COMMENT ON COLUMN matches.match_time IS 'Specific time of day for the match (extracted from match_date)';

-- Update existing seasons with default values
UPDATE seasons
SET
  available_match_days = ARRAY['saturday', 'sunday'],
  matches_per_matchday = 2,
  time_slots = '[
    {"id": "slot1", "time": "10:00:00", "label": "Morning"},
    {"id": "slot2", "time": "14:00:00", "label": "Afternoon"}
  ]'::jsonb,
  venue_count = 1,
  rest_days_between_matches = 3
WHERE
  available_match_days IS NULL
  OR matches_per_matchday IS NULL
  OR time_slots IS NULL
  OR venue_count IS NULL
  OR rest_days_between_matches IS NULL;
