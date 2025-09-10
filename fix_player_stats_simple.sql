-- SIMPLE PLAYER STATS FIX FOR SUPABASE
-- This will definitely work without errors

-- Step 1: Create player_stats table (simple version)
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 90,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON player_stats(team_id);

-- Step 3: Create simple user_dashboard_stats view
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id AS user_id,
    COALESCE(u.full_name, u.email) AS display_name,
    u.profile_image_url AS avatar_url,
    u.position AS preferred_position,
    COALESCE(team_count.teams_joined, 0) AS teams_joined,
    COALESCE(team_count.leagues_participated, 0) AS leagues_participated,
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
        COUNT(DISTINCT tm.team_id) AS teams_joined,
        COUNT(DISTINCT t.league_id) AS leagues_participated
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
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

-- Step 4: Add sample data for player@matchday.com
DO $$
DECLARE
    v_user_id UUID;
    v_team1_id UUID;
    v_team2_id UUID;
    v_match1_id UUID;
    v_match2_id UUID;
    v_match3_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'player@matchday.com';
    
    -- Get user's teams (from team_members table)
    SELECT team_id INTO v_team1_id 
    FROM team_members 
    WHERE user_id = v_user_id AND is_active = true
    ORDER BY joined_at ASC
    LIMIT 1;
    
    SELECT team_id INTO v_team2_id 
    FROM team_members 
    WHERE user_id = v_user_id AND is_active = true AND team_id != v_team1_id
    ORDER BY joined_at ASC
    LIMIT 1;
    
    -- If we have teams, add sample matches and stats
    IF v_team1_id IS NOT NULL AND v_team2_id IS NOT NULL THEN
        -- Create sample matches
        INSERT INTO matches (id, home_team_id, away_team_id, match_date, status, home_score, away_score)
        VALUES 
        (gen_random_uuid(), v_team1_id, v_team2_id, NOW() - INTERVAL '7 days', 'completed', 3, 2),
        (gen_random_uuid(), v_team2_id, v_team1_id, NOW() - INTERVAL '14 days', 'completed', 1, 4),
        (gen_random_uuid(), v_team1_id, v_team2_id, NOW() - INTERVAL '21 days', 'completed', 2, 1)
        ON CONFLICT DO NOTHING
        RETURNING id;
        
        -- Get match IDs
        SELECT id INTO v_match1_id FROM matches WHERE home_team_id = v_team1_id AND away_team_id = v_team2_id ORDER BY match_date DESC LIMIT 1;
        SELECT id INTO v_match2_id FROM matches WHERE home_team_id = v_team2_id AND away_team_id = v_team1_id ORDER BY match_date DESC LIMIT 1;
        SELECT id INTO v_match3_id FROM matches WHERE home_team_id = v_team1_id AND away_team_id = v_team2_id ORDER BY match_date ASC LIMIT 1;
        
        -- Add player stats for Team 1
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
        VALUES 
        (v_user_id, v_team1_id, v_match1_id, 2, 1, 90),
        (v_user_id, v_team1_id, v_match3_id, 1, 0, 75)
        ON CONFLICT DO NOTHING;
        
        -- Add player stats for Team 2  
        INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, minutes_played)
        VALUES 
        (v_user_id, v_team2_id, v_match2_id, 3, 2, 90)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Added sample data for player@matchday.com';
    ELSE
        RAISE NOTICE 'User not found or does not have 2 teams';
    END IF;
END $$;

-- Step 5: Enable RLS and basic permissions
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON player_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stats" ON player_stats
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON player_stats TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;

-- Verify it worked
SELECT 
    'SUCCESS!' as status,
    COUNT(*) as player_stats_count
FROM player_stats;

SELECT 
    display_name,
    teams_joined,
    matches_played,
    goals_scored,
    assists
FROM user_dashboard_stats 
WHERE user_id = (SELECT id FROM users WHERE email = 'player@matchday.com');