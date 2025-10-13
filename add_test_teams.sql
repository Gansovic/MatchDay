-- SQL script to add existing test teams to a specific league and season
-- League ID: 7e0b12a7-bb6e-4517-b588-9975559510a8
-- Season ID: 730c95ae-3df5-454b-bdca-4a98fe86b711

DO $$
DECLARE
    v_league_id UUID := '7e0b12a7-bb6e-4517-b588-9975559510a8';
    v_season_id UUID := '730c95ae-3df5-454b-bdca-4a98fe86b711';
    v_team_record RECORD;
    v_teams_found INTEGER := 0;
    v_teams_updated INTEGER := 0;
    v_teams_registered INTEGER := 0;
BEGIN
    -- Find existing teams named "Test Team 15" through "Test Team 21"
    FOR v_team_record IN
        SELECT id, name
        FROM teams
        WHERE name IN ('Test Team 15', 'Test Team 16', 'Test Team 17', 'Test Team 18', 'Test Team 19', 'Test Team 20', 'Test Team 21')
    LOOP
        v_teams_found := v_teams_found + 1;

        -- Update team to associate with league
        UPDATE teams
        SET league_id = v_league_id
        WHERE id = v_team_record.id;

        v_teams_updated := v_teams_updated + 1;
        RAISE NOTICE 'Associated % (ID: %) with league', v_team_record.name, v_team_record.id;

        -- Register team to season (skip if already registered)
        INSERT INTO season_teams (season_id, team_id, status, registration_date)
        VALUES (v_season_id, v_team_record.id, 'registered', NOW())
        ON CONFLICT (season_id, team_id) DO NOTHING;

        -- Check if it was inserted or already existed
        IF FOUND THEN
            v_teams_registered := v_teams_registered + 1;
            RAISE NOTICE 'Registered % to season', v_team_record.name;
        ELSE
            RAISE NOTICE '% was already registered to season', v_team_record.name;
        END IF;
    END LOOP;

    IF v_teams_found = 0 THEN
        RAISE EXCEPTION 'No teams found with names "Test Team 15" through "Test Team 21". Please create them first.';
    END IF;

    RAISE NOTICE 'Summary: Found % teams, updated % teams with league, registered % teams to season',
                 v_teams_found, v_teams_updated, v_teams_registered;
END $$;
