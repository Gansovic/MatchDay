-- MINIMAL FIX - Only create what's missing
-- Just the essentials for player stats

-- 1. Create player_stats table ONLY if it doesn't exist
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_stats') THEN
        -- Create the table
        CREATE TABLE player_stats (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
            match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
            goals INTEGER DEFAULT 0,
            assists INTEGER DEFAULT 0,
            minutes_played INTEGER DEFAULT 90,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX idx_player_stats_user_id ON player_stats(user_id);
        CREATE INDEX idx_player_stats_team_id ON player_stats(team_id);
        
        -- Enable RLS
        ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
        
        -- Add basic policy
        CREATE POLICY "Users can view their own stats" ON player_stats
            FOR SELECT USING (user_id = auth.uid());
            
        RAISE NOTICE 'Created player_stats table';
    ELSE
        RAISE NOTICE 'player_stats table already exists';
    END IF;
END $$;

-- 2. Create user_dashboard_stats view
DROP VIEW IF EXISTS user_dashboard_stats;
CREATE VIEW user_dashboard_stats AS
SELECT 
    u.id AS user_id,
    COALESCE(u.full_name, u.email) AS display_name,
    u.profile_image_url AS avatar_url,
    u.position AS preferred_position,
    COALESCE(team_count.teams_joined, 0) AS teams_joined,
    0 AS leagues_participated,
    COALESCE(player_agg.matches_played, 0) AS matches_played,
    COALESCE(player_agg.goals_scored, 0) AS goals_scored,
    COALESCE(player_agg.assists, 0) AS assists,
    0 AS upcoming_matches,
    COALESCE(team_agg.avg_team_win_rate, 0) AS avg_team_win_rate,
    COALESCE(team_agg.total_team_wins, 0) AS total_team_wins,
    COALESCE(team_agg.total_team_games, 0) AS total_team_games
FROM users u
LEFT JOIN (
    SELECT 
        tm.user_id,
        COUNT(DISTINCT tm.team_id) AS teams_joined
    FROM team_members tm
    WHERE tm.is_active = true
    GROUP BY tm.user_id
) team_count ON u.id = team_count.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) AS matches_played,
        SUM(goals) AS goals_scored,
        SUM(assists) AS assists
    FROM player_stats
    GROUP BY user_id
) player_agg ON u.id = player_agg.user_id
LEFT JOIN (
    SELECT 
        tm.user_id,
        AVG(CASE 
            WHEN ts.games_played > 0 THEN (ts.wins::NUMERIC / ts.games_played) * 100
            ELSE 0
        END) AS avg_team_win_rate,
        SUM(ts.wins) AS total_team_wins,
        SUM(ts.games_played) AS total_team_games
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    LEFT JOIN team_stats ts ON t.id = ts.team_id
    WHERE tm.is_active = true
    GROUP BY tm.user_id
) team_agg ON u.id = team_agg.user_id;

-- 3. Add sample data for player@matchday.com
DO $$
DECLARE
    v_user_id UUID;
    v_team1_id UUID;
    v_team2_id UUID;
    v_match_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'player@matchday.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Get user's teams
        SELECT team_id INTO v_team1_id 
        FROM team_members 
        WHERE user_id = v_user_id AND is_active = true
        LIMIT 1;
        
        SELECT team_id INTO v_team2_id 
        FROM team_members 
        WHERE user_id = v_user_id AND is_active = true AND team_id != v_team1_id
        LIMIT 1;
        
        IF v_team1_id IS NOT NULL THEN
            -- Create sample match
            INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
            VALUES (gen_random_uuid(), v_team1_id, COALESCE(v_team2_id, v_team1_id), NOW() - INTERVAL '7 days', 'completed', 3, 2)
            ON CONFLICT DO NOTHING
            RETURNING id INTO v_match_id;
            
            -- Add sample player stats
            INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
            VALUES 
            (v_user_id, v_team1_id, v_match_id, 2, 1, 90),
            (v_user_id, v_team1_id, gen_random_uuid(), 1, 2, 85),
            (v_user_id, COALESCE(v_team2_id, v_team1_id), gen_random_uuid(), 3, 0, 90)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Added sample data for player@matchday.com';
        END IF;
    END IF;
END $$;

-- 4. Test query
SELECT 
    'TABLES CREATED!' as status,
    (SELECT COUNT(*) FROM player_stats) as player_stats_count,
    (SELECT COUNT(*) FROM user_dashboard_stats WHERE user_id = (SELECT id FROM users WHERE email = 'player@matchday.com')) as dashboard_view_working;