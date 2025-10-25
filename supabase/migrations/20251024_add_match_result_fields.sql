-- Add match results fields to matches table
-- Add man of the match and starting lineups

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS man_of_match_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS home_lineup JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS away_lineup JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN matches.man_of_match_id IS 'Player who was selected as man of the match';
COMMENT ON COLUMN matches.home_lineup IS 'Starting lineup for home team - array of player IDs with positions';
COMMENT ON COLUMN matches.away_lineup IS 'Starting lineup for away team - array of player IDs with positions';

-- Create index on man_of_match_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_matches_man_of_match ON matches(man_of_match_id);
