-- ========================================================================
-- PRODUCTION SEASONS DATA SCRIPT
-- Run this AFTER running the production_seasons_migration.sql
-- Creates seasons for myLeague and links existing teams
-- ========================================================================

-- Insert seasons for myLeague (261f251e-aee8-4153-a4c7-537b565e7e3f)
INSERT INTO seasons (
    name, display_name, league_id, season_year, start_date, end_date,
    is_current, is_active, status, description, tournament_format,
    registration_deadline, match_frequency, min_teams, max_teams,
    points_for_win, points_for_draw, points_for_loss, allow_draws, 
    home_away_balance, fixtures_status
) VALUES 

-- Current Active Season
(
    '2024-2025', '2024/25 myLeague Season', 
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2024,
    '2024-09-01', '2025-06-30',
    true, true, 'active', 
    'Current myLeague season featuring botTeam and bot2Team competing for the championship.',
    'league', '2024-08-20', 1, 2, 10, 3, 1, 0, true, true, 'pending'
),

-- Previous Completed Season
(
    '2023-2024', '2023/24 myLeague Season',
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2023, 
    '2023-09-01', '2024-06-30',
    false, false, 'completed',
    'Previous myLeague season - completed championship.',
    'league', '2023-08-20', 1, 2, 10, 3, 1, 0, true, true, 'completed'
),

-- Future Draft Season
(
    '2025-2026', '2025/26 myLeague Season (Draft)',
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2025,
    '2025-09-01', '2026-06-30',
    false, true, 'draft', 
    'Upcoming myLeague season - registration opens soon!',
    'league', '2025-08-20', 1, 2, 10, 3, 1, 0, true, true, 'pending'
)

ON CONFLICT (name, league_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_current = EXCLUDED.is_current,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Get the season IDs for team registration
DO $$
DECLARE
    current_season_id UUID;
    previous_season_id UUID;
    bot_team_id UUID := 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e';
    bot2_team_id UUID := 'f9142db6-e738-4f9c-91ca-d7786c904283';
BEGIN
    -- Get current season ID
    SELECT id INTO current_season_id 
    FROM seasons 
    WHERE league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f' 
    AND name = '2024-2025';
    
    -- Get previous season ID
    SELECT id INTO previous_season_id 
    FROM seasons 
    WHERE league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f' 
    AND name = '2023-2024';
    
    IF current_season_id IS NOT NULL THEN
        -- Register both bot teams for current season
        INSERT INTO season_teams (season_id, team_id, status, registration_date)
        VALUES 
            (current_season_id, bot_team_id, 'confirmed', NOW()),
            (current_season_id, bot2_team_id, 'confirmed', NOW())
        ON CONFLICT (season_id, team_id) DO UPDATE SET
            status = EXCLUDED.status,
            updated_at = NOW();
            
        RAISE NOTICE 'Registered botTeam and bot2Team for current season';
    END IF;
    
    IF previous_season_id IS NOT NULL THEN
        -- Register both bot teams for previous season (completed)
        INSERT INTO season_teams (season_id, team_id, status, registration_date)
        VALUES 
            (previous_season_id, bot_team_id, 'confirmed', '2023-08-15'::timestamp),
            (previous_season_id, bot2_team_id, 'confirmed', '2023-08-15'::timestamp)
        ON CONFLICT (season_id, team_id) DO UPDATE SET
            status = EXCLUDED.status;
            
        RAISE NOTICE 'Registered botTeam and bot2Team for previous season';
    END IF;
END $$;

-- Create initial standings for current season teams
INSERT INTO season_standings (season_id, team_id)
SELECT s.id, st.team_id
FROM seasons s
JOIN season_teams st ON s.id = st.season_id
WHERE s.league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f'
  AND s.name = '2024-2025'
ON CONFLICT (season_id, team_id) DO NOTHING;

-- If you have existing matches, link them to the current season
-- First, check if there are any matches for myLeague teams
DO $$
DECLARE
    current_season_id UUID;
    match_count INTEGER;
BEGIN
    -- Get current season ID
    SELECT id INTO current_season_id 
    FROM seasons 
    WHERE league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f' 
    AND name = '2024-2025';
    
    -- Count existing matches involving myLeague teams
    SELECT COUNT(*) INTO match_count
    FROM matches m
    WHERE (m.home_team_id = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e' 
           OR m.away_team_id = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e'
           OR m.home_team_id = 'f9142db6-e738-4f9c-91ca-d7786c904283'
           OR m.away_team_id = 'f9142db6-e738-4f9c-91ca-d7786c904283')
    AND m.season_id IS NULL;
    
    IF match_count > 0 AND current_season_id IS NOT NULL THEN
        -- Update existing matches to link them to current season
        UPDATE matches 
        SET season_id = current_season_id
        WHERE (home_team_id = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e' 
               OR away_team_id = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e'
               OR home_team_id = 'f9142db6-e738-4f9c-91ca-d7786c904283'
               OR away_team_id = 'f9142db6-e738-4f9c-91ca-d7786c904283')
        AND season_id IS NULL;
        
        RAISE NOTICE 'Updated % existing matches with current season reference', match_count;
    ELSE
        RAISE NOTICE 'No existing matches found to link to seasons';
    END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES - Check what was created
-- ========================================================================

-- Show created seasons
DO $$
DECLARE
    season_rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CREATED SEASONS FOR myLeague:';
    RAISE NOTICE '========================================';
    
    FOR season_rec IN
        SELECT name, display_name, status, is_current
        FROM seasons 
        WHERE league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f'
        ORDER BY season_year DESC
    LOOP
        RAISE NOTICE '- %: % (% %)', 
            season_rec.name, 
            season_rec.display_name, 
            season_rec.status,
            CASE WHEN season_rec.is_current THEN '- CURRENT' ELSE '' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'TEAM REGISTRATIONS:';
    
    FOR season_rec IN
        SELECT s.name, t.name as team_name, st.status
        FROM seasons s
        JOIN season_teams st ON s.id = st.season_id
        JOIN teams t ON st.team_id = t.id
        WHERE s.league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f'
        ORDER BY s.season_year DESC, t.name
    LOOP
        RAISE NOTICE '- %: % (%)', season_rec.name, season_rec.team_name, season_rec.status;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'myLeague seasons setup completed!';
    RAISE NOTICE 'You should now see seasons in your Supabase dashboard.';
    RAISE NOTICE '========================================';
END $$;