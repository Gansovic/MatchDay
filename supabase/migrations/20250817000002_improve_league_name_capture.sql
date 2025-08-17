-- Improve league name capture when league is deleted
-- Use a trigger on the leagues table instead of teams table

-- Drop the existing trigger on teams
DROP TRIGGER IF EXISTS capture_league_name_on_null_trigger ON teams;
DROP FUNCTION IF EXISTS capture_league_name_on_null();

-- Create a function to capture league name before league deletion
CREATE OR REPLACE FUNCTION before_league_delete_capture_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all teams in this league to capture the league name
    UPDATE teams 
    SET previous_league_name = OLD.name
    WHERE league_id = OLD.id 
    AND previous_league_name IS NULL;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on leagues table BEFORE DELETE
DROP TRIGGER IF EXISTS before_league_delete_trigger ON leagues;
CREATE TRIGGER before_league_delete_trigger
    BEFORE DELETE ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION before_league_delete_capture_name();

COMMENT ON FUNCTION before_league_delete_capture_name IS 'Captures the league name in teams before the league is deleted';

-- Also handle the case where league_id is manually set to NULL (not through CASCADE)
CREATE OR REPLACE FUNCTION handle_team_league_null()
RETURNS TRIGGER AS $$
BEGIN
    -- If league_id is being set to NULL and previous_league_name is not set
    IF NEW.league_id IS NULL AND OLD.league_id IS NOT NULL AND NEW.previous_league_name IS NULL THEN
        -- Try to get the league name
        SELECT name INTO NEW.previous_league_name
        FROM leagues
        WHERE id = OLD.league_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_team_league_null_trigger ON teams;
CREATE TRIGGER handle_team_league_null_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    WHEN (NEW.league_id IS NULL AND OLD.league_id IS NOT NULL)
    EXECUTE FUNCTION handle_team_league_null();