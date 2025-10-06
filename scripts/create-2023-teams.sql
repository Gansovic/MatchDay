-- Create 12 Teams for 2023 Season
-- Creates teams with authentic football names and assigns players
-- Run Date: 2025-09-02

SET SESSION AUTHORIZATION postgres;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE season_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Create 12 teams for 2023 season
INSERT INTO teams (
    id, name, team_color, max_players, min_players, is_recruiting, created_at, updated_at
) VALUES
-- Classic football team names with authentic colors
('2023team-1111-1111-1111-111111111111', 'Real Madrid CF', '#FFFFFF', 22, 11, false, NOW(), NOW()),
('2023team-2222-2222-2222-222222222222', 'FC Barcelona', '#004C98', 22, 11, false, NOW(), NOW()),
('2023team-3333-3333-3333-333333333333', 'Manchester United', '#DA020E', 22, 11, false, NOW(), NOW()),
('2023team-4444-4444-4444-444444444444', 'Chelsea FC', '#034694', 22, 11, false, NOW(), NOW()),
('2023team-5555-5555-5555-555555555555', 'Arsenal FC', '#EF0107', 22, 11, false, NOW(), NOW()),
('2023team-6666-6666-6666-666666666666', 'Liverpool FC', '#C8102E', 22, 11, false, NOW(), NOW()),
('2023team-7777-7777-7777-777777777777', 'AC Milan', '#FB020F', 22, 11, false, NOW(), NOW()),
('2023team-8888-8888-8888-888888888888', 'Juventus FC', '#000000', 22, 11, false, NOW(), NOW()),
('2023team-9999-9999-9999-999999999999', 'Bayern Munich', '#DC143C', 22, 11, false, NOW(), NOW()),
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Paris Saint-Germain', '#004170', 22, 11, false, NOW(), NOW()),
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Borussia Dortmund', '#FDE100', 22, 11, false, NOW(), NOW()),
('2023team-cccc-cccc-cccc-cccccccccccc', 'Ajax Amsterdam', '#D2122E', 22, 11, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Register teams to 2023 season
INSERT INTO season_teams (
    season_id, team_id, status, registered_at
) VALUES
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-1111-1111-1111-111111111111', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-2222-2222-2222-222222222222', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-3333-3333-3333-333333333333', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-4444-4444-4444-444444444444', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-5555-5555-5555-555555555555', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-6666-6666-6666-666666666666', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-7777-7777-7777-777777777777', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-8888-8888-8888-888888888888', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-9999-9999-9999-999999999999', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active', NOW()),
('8d8927c1-b625-43cc-8072-043eb17b54a4', '2023team-cccc-cccc-cccc-cccccccccccc', 'active', NOW())
ON CONFLICT DO NOTHING;

-- Now assign players to teams
-- We have 55 players: 4 GK, 18 DEF, 18 MID, 15 FWD
-- Each team needs: 1 GK (with backup), 4-5 DEF, 4-5 MID, 3-4 FWD ≈ 4-5 players per team

-- Get user IDs for assignment (created today)
CREATE TEMP TABLE temp_2023_users AS
SELECT id, full_name, preferred_position, 
       ROW_NUMBER() OVER (PARTITION BY preferred_position ORDER BY full_name) as position_rank
FROM user_profiles 
WHERE created_at::date = CURRENT_DATE
ORDER BY preferred_position, full_name;

-- Real Madrid CF (Team 1) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-1111-1111-1111-111111111111', (SELECT id FROM temp_2023_users WHERE preferred_position = 'goalkeeper' AND position_rank = 1), 'goalkeeper', 1, 'active', NOW()),
('2023team-1111-1111-1111-111111111111', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 1), 'defender', 2, 'active', NOW()),
('2023team-1111-1111-1111-111111111111', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 1), 'midfielder', 8, 'active', NOW()),
('2023team-1111-1111-1111-111111111111', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 1), 'forward', 9, 'active', NOW()),
('2023team-1111-1111-1111-111111111111', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 2), 'forward', 10, 'active', NOW());

-- FC Barcelona (Team 2) - 5 players  
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-2222-2222-2222-222222222222', (SELECT id FROM temp_2023_users WHERE preferred_position = 'goalkeeper' AND position_rank = 2), 'goalkeeper', 1, 'active', NOW()),
('2023team-2222-2222-2222-222222222222', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 2), 'defender', 3, 'active', NOW()),
('2023team-2222-2222-2222-222222222222', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 2), 'midfielder', 6, 'active', NOW()),
('2023team-2222-2222-2222-222222222222', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 3), 'midfielder', 8, 'active', NOW()),
('2023team-2222-2222-2222-222222222222', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 3), 'forward', 9, 'active', NOW());

-- Manchester United (Team 3) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-3333-3333-3333-333333333333', (SELECT id FROM temp_2023_users WHERE preferred_position = 'goalkeeper' AND position_rank = 3), 'goalkeeper', 1, 'active', NOW()),
('2023team-3333-3333-3333-333333333333', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 3), 'defender', 5, 'active', NOW()),
('2023team-3333-3333-3333-333333333333', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 4), 'defender', 4, 'active', NOW()),
('2023team-3333-3333-3333-333333333333', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 4), 'midfielder', 7, 'active', NOW()),
('2023team-3333-3333-3333-333333333333', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 4), 'forward', 9, 'active', NOW());

-- Chelsea FC (Team 4) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-4444-4444-4444-444444444444', (SELECT id FROM temp_2023_users WHERE preferred_position = 'goalkeeper' AND position_rank = 4), 'goalkeeper', 1, 'active', NOW()),
('2023team-4444-4444-4444-444444444444', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 5), 'defender', 2, 'active', NOW()),
('2023team-4444-4444-4444-444444444444', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 5), 'midfielder', 8, 'active', NOW()),
('2023team-4444-4444-4444-444444444444', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 6), 'midfielder', 6, 'active', NOW()),
('2023team-4444-4444-4444-444444444444', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 5), 'forward', 9, 'active', NOW());

-- Arsenal FC (Team 5) - 4 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-5555-5555-5555-555555555555', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 6), 'defender', 5, 'active', NOW()),
('2023team-5555-5555-5555-555555555555', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 7), 'defender', 2, 'active', NOW()),
('2023team-5555-5555-5555-555555555555', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 7), 'midfielder', 4, 'active', NOW()),
('2023team-5555-5555-5555-555555555555', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 6), 'forward', 14, 'active', NOW());

-- Liverpool FC (Team 6) - 4 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-6666-6666-6666-666666666666', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 8), 'defender', 4, 'active', NOW()),
('2023team-6666-6666-6666-666666666666', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 8), 'midfielder', 8, 'active', NOW()),
('2023team-6666-6666-6666-666666666666', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 9), 'midfielder', 6, 'active', NOW()),
('2023team-6666-6666-6666-666666666666', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 7), 'forward', 9, 'active', NOW());

-- AC Milan (Team 7) - 4 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-7777-7777-7777-777777777777', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 9), 'defender', 3, 'active', NOW()),
('2023team-7777-7777-7777-777777777777', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 10), 'defender', 13, 'active', NOW()),
('2023team-7777-7777-7777-777777777777', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 10), 'midfielder', 10, 'active', NOW()),
('2023team-7777-7777-7777-777777777777', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 8), 'forward', 9, 'active', NOW());

-- Juventus FC (Team 8) - 4 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-8888-8888-8888-888888888888', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 11), 'defender', 4, 'active', NOW()),
('2023team-8888-8888-8888-888888888888', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 11), 'midfielder', 8, 'active', NOW()),
('2023team-8888-8888-8888-888888888888', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 12), 'midfielder', 21, 'active', NOW()),
('2023team-8888-8888-8888-888888888888', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 9), 'forward', 10, 'active', NOW());

-- Bayern Munich (Team 9) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-9999-9999-9999-999999999999', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 12), 'defender', 5, 'active', NOW()),
('2023team-9999-9999-9999-999999999999', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 13), 'defender', 4, 'active', NOW()),
('2023team-9999-9999-9999-999999999999', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 13), 'midfielder', 6, 'active', NOW()),
('2023team-9999-9999-9999-999999999999', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 14), 'midfielder', 25, 'active', NOW()),
('2023team-9999-9999-9999-999999999999', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 10), 'forward', 9, 'active', NOW());

-- Paris Saint-Germain (Team 10) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 14), 'defender', 2, 'active', NOW()),
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 15), 'defender', 5, 'active', NOW()),
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 15), 'midfielder', 6, 'active', NOW()),
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 11), 'forward', 7, 'active', NOW()),
('2023team-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 12), 'forward', 10, 'active', NOW());

-- Borussia Dortmund (Team 11) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 16), 'defender', 15, 'active', NOW()),
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 17), 'defender', 26, 'active', NOW()),
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 16), 'midfielder', 8, 'active', NOW()),
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 17), 'midfielder', 19, 'active', NOW()),
('2023team-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 13), 'forward', 9, 'active', NOW());

-- Ajax Amsterdam (Team 12) - 5 players
INSERT INTO team_members (team_id, user_id, preferred_position, jersey_number, status, joined_at) VALUES
('2023team-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM temp_2023_users WHERE preferred_position = 'defender' AND position_rank = 18), 'defender', 3, 'active', NOW()),
('2023team-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM temp_2023_users WHERE preferred_position = 'midfielder' AND position_rank = 18), 'midfielder', 6, 'active', NOW()),
('2023team-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 14), 'forward', 9, 'active', NOW()),
('2023team-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM temp_2023_users WHERE preferred_position = 'forward' AND position_rank = 15), 'forward', 11, 'active', NOW());

-- Re-enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Clean up temp table
DROP TABLE temp_2023_users;

-- Final summary
SELECT 'TEAM CREATION SUMMARY' as summary;
SELECT t.name as team_name, COUNT(tm.user_id) as players_assigned
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE t.id LIKE '2023team-%'
GROUP BY t.name, t.id
ORDER BY t.name;