-- Sample Player Stats Data for player@matchday.com
-- This creates sample match statistics for testing multi-team aggregation

-- First, let's identify the user and their teams
DO $$
DECLARE
    v_user_id UUID;
    v_team1_id UUID;
    v_team2_id UUID;
    v_match_id UUID;
BEGIN
    -- Get the user ID for player@matchday.com
    SELECT id INTO v_user_id FROM users WHERE email = 'player@matchday.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User player@matchday.com not found';
        RETURN;
    END IF;
    
    -- Get the user's team IDs (should be 2 teams based on the debug logs)
    -- Team 1: 26122240-4346-444a-9e24-320bbeac893b
    -- Team 2: 39a9f0fb-517b-4f34-934e-9a280d206989
    SELECT team_id INTO v_team1_id 
    FROM team_members 
    WHERE user_id = v_user_id AND is_active = true
    ORDER BY joined_at ASC
    LIMIT 1;
    
    SELECT team_id INTO v_team2_id 
    FROM team_members 
    WHERE user_id = v_user_id AND is_active = true AND team_id != v_team1_id
    ORDER BY joined_at ASC
    LIMIT 1;
    
    IF v_team1_id IS NULL OR v_team2_id IS NULL THEN
        RAISE NOTICE 'User does not have 2 teams. Team1: %, Team2: %', v_team1_id, v_team2_id;
        -- If not found, use the known IDs from debug logs
        v_team1_id := '26122240-4346-444a-9e24-320bbeac893b'::UUID;
        v_team2_id := '39a9f0fb-517b-4f34-934e-9a280d206989'::UUID;
    END IF;
    
    RAISE NOTICE 'Adding player stats for user % with teams % and %', v_user_id, v_team1_id, v_team2_id;
    
    -- Add sample matches and player stats for Team 1
    -- Match 1 for Team 1
    SELECT id INTO v_match_id FROM matches 
    WHERE (home_team_id = v_team1_id OR away_team_id = v_team1_id) 
    AND status = 'completed'
    ORDER BY match_date DESC 
    LIMIT 1;
    
    IF v_match_id IS NOT NULL THEN
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played, yellow_cards, red_cards)
        VALUES (v_user_id, v_team1_id, v_match_id, 2, 1, 90, 0, 0)
        ON CONFLICT (user_id, team_id, match_id) DO UPDATE
        SET goals = 2, assists = 1, minutes_played = 90;
    ELSE
        -- Create a dummy match if none exists
        INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
        VALUES (gen_random_uuid(), v_team1_id, v_team2_id, NOW() - INTERVAL '7 days', 'completed', 3, 2)
        RETURNING id INTO v_match_id;
        
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
        VALUES (v_user_id, v_team1_id, v_match_id, 2, 1, 90);
    END IF;
    
    -- Match 2 for Team 1
    SELECT id INTO v_match_id FROM matches 
    WHERE (home_team_id = v_team1_id OR away_team_id = v_team1_id) 
    AND status = 'completed'
    AND id != v_match_id
    ORDER BY match_date DESC 
    LIMIT 1;
    
    IF v_match_id IS NOT NULL THEN
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played, yellow_cards)
        VALUES (v_user_id, v_team1_id, v_match_id, 1, 2, 85, 1)
        ON CONFLICT (user_id, team_id, match_id) DO UPDATE
        SET goals = 1, assists = 2, minutes_played = 85, yellow_cards = 1;
    ELSE
        INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
        VALUES (gen_random_uuid(), v_team2_id, v_team1_id, NOW() - INTERVAL '14 days', 'completed', 2, 1)
        RETURNING id INTO v_match_id;
        
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played, yellow_cards)
        VALUES (v_user_id, v_team1_id, v_match_id, 1, 2, 85, 1);
    END IF;
    
    -- Add sample matches and player stats for Team 2
    -- Match 1 for Team 2
    SELECT id INTO v_match_id FROM matches 
    WHERE (home_team_id = v_team2_id OR away_team_id = v_team2_id) 
    AND status = 'completed'
    ORDER BY match_date DESC 
    LIMIT 1;
    
    IF v_match_id IS NOT NULL THEN
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
        VALUES (v_user_id, v_team2_id, v_match_id, 3, 0, 90)
        ON CONFLICT (user_id, team_id, match_id) DO UPDATE
        SET goals = 3, assists = 0, minutes_played = 90;
    ELSE
        INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
        VALUES (gen_random_uuid(), v_team2_id, v_team1_id, NOW() - INTERVAL '3 days', 'completed', 4, 1)
        RETURNING id INTO v_match_id;
        
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
        VALUES (v_user_id, v_team2_id, v_match_id, 3, 0, 90);
    END IF;
    
    -- Match 2 for Team 2
    INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
    VALUES (gen_random_uuid(), v_team1_id, v_team2_id, NOW() - INTERVAL '10 days', 'completed', 1, 1)
    RETURNING id INTO v_match_id;
    
    INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
    VALUES (v_user_id, v_team2_id, v_match_id, 0, 1, 75);
    
    -- Match 3 for Team 2 (to show more matches for one team)
    INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
    VALUES (gen_random_uuid(), v_team2_id, v_team1_id, NOW() - INTERVAL '21 days', 'completed', 2, 2)
    RETURNING id INTO v_match_id;
    
    INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played, clean_sheets)
    VALUES (v_user_id, v_team2_id, v_match_id, 1, 1, 90, 1);
    
    RAISE NOTICE 'Successfully added sample player stats for player@matchday.com';
    RAISE NOTICE 'Team 1 Stats: 2 matches, 3 goals, 3 assists';
    RAISE NOTICE 'Team 2 Stats: 3 matches, 4 goals, 2 assists';
    RAISE NOTICE 'Total Expected: 5 matches, 7 goals, 5 assists';
END $$;

-- Verify the data was inserted
SELECT 
    u.email,
    COUNT(DISTINCT ps.id) as total_matches,
    SUM(ps.goals) as total_goals,
    SUM(ps.assists) as total_assists,
    COUNT(DISTINCT ps.team_id) as teams_played_for
FROM player_stats ps
JOIN users u ON ps.user_id = u.id
WHERE u.email = 'player@matchday.com'
GROUP BY u.email;