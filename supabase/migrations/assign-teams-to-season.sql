-- Quick script to assign existing 8 teams to the season
-- Season ID: d055defa-d9a8-4e7e-a95b-a1a5d0e408de
-- League ID: bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863

-- First, delete any existing registrations to start fresh
DELETE FROM season_teams
WHERE season_id = 'd055defa-d9a8-4e7e-a95b-a1a5d0e408de';

-- Insert ALL 8 teams from the league into season_teams (ordered by creation date)
INSERT INTO season_teams (season_id, team_id, status, registration_date)
SELECT
  'd055defa-d9a8-4e7e-a95b-a1a5d0e408de' as season_id,
  t.id as team_id,
  'registered' as status,
  NOW() as registration_date
FROM teams t
WHERE t.league_id = 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863'
ORDER BY t.created_at ASC
LIMIT 8;

-- Verify the insert
SELECT
  st.id,
  st.season_id,
  t.name as team_name,
  t.team_color,
  st.status,
  st.registration_date
FROM season_teams st
JOIN teams t ON st.team_id = t.id
WHERE st.season_id = 'd055defa-d9a8-4e7e-a95b-a1a5d0e408de'
ORDER BY st.registration_date;
