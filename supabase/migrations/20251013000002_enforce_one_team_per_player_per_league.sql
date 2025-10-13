-- Enforce constraint: A player can only be in one team per league
-- This prevents a player from being a member of multiple teams in the same league

-- Step 1: Create a function to validate player can only be in one team per league
CREATE OR REPLACE FUNCTION validate_one_team_per_player_per_league()
RETURNS TRIGGER AS $$
DECLARE
    v_new_team_league_id UUID;
    v_existing_team_count INTEGER;
BEGIN
    -- Get the league_id of the team being joined
    SELECT league_id INTO v_new_team_league_id
    FROM teams
    WHERE id = NEW.team_id;

    -- If team doesn't have a league yet, allow it (will be caught by other constraint)
    IF v_new_team_league_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if user is already in another active team in the same league
    SELECT COUNT(*) INTO v_existing_team_count
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = NEW.user_id
      AND tm.is_active = true
      AND t.league_id = v_new_team_league_id
      AND tm.team_id != NEW.team_id;  -- Exclude current team (for updates)

    IF v_existing_team_count > 0 THEN
        RAISE EXCEPTION 'Player is already a member of another team in this league. A player can only be in one team per league.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to enforce this validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS enforce_one_team_per_player_per_league ON team_members;
CREATE TRIGGER enforce_one_team_per_player_per_league
    BEFORE INSERT OR UPDATE ON team_members
    FOR EACH ROW
    WHEN (NEW.is_active = true)  -- Only check for active memberships
    EXECUTE FUNCTION validate_one_team_per_player_per_league();

-- Step 3: Create an index to optimize the validation queries
CREATE INDEX IF NOT EXISTS idx_team_members_user_active_team
    ON team_members(user_id, team_id)
    WHERE is_active = true;

-- Step 4: Add helpful comments
COMMENT ON FUNCTION validate_one_team_per_player_per_league() IS 'Ensures a player can only be an active member of one team per league';
COMMENT ON TRIGGER enforce_one_team_per_player_per_league ON team_members IS 'Prevents players from joining multiple teams in the same league';

-- Step 5: Validation - Check for any existing violations
DO $$
DECLARE
    violation_count INTEGER;
    violation_details TEXT;
BEGIN
    -- Find players who are in multiple teams within the same league
    SELECT COUNT(DISTINCT tm.user_id) INTO violation_count
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.is_active = true
      AND t.league_id IS NOT NULL
    GROUP BY tm.user_id, t.league_id
    HAVING COUNT(DISTINCT tm.team_id) > 1;

    IF violation_count > 0 THEN
        -- Get details of violations for logging
        SELECT string_agg(
            'User ' || tm.user_id || ' in league ' || t.league_id || ' (teams: ' || COUNT(DISTINCT tm.team_id) || ')',
            ', '
        ) INTO violation_details
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.is_active = true
          AND t.league_id IS NOT NULL
        GROUP BY tm.user_id, t.league_id
        HAVING COUNT(DISTINCT tm.team_id) > 1
        LIMIT 5;

        RAISE WARNING 'Found % players in multiple teams within the same league. Examples: %',
            violation_count, violation_details;
        RAISE NOTICE 'These violations should be resolved manually by deactivating duplicate memberships.';
    ELSE
        RAISE NOTICE 'All players are in at most one team per league - constraint is satisfied.';
    END IF;
END $$;
