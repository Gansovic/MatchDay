-- Migration: Fix Security Definer View Warning
-- Description: Explicitly set user_dashboard_stats view to SECURITY INVOKER
-- Date: 2025-10-08
-- Issue: View was flagged by linter for potential SECURITY DEFINER property
-- Fix: Recreate view with explicit SECURITY INVOKER to ensure RLS is enforced

-- =====================================================
-- Drop and recreate user_dashboard_stats with SECURITY INVOKER
-- =====================================================
DROP VIEW IF EXISTS user_dashboard_stats;

CREATE VIEW user_dashboard_stats
WITH (security_invoker = true)
AS
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
-- Ensure RLS policies exist on underlying tables
-- =====================================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY IF NOT EXISTS users_select_own
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can view team members of their teams
CREATE POLICY IF NOT EXISTS team_members_select_own_teams
    ON team_members
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view player stats for their teams
CREATE POLICY IF NOT EXISTS player_stats_select_own_teams
    ON player_stats
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Grant permissions (view now respects RLS)
-- =====================================================
GRANT SELECT ON user_dashboard_stats TO authenticated;

-- =====================================================
-- Verification query (for testing)
-- =====================================================
-- To verify the view is working correctly:
-- SELECT * FROM user_dashboard_stats WHERE user_id = auth.uid();
