-- Migration: Player-Team Statistics Integration
-- Description: Creates views and functions to connect player stats with team performance
-- Date: 2025-09-10

-- =====================================================
-- VIEW: Player statistics with team context
-- =====================================================
CREATE OR REPLACE VIEW player_team_stats AS
SELECT 
    tm.user_id AS player_id,
    COALESCE(u.full_name, u.email) AS player_name,
    u.profile_image_url AS player_avatar,
    u.position AS preferred_position,
    tm.team_id,
    t.name AS team_name,
    t.team_color,
    tm.position AS team_position,
    tm.jersey_number,
    ts.season_year,
    ts.wins AS team_wins,
    ts.draws AS team_draws,
    ts.losses AS team_losses,
    ts.games_played AS team_games_played,
    ts.goals_for AS team_goals_for,
    ts.goals_against AS team_goals_against,
    ts.points AS team_points,
    CASE 
        WHEN ts.games_played > 0 THEN 
            ROUND((ts.wins::NUMERIC / ts.games_played) * 100, 2)
        ELSE 0
    END AS team_win_rate,
    l.name AS league_name,
    l.id AS league_id,
    -- Player individual stats (to be expanded when player_stats is properly populated)
    COALESCE(ps.goals, 0) AS player_goals,
    COALESCE(ps.assists, 0) AS player_assists,
    COALESCE(ps.minutes_played, 0) AS player_minutes,
    COALESCE(ps.yellow_cards, 0) AS player_yellow_cards,
    COALESCE(ps.red_cards, 0) AS player_red_cards
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
LEFT JOIN team_stats ts ON t.id = ts.team_id 
    AND ts.season_year = EXTRACT(YEAR FROM NOW())::INTEGER
LEFT JOIN leagues l ON t.league_id = l.id
LEFT JOIN player_stats ps ON ps.user_id = tm.user_id 
    AND ps.team_id = tm.team_id
WHERE tm.is_active = true;

-- =====================================================
-- VIEW: User dashboard statistics
-- =====================================================
CREATE OR REPLACE VIEW user_dashboard_stats AS
WITH team_stats_agg AS (
    SELECT 
        tm.user_id,
        COUNT(DISTINCT tm.team_id) AS teams_joined,
        -- Aggregate team performance across all teams
        SUM(ts.wins) AS total_team_wins,
        SUM(ts.games_played) AS total_team_games,
        AVG(CASE 
            WHEN ts.games_played > 0 THEN 
                (ts.wins::NUMERIC / ts.games_played) * 100
            ELSE 0
        END) AS avg_team_win_rate,
        COUNT(DISTINCT t.league_id) AS leagues_participated
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    LEFT JOIN team_stats ts ON t.id = ts.team_id 
        AND ts.season_year = EXTRACT(YEAR FROM NOW())::INTEGER
    WHERE tm.is_active = true
    GROUP BY tm.user_id
),
player_stats_agg AS (
    SELECT 
        user_id,
        COUNT(*) AS matches_played,
        SUM(goals) AS goals_scored,
        SUM(assists) AS assists,
        SUM(minutes_played) AS total_minutes,
        SUM(yellow_cards) AS yellow_cards,
        SUM(red_cards) AS red_cards
    FROM player_stats
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    GROUP BY user_id
),
upcoming_matches AS (
    SELECT 
        tm.user_id,
        COUNT(DISTINCT m.id) AS upcoming_matches_count
    FROM team_members tm
    JOIN matches m ON (m.home_team_id = tm.team_id OR m.away_team_id = tm.team_id)
    WHERE tm.is_active = true
        AND m.status = 'scheduled'
        AND m.match_date > NOW()
    GROUP BY tm.user_id
)
SELECT 
    u.id AS user_id,
    COALESCE(u.full_name, u.email) AS display_name,
    u.profile_image_url AS avatar_url,
    u.position AS preferred_position,
    COALESCE(tsa.teams_joined, 0) AS teams_joined,
    COALESCE(tsa.leagues_participated, 0) AS leagues_participated,
    COALESCE(psa.matches_played, 0) AS matches_played,
    COALESCE(psa.goals_scored, 0) AS goals_scored,
    COALESCE(psa.assists, 0) AS assists,
    COALESCE(um.upcoming_matches_count, 0) AS upcoming_matches,
    COALESCE(tsa.avg_team_win_rate, 0) AS avg_team_win_rate,
    COALESCE(tsa.total_team_wins, 0) AS total_team_wins,
    COALESCE(tsa.total_team_games, 0) AS total_team_games
FROM users u
LEFT JOIN team_stats_agg tsa ON u.id = tsa.user_id
LEFT JOIN player_stats_agg psa ON u.id = psa.user_id
LEFT JOIN upcoming_matches um ON u.id = um.user_id;

-- =====================================================
-- FUNCTION: Get user's team statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_team_stats(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR,
    team_color VARCHAR,
    league_name VARCHAR,
    team_position VARCHAR,
    jersey_number INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    games_played INTEGER,
    win_rate NUMERIC,
    team_points INTEGER,
    goals_for INTEGER,
    goals_against INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pts.team_id,
        pts.team_name::VARCHAR,
        pts.team_color::VARCHAR,
        pts.league_name::VARCHAR,
        pts.team_position::VARCHAR,
        pts.jersey_number,
        pts.team_wins,
        pts.team_draws,
        pts.team_losses,
        pts.team_games_played,
        pts.team_win_rate,
        pts.team_points,
        pts.team_goals_for,
        pts.team_goals_against
    FROM player_team_stats pts
    WHERE pts.player_id = p_user_id
    ORDER BY pts.team_games_played DESC, pts.team_win_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate team contribution percentage
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_player_contribution(
    p_user_id UUID,
    p_team_id UUID,
    p_season_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    goals_contribution NUMERIC,
    assists_contribution NUMERIC,
    minutes_contribution NUMERIC,
    overall_contribution NUMERIC
) AS $$
DECLARE
    v_season_year INTEGER;
    v_player_goals INTEGER;
    v_player_assists INTEGER;
    v_player_minutes INTEGER;
    v_team_total_goals INTEGER;
    v_team_total_minutes INTEGER;
BEGIN
    v_season_year := COALESCE(p_season_year, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Get player stats
    SELECT 
        COALESCE(SUM(goals), 0),
        COALESCE(SUM(assists), 0),
        COALESCE(SUM(minutes_played), 0)
    INTO v_player_goals, v_player_assists, v_player_minutes
    FROM player_stats
    WHERE user_id = p_user_id 
        AND team_id = p_team_id
        AND EXTRACT(YEAR FROM created_at) = v_season_year;
    
    -- Get team totals
    SELECT 
        COALESCE(goals_for, 0),
        COALESCE(games_played * 90, 0) -- Assume 90 minutes per game
    INTO v_team_total_goals, v_team_total_minutes
    FROM team_stats
    WHERE team_id = p_team_id
        AND season_year = v_season_year;
    
    RETURN QUERY
    SELECT 
        CASE WHEN v_team_total_goals > 0 
            THEN ROUND((v_player_goals::NUMERIC / v_team_total_goals) * 100, 2)
            ELSE 0
        END AS goals_contribution,
        CASE WHEN v_team_total_goals > 0 
            THEN ROUND((v_player_assists::NUMERIC / v_team_total_goals) * 100, 2)
            ELSE 0
        END AS assists_contribution,
        CASE WHEN v_team_total_minutes > 0 
            THEN ROUND((v_player_minutes::NUMERIC / v_team_total_minutes) * 100, 2)
            ELSE 0
        END AS minutes_contribution,
        CASE WHEN v_team_total_goals > 0 
            THEN ROUND(((v_player_goals + v_player_assists)::NUMERIC / v_team_total_goals) * 100, 2)
            ELSE 0
        END AS overall_contribution;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT ON player_team_stats TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_team_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_player_contribution TO authenticated;