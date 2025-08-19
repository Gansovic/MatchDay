-- Fix league standings schema and view
-- This migration adds missing columns to team_stats and creates the league_standings view

-- Add missing columns to team_stats table
ALTER TABLE team_stats 
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0 CHECK (games_played >= 0),
ADD COLUMN IF NOT EXISTS clean_sheets INTEGER DEFAULT 0 CHECK (clean_sheets >= 0);

-- Update existing records to have consistent data
UPDATE team_stats 
SET games_played = COALESCE(wins + draws + losses, 0)
WHERE games_played = 0;

-- Drop and recreate the league_standings view with proper schema
DROP VIEW IF EXISTS league_standings CASCADE;

CREATE VIEW league_standings AS
SELECT 
    ts.id,
    ts.team_id,
    ts.league_id,
    ts.season_year,
    ts.games_played,
    ts.wins,
    ts.draws,
    ts.losses,
    ts.goals_for,
    ts.goals_against,
    ts.points,
    ts.clean_sheets,
    t.name as team_name,
    t.team_color,
    l.name as league_name,
    l.sport_type,
    (ts.goals_for - ts.goals_against) as goal_difference,
    CASE 
        WHEN ts.games_played > 0 THEN ROUND((ts.points::DECIMAL / (ts.games_played * 3)) * 100, 1)
        ELSE 0
    END as points_percentage,
    ROW_NUMBER() OVER (
        PARTITION BY ts.league_id, ts.season_year 
        ORDER BY ts.points DESC, (ts.goals_for - ts.goals_against) DESC, ts.goals_for DESC
    ) as position
FROM team_stats ts
JOIN teams t ON ts.team_id = t.id
JOIN leagues l ON ts.league_id = l.id
WHERE l.is_active = true;

-- Add helpful comment
COMMENT ON VIEW league_standings IS 'League standings with calculated positions and statistics';

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_stats_league_season ON team_stats(league_id, season_year);
CREATE INDEX IF NOT EXISTS idx_team_stats_performance ON team_stats(league_id, points DESC, goals_for DESC);

-- Ensure we have at least default stats for teams that exist in leagues
INSERT INTO team_stats (team_id, league_id, season_year)
SELECT t.id, tl.league_id, EXTRACT(YEAR FROM NOW())::INTEGER
FROM teams t
JOIN team_leagues tl ON t.id = tl.team_id
WHERE tl.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM team_stats ts 
    WHERE ts.team_id = t.id 
    AND ts.league_id = tl.league_id 
    AND ts.season_year = EXTRACT(YEAR FROM NOW())::INTEGER
)
ON CONFLICT (team_id, season_year) DO NOTHING;