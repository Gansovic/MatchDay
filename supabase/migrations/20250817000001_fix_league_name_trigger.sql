-- Fix the trigger for capturing league name before deletion
-- The previous trigger had an issue with BEFORE UPDATE

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS before_league_delete_capture_name ON teams;
DROP FUNCTION IF EXISTS capture_league_name_before_delete();

-- Create a simpler approach: capture league name when league_id becomes NULL
CREATE OR REPLACE FUNCTION capture_league_name_on_null()
RETURNS TRIGGER AS $$
BEGIN
    -- If league_id is being set to NULL and it was not NULL before
    IF NEW.league_id IS NULL AND OLD.league_id IS NOT NULL THEN
        -- Get the league name from the leagues table
        SELECT name INTO NEW.previous_league_name
        FROM leagues
        WHERE id = OLD.league_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger as BEFORE UPDATE
CREATE TRIGGER capture_league_name_on_null_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    WHEN (NEW.league_id IS NULL AND OLD.league_id IS NOT NULL)
    EXECUTE FUNCTION capture_league_name_on_null();

COMMENT ON FUNCTION capture_league_name_on_null IS 'Captures the league name when a team becomes orphaned';