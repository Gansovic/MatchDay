-- Create Complete 2023 Season Match Fixtures and Results
-- Generates 132 matches (12 teams × 11 opponents × 2 rounds) with realistic results
-- Run Date: 2025-09-02

SET SESSION AUTHORIZATION postgres;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- Get our 12 teams for the season
CREATE TEMP TABLE season_teams_list AS
SELECT t.id, t.name, ROW_NUMBER() OVER (ORDER BY t.name) as team_number
FROM teams t
WHERE t.league_id = '20f5b4c7-ced3-4000-9680-3e7d567c1e2e'
ORDER BY t.name;

-- Generate all possible match combinations (double round-robin)
CREATE TEMP TABLE match_fixtures AS
SELECT 
    h.id as home_team_id,
    h.name as home_team,
    a.id as away_team_id,
    a.name as away_team,
    CASE 
        WHEN h.team_number < a.team_number THEN 1 -- First round
        ELSE 2 -- Return fixtures (second round)
    END as round_number,
    -- Schedule matches across the season (January to November 2023)
    ('2023-01-15'::date + 
     ((CASE WHEN h.team_number < a.team_number THEN 
        ((h.team_number - 1) * 11 + (a.team_number - h.team_number - 1)) 
       ELSE 
        66 + ((a.team_number - 1) * 11 + (h.team_number - a.team_number - 1))
       END) * 7) -- Weekly matches
    ) as match_date
FROM season_teams_list h
CROSS JOIN season_teams_list a
WHERE h.id != a.id
ORDER BY match_date, home_team;

-- Insert all fixtures as completed matches with realistic scores
INSERT INTO matches (
    league_id, season_id, home_team_id, away_team_id, scheduled_date, 
    status, home_score, away_score, created_at, updated_at
)
SELECT 
    '20f5b4c7-ced3-4000-9680-3e7d567c1e2e'::uuid, -- LaLiga ID
    '8d8927c1-b625-43cc-8072-043eb17b54a4'::uuid, -- 2023 Season ID
    mf.home_team_id,
    mf.away_team_id,
    mf.match_date + TIME '15:00:00', -- 3 PM kickoffs
    'completed',
    -- Realistic score generation based on team "strength" (alphabetical order as proxy)
    CASE 
        -- Home advantage and team strength factors
        WHEN mf.home_team LIKE '%Real Madrid%' THEN FLOOR(RANDOM() * 3) + 1 -- Strong teams score more
        WHEN mf.home_team LIKE '%Barcelona%' THEN FLOOR(RANDOM() * 3) + 1
        WHEN mf.home_team LIKE '%Bayern%' THEN FLOOR(RANDOM() * 3) + 1
        WHEN mf.home_team LIKE '%Liverpool%' THEN FLOOR(RANDOM() * 3) + 1
        WHEN mf.home_team LIKE '%Chelsea%' THEN FLOOR(RANDOM() * 3) + 1
        ELSE FLOOR(RANDOM() * 4) -- Other teams 0-3 goals
    END::integer as home_score,
    CASE 
        -- Away team scoring (slightly lower due to no home advantage)
        WHEN mf.away_team LIKE '%Real Madrid%' THEN FLOOR(RANDOM() * 2.5) + 0
        WHEN mf.away_team LIKE '%Barcelona%' THEN FLOOR(RANDOM() * 2.5) + 0  
        WHEN mf.away_team LIKE '%Bayern%' THEN FLOOR(RANDOM() * 2.5) + 0
        WHEN mf.away_team LIKE '%Liverpool%' THEN FLOOR(RANDOM() * 2.5) + 0
        WHEN mf.away_team LIKE '%Chelsea%' THEN FLOOR(RANDOM() * 2.5) + 0
        ELSE FLOOR(RANDOM() * 3) -- Other teams 0-2 goals  
    END::integer as away_score,
    NOW(),
    NOW()
FROM match_fixtures mf
ORDER BY mf.match_date;

-- Update season with completed match count
UPDATE seasons 
SET total_matches_planned = 132,
    fixtures_status = 'completed',
    fixtures_generated_at = NOW()
WHERE id = '8d8927c1-b625-43cc-8072-043eb17b54a4';

-- Clean up temp tables
DROP TABLE season_teams_list;
DROP TABLE match_fixtures;

-- Generate summary statistics
SELECT 'MATCH FIXTURES SUMMARY' as summary;

SELECT 
    'Total matches created: ' || COUNT(*) as stat
FROM matches 
WHERE season_id = '8d8927c1-b625-43cc-8072-043eb17b54a4';

SELECT 
    'Matches per team: ' || COUNT(*) as stat
FROM matches 
WHERE season_id = '8d8927c1-b625-43cc-8072-043eb17b54a4'
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Real Madrid CF' LIMIT 1);

-- Show some sample matches
SELECT 'SAMPLE MATCHES:' as sample_header;
SELECT 
    ht.name as home_team,
    m.home_score || '-' || m.away_score as score,
    at.name as away_team,
    m.scheduled_date::date as match_date
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE m.season_id = '8d8927c1-b625-43cc-8072-043eb17b54a4'
ORDER BY m.scheduled_date
LIMIT 10;

-- Show goal statistics
SELECT 
    'Total goals scored: ' || SUM(home_score + away_score) as stat
FROM matches 
WHERE season_id = '8d8927c1-b625-43cc-8072-043eb17b54a4';

-- Re-enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;