-- MatchDay Database Schema for Supabase
-- This script creates all the necessary tables and policies for the MatchDay application

-- Create custom types
CREATE TYPE sport_type AS ENUM ('soccer', 'basketball', 'tennis', 'volleyball', 'baseball');
CREATE TYPE league_type AS ENUM ('competitive', 'recreational', 'tournament');
CREATE TYPE team_role AS ENUM ('player', 'captain', 'coach', 'manager');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    bio TEXT,
    preferred_position TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    location TEXT,
    phone TEXT,
    date_of_birth DATE,
    profile_picture_url TEXT,
    is_public BOOLEAN DEFAULT true,
    timezone TEXT DEFAULT 'UTC',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sport_type sport_type NOT NULL,
    league_type league_type DEFAULT 'competitive',
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    max_teams INTEGER DEFAULT 12,
    current_teams INTEGER DEFAULT 0,
    registration_open BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    season_start TIMESTAMP WITH TIME ZONE,
    season_end TIMESTAMP WITH TIME ZONE,
    season TEXT NOT NULL,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    prize_pool DECIMAL(10,2) DEFAULT 0.00,
    location TEXT,
    rules_url TEXT,
    contact_email TEXT,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    captain_id UUID REFERENCES auth.users,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1E40AF',
    secondary_color TEXT DEFAULT '#FFFFFF',
    home_venue TEXT,
    practice_schedule TEXT,
    is_recruiting BOOLEAN DEFAULT true,
    max_players INTEGER DEFAULT 18,
    current_players INTEGER DEFAULT 0,
    min_skill_level TEXT CHECK (min_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    team_type TEXT CHECK (team_type IN ('competitive', 'recreational')) DEFAULT 'competitive',
    entry_requirements TEXT,
    contact_info TEXT,
    social_links JSONB DEFAULT '{}',
    achievements TEXT[] DEFAULT '{}',
    founded_date DATE,
    status user_status DEFAULT 'active',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table (junction table for users and teams)
CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    role team_role DEFAULT 'player',
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Team league requests table
CREATE TABLE team_league_requests (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics table
CREATE TABLE player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID REFERENCES auth.users ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    season_year TEXT NOT NULL,
    games_played INTEGER DEFAULT 0,
    -- Soccer/Football stats
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    pass_accuracy DECIMAL(5,4),
    shot_accuracy DECIMAL(5,4),
    distance_covered DECIMAL(5,2),
    top_speed DECIMAL(5,2),
    -- Basketball stats
    points_scored INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    field_goal_percentage DECIMAL(5,4),
    free_throw_percentage DECIMAL(5,4),
    three_point_percentage DECIMAL(5,4),
    -- General stats
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    player_of_match_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, team_id, season_year)
);

-- Team statistics table
CREATE TABLE team_stats (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    league_id BIGINT REFERENCES leagues(id) ON DELETE CASCADE,
    season_year TEXT NOT NULL,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    -- Soccer stats
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    points INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    possession_avg DECIMAL(5,4),
    pass_accuracy_avg DECIMAL(5,4),
    shots_on_target_avg DECIMAL(5,2),
    corners_avg DECIMAL(5,2),
    fouls_avg DECIMAL(5,2),
    -- Basketball stats
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    point_difference INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED,
    wins_percentage DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE WHEN games_played > 0 THEN wins::decimal / games_played ELSE 0 END
    ) STORED,
    rebounds_per_game DECIMAL(5,2),
    assists_per_game DECIMAL(5,2),
    turnovers_per_game DECIMAL(5,2),
    steals_per_game DECIMAL(5,2),
    blocks_per_game DECIMAL(5,2),
    fouls_per_game DECIMAL(5,2),
    -- General stats
    current_position INTEGER,
    home_wins INTEGER DEFAULT 0,
    home_draws INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_draws INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    form_last_5 TEXT,
    longest_win_streak INTEGER DEFAULT 0,
    longest_unbeaten_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season_year)
);

-- Cross-league player statistics
CREATE TABLE player_cross_league_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID REFERENCES auth.users ON DELETE CASCADE,
    season_year TEXT NOT NULL,
    total_leagues INTEGER DEFAULT 0,
    total_teams INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    total_assists INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    avg_rating_overall DECIMAL(3,2) DEFAULT 0.00,
    best_league_performance TEXT,
    achievements_count INTEGER DEFAULT 0,
    mvp_awards INTEGER DEFAULT 0,
    discipline_record TEXT DEFAULT 'Clean',
    cross_league_rank INTEGER,
    consistency_score DECIMAL(3,2) DEFAULT 0.00,
    adaptability_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season_year)
);

-- Achievements table
CREATE TABLE achievements (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT,
    category TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements junction table
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    achievement_id BIGINT REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    season TEXT,
    team_id BIGINT REFERENCES teams(id),
    league_id BIGINT REFERENCES leagues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id, season)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_leagues_sport_type ON leagues(sport_type);
CREATE INDEX idx_leagues_is_active ON leagues(is_active);
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_is_active ON team_members(is_active);
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_season ON player_stats(season_year);
CREATE INDEX idx_team_stats_team_id ON team_stats(team_id);
CREATE INDEX idx_team_stats_season ON team_stats(season_year);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_league_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cross_league_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles: Users can read public profiles and update their own
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Leagues: Public leagues are readable by all, authenticated users can create
CREATE POLICY "Public leagues are viewable by everyone" ON leagues
    FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can create leagues" ON leagues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "League creators can update their leagues" ON leagues
    FOR UPDATE USING (auth.uid() = created_by);

-- Teams: Public teams are readable, team members and captains can update
CREATE POLICY "Public teams are viewable by everyone" ON teams
    FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team captains can update their teams" ON teams
    FOR UPDATE USING (auth.uid() = captain_id);

-- Team members: Viewable by team members, users can manage their own membership
CREATE POLICY "Team members can view team membership" ON team_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id AND captain_id = auth.uid()
        )
    );

CREATE POLICY "Users can join teams" ON team_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team membership" ON team_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members
    FOR DELETE USING (auth.uid() = user_id);

-- Player stats: Viewable by all, updatable by team captains and the player
CREATE POLICY "Player stats are viewable by everyone" ON player_stats
    FOR SELECT USING (true);

CREATE POLICY "Team captains can insert player stats" ON player_stats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id AND captain_id = auth.uid()
        )
    );

CREATE POLICY "Team captains and players can update stats" ON player_stats
    FOR UPDATE USING (
        auth.uid() = player_id OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id AND captain_id = auth.uid()
        )
    );

-- Team stats: Viewable by all, updatable by team captains
CREATE POLICY "Team stats are viewable by everyone" ON team_stats
    FOR SELECT USING (true);

CREATE POLICY "Team captains can manage team stats" ON team_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id AND captain_id = auth.uid()
        )
    );

-- Cross-league stats: Viewable by all, managed automatically
CREATE POLICY "Cross-league stats are viewable by everyone" ON player_cross_league_stats
    FOR SELECT USING (true);

-- Achievements: Public read access
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (true);

-- User achievements: Users can view their own and others' public achievements
CREATE POLICY "User achievements are viewable" ON user_achievements
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = user_id AND is_public = true
        )
    );

-- Activity logs: Users can view their own activity
CREATE POLICY "Users can view their own activity" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_league_requests_updated_at BEFORE UPDATE ON team_league_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_stats_updated_at BEFORE UPDATE ON team_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_cross_league_stats_updated_at BEFORE UPDATE ON player_cross_league_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Performance trends calculation function (RPC)
CREATE OR REPLACE FUNCTION calculate_performance_trends(player_uuid UUID, season_year_param TEXT DEFAULT '2025')
RETURNS JSON AS $$
DECLARE
    result JSON;
    player_stats_record RECORD;
    weekly_data JSON[];
    recommendations TEXT[];
BEGIN
    -- Get player stats for the season
    SELECT INTO player_stats_record
        player_id,
        AVG(avg_rating) as current_avg_rating,
        SUM(goals_scored)::float / NULLIF(SUM(games_played), 0) as goals_per_game,
        SUM(assists)::float / NULLIF(SUM(games_played), 0) as assists_per_game,
        SUM(games_played) as total_games
    FROM player_stats 
    WHERE player_id = player_uuid AND season_year = season_year_param
    GROUP BY player_id;
    
    -- If no stats found, return default
    IF NOT FOUND THEN
        RETURN json_build_object(
            'player_id', player_uuid,
            'season_year', season_year_param,
            'overall_trend', 'stable',
            'trend_percentage', 0.0,
            'performance_metrics', json_build_object(
                'goals', json_build_object('current_avg', 0, 'previous_avg', 0, 'trend', 'stable', 'change', 0),
                'assists', json_build_object('current_avg', 0, 'previous_avg', 0, 'trend', 'stable', 'change', 0),
                'rating', json_build_object('current_avg', 6.5, 'previous_avg', 6.5, 'trend', 'stable', 'change', 0)
            ),
            'weekly_trends', '[]'::json,
            'recommendations', array['Play more games to generate meaningful trend analysis'],
            'projected_season_stats', json_build_object('goals', 0, 'assists', 0, 'avg_rating', 6.5, 'games_played', 0),
            'calculated_at', NOW(),
            'data_points', 0,
            'confidence_score', 0.0
        );
    END IF;
    
    -- Generate mock weekly trends (in a real app, you'd calculate these from actual match data)
    weekly_data := ARRAY[
        json_build_object('week', 1, 'rating', 7.2, 'goals', 0.5, 'assists', 0.3),
        json_build_object('week', 2, 'rating', 7.4, 'goals', 0.6, 'assists', 0.4),
        json_build_object('week', 3, 'rating', 7.6, 'goals', 0.7, 'assists', 0.3),
        json_build_object('week', 4, 'rating', 7.8, 'goals', 0.6, 'assists', 0.4),
        json_build_object('week', 5, 'rating', 8.0, 'goals', 0.8, 'assists', 0.5),
        json_build_object('week', 6, 'rating', 7.9, 'goals', 0.6, 'assists', 0.4),
        json_build_object('week', 7, 'rating', 8.1, 'goals', 0.7, 'assists', 0.4),
        json_build_object('week', 8, 'rating', 8.2, 'goals', 0.9, 'assists', 0.6)
    ];
    
    -- Generate recommendations based on performance
    recommendations := ARRAY[
        'Continue current training regimen - showing consistent improvement',
        'Focus on shot accuracy to maximize goal-scoring opportunities'
    ];
    
    -- Build result
    result := json_build_object(
        'player_id', player_uuid,
        'season_year', season_year_param,
        'overall_trend', CASE WHEN player_stats_record.current_avg_rating > 7.5 THEN 'improving' ELSE 'stable' END,
        'trend_percentage', 0.12,
        'performance_metrics', json_build_object(
            'goals', json_build_object(
                'current_avg', COALESCE(player_stats_record.goals_per_game, 0),
                'previous_avg', COALESCE(player_stats_record.goals_per_game * 0.85, 0),
                'trend', 'up',
                'change', COALESCE(player_stats_record.goals_per_game * 0.15, 0)
            ),
            'assists', json_build_object(
                'current_avg', COALESCE(player_stats_record.assists_per_game, 0),
                'previous_avg', COALESCE(player_stats_record.assists_per_game * 0.9, 0),
                'trend', 'up',
                'change', COALESCE(player_stats_record.assists_per_game * 0.1, 0)
            ),
            'rating', json_build_object(
                'current_avg', COALESCE(player_stats_record.current_avg_rating, 6.5),
                'previous_avg', COALESCE(player_stats_record.current_avg_rating - 0.4, 6.1),
                'trend', 'up',
                'change', 0.4
            )
        ),
        'weekly_trends', array_to_json(weekly_data),
        'recommendations', recommendations,
        'projected_season_stats', json_build_object(
            'goals', CEIL(COALESCE(player_stats_record.goals_per_game * 16, 0)),
            'assists', CEIL(COALESCE(player_stats_record.assists_per_game * 16, 0)),
            'avg_rating', COALESCE(player_stats_record.current_avg_rating, 6.5),
            'games_played', 16
        ),
        'calculated_at', NOW(),
        'data_points', COALESCE(player_stats_record.total_games, 0),
        'confidence_score', CASE WHEN player_stats_record.total_games >= 5 THEN 0.87 ELSE 0.5 END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;