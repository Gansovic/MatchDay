-- Add season_id column to matches table
-- This allows matches to be linked to specific seasons within leagues

-- Add the column
ALTER TABLE matches 
ADD COLUMN season_id UUID;

-- Add foreign key constraint
ALTER TABLE matches 
ADD CONSTRAINT matches_season_id_fkey 
FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_matches_season_id ON matches (season_id);

-- Add composite index for efficient league + season queries
CREATE INDEX idx_matches_league_season ON matches (league_id, season_id);

-- Update existing matches to link to current seasons where possible
-- This is a best-effort approach since we don't have historical season data
UPDATE matches 
SET season_id = (
  SELECT s.id 
  FROM seasons s 
  WHERE s.league_id = matches.league_id 
  AND s.is_current = true 
  LIMIT 1
) 
WHERE season_id IS NULL 
AND league_id IS NOT NULL;