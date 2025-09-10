-- Migration: Team Statistics Calculation System
-- Description: Adds functions and triggers to automatically calculate team statistics from match results
-- Date: 2025-09-10

-- =====================================================
-- FUNCTION: Calculate team statistics from matches
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_team_stats(p_team_id UUID, p_season_year INTEGER DEFAULT NULL)
RETURNS TABLE (
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    games_played INTEGER,
    points INTEGER
) AS $$
DECLARE
    v_season_year INTEGER;
BEGIN
    -- Use current year if not provided
    v_season_year := COALESCE(p_season_year, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    RETURN QUERY
    WITH match_results AS (
        SELECT
            m.id,
            m.home_team_id,
            m.away_team_id,
            m.home_score,
            m.away_score,
            m.status,
            CASE 
                WHEN m.home_team_id = p_team_id THEN 'home'
                WHEN m.away_team_id = p_team_id THEN 'away'
            END AS team_side,
            CASE 
                WHEN m.home_team_id = p_team_id THEN m.home_score
                WHEN m.away_team_id = p_team_id THEN m.away_score
            END AS team_score,
            CASE 
                WHEN m.home_team_id = p_team_id THEN m.away_score
                WHEN m.away_team_id = p_team_id THEN m.home_score
            END AS opponent_score
        FROM matches m
        WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
          AND m.status = 'completed'
          AND EXTRACT(YEAR FROM m.match_date) = v_season_year
    ),
    stats_summary AS (
        SELECT
            COUNT(CASE WHEN team_score > opponent_score THEN 1 END) AS wins,
            COUNT(CASE WHEN team_score = opponent_score THEN 1 END) AS draws,
            COUNT(CASE WHEN team_score < opponent_score THEN 1 END) AS losses,
            COALESCE(SUM(team_score), 0) AS goals_for,
            COALESCE(SUM(opponent_score), 0) AS goals_against,
            COUNT(*) AS games_played
        FROM match_results
    )
    SELECT
        s.wins::INTEGER,
        s.draws::INTEGER,
        s.losses::INTEGER,
        s.goals_for::INTEGER,
        s.goals_against::INTEGER,
        s.games_played::INTEGER,
        (s.wins * 3 + s.draws)::INTEGER AS points
    FROM stats_summary s;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Update team_stats table for a specific team
-- =====================================================
CREATE OR REPLACE FUNCTION update_team_stats_for_team(p_team_id UUID, p_season_year INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_stats RECORD;
    v_league_id UUID;
    v_season_year INTEGER;
BEGIN
    -- Use current year if not provided
    v_season_year := COALESCE(p_season_year, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Get the team's current league
    SELECT league_id INTO v_league_id FROM teams WHERE id = p_team_id;
    
    -- Calculate stats
    SELECT * INTO v_stats FROM calculate_team_stats(p_team_id, v_season_year);
    
    -- Upsert team_stats record
    INSERT INTO team_stats (
        team_id,
        league_id,
        season_year,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        games_played,
        points,
        updated_at
    ) VALUES (
        p_team_id,
        v_league_id,
        v_season_year,
        v_stats.wins,
        v_stats.draws,
        v_stats.losses,
        v_stats.goals_for,
        v_stats.goals_against,
        v_stats.games_played,
        v_stats.points,
        NOW()
    )
    ON CONFLICT (team_id, season_year) 
    DO UPDATE SET
        league_id = EXCLUDED.league_id,
        wins = EXCLUDED.wins,
        draws = EXCLUDED.draws,
        losses = EXCLUDED.losses,
        goals_for = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        games_played = EXCLUDED.games_played,
        points = EXCLUDED.points,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update team stats when match status changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_update_team_stats_on_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stats when a match is marked as completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Update stats for both teams
        PERFORM update_team_stats_for_team(NEW.home_team_id, EXTRACT(YEAR FROM NEW.match_date)::INTEGER);
        PERFORM update_team_stats_for_team(NEW.away_team_id, EXTRACT(YEAR FROM NEW.match_date)::INTEGER);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_team_stats_on_match_completion ON matches;

-- Create the trigger
CREATE TRIGGER update_team_stats_on_match_completion
    AFTER INSERT OR UPDATE OF status, home_score, away_score
    ON matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_team_stats_on_match();

-- =====================================================
-- FUNCTION: Recalculate all team stats for a season
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_all_team_stats(p_season_year INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_team RECORD;
    v_season_year INTEGER;
BEGIN
    -- Use current year if not provided
    v_season_year := COALESCE(p_season_year, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Loop through all teams (check for is_active if it exists, otherwise use all non-archived teams)
    FOR v_team IN SELECT id FROM teams WHERE is_archived = false
    LOOP
        PERFORM update_team_stats_for_team(v_team.id, v_season_year);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Add games_played column if it doesn't exist
-- =====================================================
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;

-- =====================================================
-- VIEW: Team statistics with win rate
-- =====================================================
CREATE OR REPLACE VIEW team_stats_with_rates AS
SELECT 
    ts.*,
    t.name AS team_name,
    t.team_color,
    l.name AS league_name,
    CASE 
        WHEN COALESCE(ts.wins, 0) + COALESCE(ts.draws, 0) + COALESCE(ts.losses, 0) > 0 THEN 
            ROUND((ts.wins::NUMERIC / (ts.wins + ts.draws + ts.losses)) * 100, 2)
        ELSE 0
    END AS win_rate,
    CASE 
        WHEN COALESCE(ts.wins, 0) + COALESCE(ts.draws, 0) + COALESCE(ts.losses, 0) > 0 THEN 
            ROUND((ts.draws::NUMERIC / (ts.wins + ts.draws + ts.losses)) * 100, 2)
        ELSE 0
    END AS draw_rate,
    CASE 
        WHEN COALESCE(ts.wins, 0) + COALESCE(ts.draws, 0) + COALESCE(ts.losses, 0) > 0 THEN 
            ROUND((ts.losses::NUMERIC / (ts.wins + ts.draws + ts.losses)) * 100, 2)
        ELSE 0
    END AS loss_rate,
    CASE 
        WHEN COALESCE(ts.wins, 0) + COALESCE(ts.draws, 0) + COALESCE(ts.losses, 0) > 0 THEN 
            ROUND(ts.goals_for::NUMERIC / (ts.wins + ts.draws + ts.losses), 2)
        ELSE 0
    END AS avg_goals_for,
    CASE 
        WHEN COALESCE(ts.wins, 0) + COALESCE(ts.draws, 0) + COALESCE(ts.losses, 0) > 0 THEN 
            ROUND(ts.goals_against::NUMERIC / (ts.wins + ts.draws + ts.losses), 2)
        ELSE 0
    END AS avg_goals_against,
    (ts.goals_for - ts.goals_against) AS goal_difference
FROM team_stats ts
JOIN teams t ON ts.team_id = t.id
LEFT JOIN leagues l ON ts.league_id = l.id;

-- =====================================================
-- Initial calculation for existing data
-- =====================================================
-- Calculate stats for all teams in the current season
SELECT recalculate_all_team_stats(2024);

-- Grant necessary permissions
GRANT SELECT ON team_stats_with_rates TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_team_stats_for_team TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_team_stats TO authenticated;