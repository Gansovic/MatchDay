-- Test script for team-league many-to-many functionality
-- Run this directly in the database

-- Step 1: Insert test users into auth.users and users table
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'captain1@test.com', NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'captain2@test.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'captain1@test.com', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'captain2@test.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a test team
INSERT INTO teams (id, name, captain_id, team_color, team_bio, max_players, min_players)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Multi-League Team', '11111111-1111-1111-1111-111111111111', '#FF5722', 'A team that can play in multiple leagues', 22, 11)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Get league IDs
DO $$
DECLARE
    league1_id UUID;
    league2_id UUID;
    team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    captain_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Get the two leagues
    SELECT id INTO league1_id FROM leagues WHERE name = 'League1';
    SELECT id INTO league2_id FROM leagues WHERE name = 'LaLiga';
    
    IF league1_id IS NULL OR league2_id IS NULL THEN
        RAISE NOTICE 'Could not find leagues';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found leagues: % and %', league1_id, league2_id;
    
    -- Step 4: Create team league requests
    INSERT INTO team_league_requests (team_id, league_id, requested_by, message, status)
    VALUES 
      (team_id, league1_id, captain_id, 'Requesting to join League1', 'pending'),
      (team_id, league2_id, captain_id, 'Requesting to join LaLiga', 'pending')
    ON CONFLICT (team_id, league_id) DO NOTHING;
    
    RAISE NOTICE 'Created team league requests';
    
    -- Step 5: Approve the requests (this should trigger junction table updates)
    UPDATE team_league_requests 
    SET status = 'approved', 
        reviewed_by = captain_id, 
        reviewed_at = NOW(),
        review_message = 'Approved for testing'
    WHERE team_id = team_id AND status = 'pending';
    
    RAISE NOTICE 'Approved team league requests';
END $$;

-- Step 6: Check the results
SELECT 'Team-League Junction Table:' as section;
SELECT 
    t.name as team_name,
    l.name as league_name,
    tl.joined_at,
    tl.is_active
FROM team_leagues tl
JOIN teams t ON tl.team_id = t.id  
JOIN leagues l ON tl.league_id = l.id
WHERE t.name = 'Test Multi-League Team';

SELECT 'Team Primary League:' as section;
SELECT 
    t.name as team_name,
    l.name as primary_league
FROM teams t
LEFT JOIN leagues l ON t.league_id = l.id
WHERE t.name = 'Test Multi-League Team';

SELECT 'Function Test - get_team_leagues:' as section;
SELECT * FROM get_team_leagues('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

SELECT 'Team League Count:' as section;
SELECT get_team_league_count('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as league_count;