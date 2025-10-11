-- Create 5 more test teams for the league
-- League ID: bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863

INSERT INTO teams (name, league_id, team_color, max_players, min_players, is_recruiting, team_bio)
VALUES
  ('Test Team 9', 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863', '#84CC16', 22, 7, true, 'Auto-generated test team'),
  ('Test Team 10', 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863', '#F43F5E', 22, 7, true, 'Auto-generated test team'),
  ('Test Team 11', 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863', '#22D3EE', 22, 7, true, 'Auto-generated test team'),
  ('Test Team 12', 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863', '#A855F7', 22, 7, true, 'Auto-generated test team'),
  ('Test Team 13', 'bc5ca1ac-7e2c-4823-9a5d-7fa3f6f70863', '#FB923C', 22, 7, true, 'Auto-generated test team')
RETURNING id, name, team_color;
