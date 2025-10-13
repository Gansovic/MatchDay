-- Enforce constraint: Teams can only join seasons of their league
-- A team must have league_id matching the season's league_id

-- Step 1: Create a function to validate team-season-league relationship
CREATE OR REPLACE FUNCTION validate_team_season_league()
RETURNS TRIGGER AS $$
DECLARE
    v_team_league_id UUID;
    v_season_league_id UUID;
BEGIN
    -- Get the team's league_id
    SELECT league_id INTO v_team_league_id
    FROM teams
    WHERE id = NEW.team_id;

    -- Get the season's league_id
    SELECT league_id INTO v_season_league_id
    FROM seasons
    WHERE id = NEW.season_id;

    -- Check if team belongs to a league
    IF v_team_league_id IS NULL THEN
        RAISE EXCEPTION 'Team must be associated with a league before joining a season. Team ID: %', NEW.team_id;
    END IF;

    -- Check if team's league matches season's league
    IF v_team_league_id != v_season_league_id THEN
        RAISE EXCEPTION 'Team can only join seasons from their own league. Team league: %, Season league: %',
            v_team_league_id, v_season_league_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to enforce this validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS enforce_team_season_league_match ON season_teams;
CREATE TRIGGER enforce_team_season_league_match
    BEFORE INSERT OR UPDATE ON season_teams
    FOR EACH ROW
    EXECUTE FUNCTION validate_team_season_league();

-- Step 3: Add a check constraint as an additional safeguard
-- Note: This uses a CHECK constraint with a function for complex validation
ALTER TABLE season_teams DROP CONSTRAINT IF EXISTS check_team_belongs_to_season_league;

-- Step 4: Create an index to optimize the validation queries
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id) WHERE league_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);

-- Step 5: Add helpful comments
COMMENT ON FUNCTION validate_team_season_league() IS 'Ensures teams can only register for seasons within their own league';
COMMENT ON TRIGGER enforce_team_season_league_match ON season_teams IS 'Validates team-league-season relationship before allowing registration';

-- Step 6: Validation - Check for any existing violations
DO $$
DECLARE
    violation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO violation_count
    FROM season_teams st
    JOIN teams t ON t.id = st.team_id
    JOIN seasons s ON s.id = st.season_id
    WHERE t.league_id != s.league_id OR t.league_id IS NULL;

    IF violation_count > 0 THEN
        RAISE WARNING 'Found % existing season_teams records that violate the league constraint. These should be cleaned up.', violation_count;
    ELSE
        RAISE NOTICE 'All existing season_teams records are valid - teams match their season leagues.';
    END IF;
END $$;
