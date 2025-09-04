-- Remove redundant columns and clean up legacy schema
-- This migration removes redundant league_id from matches and legacy season columns from leagues

-- Step 1: Remove redundant league_id from matches table
-- The league information is now derived through seasons.league_id
ALTER TABLE matches DROP COLUMN IF EXISTS league_id;

-- Drop any indexes that were on the league_id column
DROP INDEX IF EXISTS idx_matches_league_id;
DROP INDEX IF EXISTS idx_matches_league_season;

-- Step 2: Remove legacy season columns from leagues table  
-- These are no longer needed since we have a proper seasons table
ALTER TABLE leagues DROP COLUMN IF EXISTS season;
ALTER TABLE leagues DROP COLUMN IF EXISTS season_start;
ALTER TABLE leagues DROP COLUMN IF EXISTS season_end;

-- Step 3: Clean up team.league_id references to be nullable
-- Teams are now primarily associated with seasons, league_id becomes optional/nullable
-- This allows teams to exist without a league or move between leagues via seasons
ALTER TABLE teams ALTER COLUMN league_id DROP NOT NULL;

-- Update the foreign key constraint to SET NULL on league deletion (if not already done)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_league_id_fkey;
ALTER TABLE teams ADD CONSTRAINT teams_league_id_fkey 
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL;

-- Step 4: Add helpful comments to document the new architecture
COMMENT ON COLUMN teams.league_id IS 'Optional legacy reference to league. Teams are now primarily associated with seasons via season_teams table';
COMMENT ON TABLE matches IS 'Matches are associated with seasons. League information is derived through seasons.league_id';

-- Step 5: Create view for backward compatibility (optional)
-- This view provides league information for matches through the season relationship
CREATE OR REPLACE VIEW matches_with_league AS
SELECT 
    m.*,
    s.league_id,
    s.name as season_name,
    s.display_name as season_display_name,
    l.name as league_name,
    l.description as league_description
FROM matches m
LEFT JOIN seasons s ON m.season_id = s.id
LEFT JOIN leagues l ON s.league_id = l.id;

COMMENT ON VIEW matches_with_league IS 'Compatibility view that provides league information for matches through season relationships';

-- Step 6: Update any existing data consistency
-- Ensure all matches have valid season references
DO $$
DECLARE
    orphaned_matches INTEGER;
BEGIN
    -- Count matches without valid season references
    SELECT COUNT(*) INTO orphaned_matches
    FROM matches m
    WHERE m.season_id IS NULL;
    
    IF orphaned_matches > 0 THEN
        RAISE WARNING 'Found % matches without season_id. These matches may need manual cleanup.', orphaned_matches;
        
        -- Optionally, you could delete orphaned matches or assign them to a default season
        -- For now, we'll just log them
        RAISE NOTICE 'Orphaned match IDs: %', (
            SELECT string_agg(id::text, ', ') 
            FROM matches 
            WHERE season_id IS NULL 
            LIMIT 10
        );
    ELSE
        RAISE NOTICE 'All matches have valid season references';
    END IF;
END $$;

-- Step 7: Create function to get league from match via season (helper function)
CREATE OR REPLACE FUNCTION get_match_league_id(match_id UUID)
RETURNS UUID AS $$
DECLARE
    league_id UUID;
BEGIN
    SELECT s.league_id INTO league_id
    FROM matches m
    JOIN seasons s ON m.season_id = s.id
    WHERE m.id = match_id;
    
    RETURN league_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_match_league_id IS 'Helper function to get league_id for a match through its season relationship';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed redundant columns and cleaned up legacy schema';
    RAISE NOTICE 'Matches are now purely season-based';
    RAISE NOTICE 'Teams can optionally reference leagues but are primarily season-associated';
    RAISE NOTICE 'Use matches_with_league view for backward compatibility if needed';
END $$;