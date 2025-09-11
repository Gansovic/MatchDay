-- Migration: Create Player Stats and Dashboard Views for Production
-- Date: 2025-01-10
-- Description: Creates player_stats table and aggregation views for multi-team player statistics

-- =====================================================
-- STEP 1: Create player_stats table
-- =====================================================
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, team_id, match_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON player_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_id ON player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_created_at ON player_stats(created_at);

-- =====================================================
-- STEP 2: Create player_team_stats view
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
    -- Player individual stats aggregated
    COALESCE(ps.total_goals, 0) AS player_goals,
    COALESCE(ps.total_assists, 0) AS player_assists,
    COALESCE(ps.total_minutes, 0) AS player_minutes,
    COALESCE(ps.total_yellow_cards, 0) AS player_yellow_cards,
    COALESCE(ps.total_red_cards, 0) AS player_red_cards,
    COALESCE(ps.matches_played, 0) AS player_matches_played
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
LEFT JOIN team_stats ts ON t.id = ts.team_id 
    AND ts.season_year = EXTRACT(YEAR FROM NOW())::INTEGER
LEFT JOIN leagues l ON t.league_id = l.id
LEFT JOIN (
    SELECT 
        user_id,
        team_id,
        COUNT(*) as matches_played,
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        SUM(minutes_played) as total_minutes,
        SUM(yellow_cards) as total_yellow_cards,
        SUM(red_cards) as total_red_cards
    FROM player_stats
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    GROUP BY user_id, team_id
) ps ON ps.user_id = tm.user_id AND ps.team_id = tm.team_id
WHERE tm.is_active = true;

-- =====================================================
-- STEP 3: Create user_dashboard_stats view
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
-- STEP 4: Create helper function for team stats
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
-- STEP 5: Grant permissions
-- =====================================================
-- Grant permissions for player_stats table
GRANT SELECT ON player_stats TO authenticated;
GRANT INSERT, UPDATE ON player_stats TO authenticated;

-- Grant permissions for views
GRANT SELECT ON player_team_stats TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;

-- Grant permissions for function
GRANT EXECUTE ON FUNCTION get_user_team_stats TO authenticated;

-- =====================================================
-- STEP 6: Enable Row Level Security
-- =====================================================
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats and stats from their teams
CREATE POLICY "Users can view relevant player stats" ON player_stats
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Only admins/captains can insert/update player stats
CREATE POLICY "Captains can manage team player stats" ON player_stats
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM teams WHERE captain_id = auth.uid()
        )
    );

CREATE POLICY "Captains can update team player stats" ON player_stats
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM teams WHERE captain_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 7: Create update trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_stats_updated_at
    BEFORE UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();