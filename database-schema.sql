-- MatchDay Database Schema
-- Comprehensive player-centric sports management system
-- Optimized for cross-league statistics, achievements, and real-time tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing objects if they exist (for clean re-deployment)
DROP VIEW IF EXISTS player_cross_league_stats CASCADE;
DROP VIEW IF EXISTS player_leaderboard CASCADE;
DROP VIEW IF EXISTS league_standings CASCADE;
DROP VIEW IF EXISTS active_matches CASCADE;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Extended user profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    preferred_position TEXT,
    bio TEXT,
    date_of_birth DATE,
    location TEXT,
    phone TEXT,
    emergency_contact JSONB, -- {name, phone, relationship}
    privacy_settings JSONB DEFAULT '{"show_stats": true, "show_teams": true, "show_achievements": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_display_name CHECK (LENGTH(display_name) >= 2 AND LENGTH(display_name) <= 50)
);

-- Pre-created leagues that players can discover and join
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'rugby')),
    league_type TEXT NOT NULL CHECK (league_type IN ('competitive', 'casual', 'tournament', 'friendly')),
    location TEXT,
    season_start DATE,
    season_end DATE,
    max_teams INTEGER CHECK (max_teams > 0 AND max_teams <= 32),
    entry_fee DECIMAL(10,2) CHECK (entry_fee >= 0),
    registration_deadline DATE,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Public leagues appear in discovery
    league_rules JSONB DEFAULT '{}', -- Custom rules and settings
    contact_info JSONB, -- {email, phone, website}
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_season CHECK (season_end IS NULL OR season_end >= season_start),
    CONSTRAINT valid_registration CHECK (registration_deadline IS NULL OR registration_deadline <= season_start)
);

-- Teams within leagues
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    team_color TEXT,
    captain_id UUID REFERENCES auth.users(id),
    max_players INTEGER DEFAULT 11 CHECK (max_players > 0),
    min_players INTEGER DEFAULT 7 CHECK (min_players > 0),
    is_recruiting BOOLEAN DEFAULT true,
    team_bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(league_id, name),
    CONSTRAINT valid_player_limits CHECK (max_players >= min_players)
);

-- Many-to-many relationship between users and teams
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position TEXT,
    jersey_number INTEGER CHECK (jersey_number > 0 AND jersey_number <= 99),
    is_active BOOLEAN DEFAULT true,
    is_starter BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, jersey_number) WHERE is_active = true,
    CONSTRAINT valid_membership_period CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Join requests for teams (players requesting to join teams)
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    preferred_position TEXT,
    requested_jersey_number INTEGER CHECK (requested_jersey_number > 0 AND requested_jersey_number <= 99),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    response_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    UNIQUE(team_id, user_id) WHERE status = 'pending',
    CONSTRAINT valid_review CHECK ((status = 'pending' AND reviewed_by IS NULL) OR (status != 'pending' AND reviewed_by IS NOT NULL))
);

-- Matches and fixtures
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    scheduled_date TIMESTAMPTZ NOT NULL,
    venue TEXT,
    match_day INTEGER, -- Week/round number
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'postponed', 'cancelled')),
    home_score INTEGER DEFAULT 0 CHECK (home_score >= 0),
    away_score INTEGER DEFAULT 0 CHECK (away_score >= 0),
    match_duration INTEGER, -- Actual match duration in minutes
    weather_conditions TEXT,
    referee TEXT,
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (home_team_id != away_team_id),
    CONSTRAINT valid_scores CHECK (
        (status IN ('scheduled', 'postponed', 'cancelled') AND home_score = 0 AND away_score = 0) OR
        (status IN ('live', 'completed'))
    )
);

-- Real-time match events for live tracking
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'injury', 'timeout', 'penalty', 'own_goal', 'save')),
    event_time INTEGER CHECK (event_time >= 0 AND event_time <= 200), -- Minutes, including extra time
    description TEXT,
    event_data JSONB DEFAULT '{}', -- Sport-specific event data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id), -- Who recorded this event
    
    CONSTRAINT valid_player_team CHECK (
        player_id IS NULL OR 
        team_id IS NULL OR 
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = player_id AND tm.team_id = match_events.team_id AND tm.is_active = true)
    )
);

-- Player statistics aggregated by league
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    
    -- Core stats
    games_played INTEGER DEFAULT 0 CHECK (games_played >= 0),
    games_started INTEGER DEFAULT 0 CHECK (games_started >= 0 AND games_started <= games_played),
    goals INTEGER DEFAULT 0 CHECK (goals >= 0),
    assists INTEGER DEFAULT 0 CHECK (assists >= 0),
    yellow_cards INTEGER DEFAULT 0 CHECK (yellow_cards >= 0),
    red_cards INTEGER DEFAULT 0 CHECK (red_cards >= 0),
    minutes_played INTEGER DEFAULT 0 CHECK (minutes_played >= 0),
    
    -- Performance metrics
    shots_on_target INTEGER DEFAULT 0 CHECK (shots_on_target >= 0),
    passes_completed INTEGER DEFAULT 0 CHECK (passes_completed >= 0),
    passes_attempted INTEGER DEFAULT 0 CHECK (passes_attempted >= passes_completed),
    tackles_won INTEGER DEFAULT 0 CHECK (tackles_won >= 0),
    
    -- Sport-specific additional stats
    additional_stats JSONB DEFAULT '{}',
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(player_id, league_id, team_id, season_year),
    CONSTRAINT valid_games_stats CHECK (games_started <= games_played)
);

-- Team statistics aggregated by league
CREATE TABLE IF NOT EXISTS team_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    
    -- Match results
    games_played INTEGER DEFAULT 0 CHECK (games_played >= 0),
    wins INTEGER DEFAULT 0 CHECK (wins >= 0),
    draws INTEGER DEFAULT 0 CHECK (draws >= 0),
    losses INTEGER DEFAULT 0 CHECK (losses >= 0),
    
    -- Scoring
    goals_for INTEGER DEFAULT 0 CHECK (goals_for >= 0),
    goals_against INTEGER DEFAULT 0 CHECK (goals_against >= 0),
    
    -- League points
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    
    -- Additional metrics
    clean_sheets INTEGER DEFAULT 0 CHECK (clean_sheets >= 0),
    biggest_win_margin INTEGER DEFAULT 0,
    biggest_loss_margin INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(team_id, league_id, season_year),
    CONSTRAINT valid_results CHECK (wins + draws + losses <= games_played)
);

-- Achievement definitions for gamification
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Icon identifier or URL
    category TEXT NOT NULL CHECK (category IN ('goals', 'assists', 'matches', 'team_play', 'consistency', 'milestones', 'leadership')),
    difficulty TEXT NOT NULL DEFAULT 'bronze' CHECK (difficulty IN ('bronze', 'silver', 'gold', 'platinum')),
    requirements JSONB NOT NULL, -- Conditions for earning the achievement
    points_value INTEGER DEFAULT 0 CHECK (points_value >= 0),
    is_active BOOLEAN DEFAULT true,
    is_repeatable BOOLEAN DEFAULT false, -- Can be earned multiple times
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_requirements CHECK (requirements IS NOT NULL AND requirements != '{}')
);

-- Player achievements (many-to-many with context)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB DEFAULT '{}', -- Additional context about how it was earned
    league_id UUID REFERENCES leagues(id), -- League where it was earned (if applicable)
    match_id UUID REFERENCES matches(id), -- Match where it was earned (if applicable)
    
    -- Allow repeatable achievements
    UNIQUE(user_id, achievement_id, earned_at) WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE id = achievement_id AND is_repeatable = true),
    UNIQUE(user_id, achievement_id) WHERE EXISTS (SELECT 1 FROM achievements WHERE id = achievement_id AND is_repeatable = false)
);

-- Application configuration
CREATE TABLE IF NOT EXISTS app_configurations (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether this config can be read by users
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- User profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles USING gin(display_name gin_trgm_ops);

-- League discovery and filtering
CREATE INDEX IF NOT EXISTS idx_leagues_active_public ON leagues(is_active, is_public, sport_type, league_type);
CREATE INDEX IF NOT EXISTS idx_leagues_location ON leagues USING gin(location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leagues_dates ON leagues(registration_deadline, season_start, season_end);

-- Team management
CREATE INDEX IF NOT EXISTS idx_teams_league_recruiting ON teams(league_id, is_recruiting);
CREATE INDEX IF NOT EXISTS idx_team_members_user_active ON team_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_team_active ON team_members(team_id, is_active);

-- Join requests
CREATE INDEX IF NOT EXISTS idx_join_requests_team_status ON team_join_requests(team_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_status ON team_join_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_expires ON team_join_requests(expires_at) WHERE status = 'pending';

-- Match queries
CREATE INDEX IF NOT EXISTS idx_matches_league_date ON matches(league_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status_date ON matches(status, scheduled_date);

-- Real-time events
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id, event_time);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id, event_type);

-- Statistics queries (optimized for leaderboards and cross-league comparisons)
CREATE INDEX IF NOT EXISTS idx_player_stats_league_performance ON player_stats(league_id, goals DESC, assists DESC, games_played DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_season ON player_stats(player_id, season_year, league_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_cross_league ON player_stats(player_id, season_year);
CREATE INDEX IF NOT EXISTS idx_team_stats_league_standings ON team_stats(league_id, points DESC, (goals_for - goals_against) DESC, goals_for DESC);

-- Achievement queries
CREATE INDEX IF NOT EXISTS idx_achievements_category_difficulty ON achievements(category, difficulty, is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id, earned_at DESC);

-- =============================================================================
-- EFFICIENT VIEWS FOR COMMON QUERIES
-- =============================================================================

-- League standings with position calculation
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
    t.logo_url,
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

-- Player leaderboard with performance metrics
CREATE VIEW player_leaderboard AS
SELECT 
    ps.id,
    ps.player_id,
    ps.league_id,
    ps.team_id,
    ps.season_year,
    ps.games_played,
    ps.games_started,
    ps.goals,
    ps.assists,
    ps.yellow_cards,
    ps.red_cards,
    ps.minutes_played,
    ps.shots_on_target,
    ps.passes_completed,
    ps.passes_attempted,
    ps.tackles_won,
    up.display_name,
    up.avatar_url,
    up.preferred_position,
    t.name as team_name,
    t.logo_url as team_logo,
    t.team_color,
    l.name as league_name,
    l.sport_type,
    -- Performance calculations
    CASE 
        WHEN ps.games_played > 0 THEN ROUND(ps.goals::DECIMAL / ps.games_played, 2)
        ELSE 0
    END as goals_per_game,
    CASE 
        WHEN ps.games_played > 0 THEN ROUND((ps.goals + ps.assists)::DECIMAL / ps.games_played, 2)
        ELSE 0
    END as goal_contributions_per_game,
    CASE 
        WHEN ps.minutes_played > 0 THEN ROUND((ps.goals * 90.0) / ps.minutes_played, 2)
        ELSE 0
    END as goals_per_90_minutes,
    CASE 
        WHEN ps.passes_attempted > 0 THEN ROUND((ps.passes_completed::DECIMAL / ps.passes_attempted) * 100, 1)
        ELSE 0
    END as pass_accuracy
FROM player_stats ps
JOIN user_profiles up ON ps.player_id = up.id
JOIN teams t ON ps.team_id = t.id
JOIN leagues l ON ps.league_id = l.id
WHERE l.is_active = true AND ps.games_played > 0;

-- Cross-league player statistics for comparisons
CREATE VIEW player_cross_league_stats AS
SELECT 
    ps.player_id,
    up.display_name,
    up.avatar_url,
    up.preferred_position,
    ps.season_year,
    COUNT(DISTINCT ps.league_id) as leagues_played,
    COUNT(DISTINCT ps.team_id) as teams_played,
    SUM(ps.games_played) as total_games_played,
    SUM(ps.goals) as total_goals,
    SUM(ps.assists) as total_assists,
    SUM(ps.minutes_played) as total_minutes_played,
    ROUND(AVG(ps.goals::DECIMAL / NULLIF(ps.games_played, 0)), 2) as avg_goals_per_game,
    ROUND(AVG((ps.goals + ps.assists)::DECIMAL / NULLIF(ps.games_played, 0)), 2) as avg_contributions_per_game,
    -- Best league performance
    MAX(ps.goals) as best_goals_in_league,
    MAX(ps.assists) as best_assists_in_league,
    -- Consistency metrics
    STDDEV(ps.goals::DECIMAL / NULLIF(ps.games_played, 0)) as goals_consistency
FROM player_stats ps
JOIN user_profiles up ON ps.player_id = up.id
WHERE ps.games_played > 0
GROUP BY ps.player_id, up.display_name, up.avatar_url, up.preferred_position, ps.season_year;

-- Active matches for real-time tracking
CREATE VIEW active_matches AS
SELECT 
    m.id,
    m.league_id,
    m.scheduled_date,
    m.venue,
    m.status,
    m.home_score,
    m.away_score,
    m.match_duration,
    l.name as league_name,
    l.sport_type,
    ht.id as home_team_id,
    ht.name as home_team_name,
    ht.logo_url as home_team_logo,
    ht.team_color as home_team_color,
    at.id as away_team_id,
    at.name as away_team_name,
    at.logo_url as away_team_logo,
    at.team_color as away_team_color,
    -- Recent events count
    (SELECT COUNT(*) FROM match_events me WHERE me.match_id = m.id) as total_events,
    -- Latest event
    (SELECT event_type FROM match_events me WHERE me.match_id = m.id ORDER BY me.event_time DESC, me.created_at DESC LIMIT 1) as latest_event_type,
    (SELECT event_time FROM match_events me WHERE me.match_id = m.id ORDER BY me.event_time DESC, me.created_at DESC LIMIT 1) as latest_event_time
FROM matches m
JOIN leagues l ON m.league_id = l.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE m.status IN ('live', 'scheduled') 
AND m.scheduled_date >= NOW() - INTERVAL '3 hours' -- Include recently started matches
ORDER BY 
    CASE m.status 
        WHEN 'live' THEN 1 
        WHEN 'scheduled' THEN 2 
    END,
    m.scheduled_date;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- User profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public user profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Leagues
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public active leagues" ON leagues FOR SELECT USING (is_public = true AND is_active = true);
CREATE POLICY "League creators can manage their leagues" ON leagues FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Authenticated users can create leagues" ON leagues FOR INSERT WITH CHECK (auth.uid() = created_by AND auth.uid() IS NOT NULL);

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams in public leagues" ON teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.is_public = true AND l.is_active = true)
);
CREATE POLICY "Team captains can manage their teams" ON teams FOR ALL USING (auth.uid() = captain_id);
CREATE POLICY "League creators can manage teams in their leagues" ON teams FOR ALL USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.created_by = auth.uid())
);

-- Team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team members of public teams" ON team_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM teams t 
        JOIN leagues l ON t.league_id = l.id 
        WHERE t.id = team_id AND l.is_public = true AND l.is_active = true
    )
);
CREATE POLICY "Team captains can manage team members" ON team_members FOR ALL USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND captain_id = auth.uid())
);
CREATE POLICY "Users can manage their own team memberships" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Team join requests
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own join requests" ON team_join_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Team captains can view requests for their teams" ON team_join_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND captain_id = auth.uid())
);
CREATE POLICY "Users can create join requests" ON team_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw their own requests" ON team_join_requests FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Team captains can respond to requests" ON team_join_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND captain_id = auth.uid())
);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view matches in public leagues" ON matches FOR SELECT USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.is_public = true AND l.is_active = true)
);
CREATE POLICY "League creators can manage matches" ON matches FOR ALL USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.created_by = auth.uid())
);

-- Match events
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view match events for public matches" ON match_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM matches m 
        JOIN leagues l ON m.league_id = l.id 
        WHERE m.id = match_id AND l.is_public = true AND l.is_active = true
    )
);
CREATE POLICY "League creators and team captains can create match events" ON match_events FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches m 
        JOIN leagues l ON m.league_id = l.id 
        WHERE m.id = match_id AND l.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM matches m 
        JOIN teams t ON (t.id = m.home_team_id OR t.id = m.away_team_id)
        WHERE m.id = match_id AND t.captain_id = auth.uid()
    )
);

-- Statistics
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stats for public leagues" ON player_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.is_public = true AND l.is_active = true)
);
CREATE POLICY "Anyone can view team stats for public leagues" ON team_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.is_public = true AND l.is_active = true)
);

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active achievements" ON achievements FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view user achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "System can award achievements" ON user_achievements FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- App configurations
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public configurations" ON app_configurations FOR SELECT USING (is_public = true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_stats_updated_at BEFORE UPDATE ON team_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old join requests
CREATE OR REPLACE FUNCTION expire_old_join_requests()
RETURNS void AS $$
BEGIN
    UPDATE team_join_requests 
    SET status = 'withdrawn'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Function to update team stats when match is completed
CREATE OR REPLACE FUNCTION update_team_stats_on_match_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if match status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Update home team stats
        INSERT INTO team_stats (team_id, league_id, season_year, games_played, wins, draws, losses, goals_for, goals_against, points)
        VALUES (
            NEW.home_team_id, 
            NEW.league_id, 
            EXTRACT(YEAR FROM NEW.scheduled_date),
            1,
            CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
            CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
            CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
            NEW.home_score,
            NEW.away_score,
            CASE 
                WHEN NEW.home_score > NEW.away_score THEN 3
                WHEN NEW.home_score = NEW.away_score THEN 1
                ELSE 0
            END
        )
        ON CONFLICT (team_id, league_id, season_year)
        DO UPDATE SET
            games_played = team_stats.games_played + 1,
            wins = team_stats.wins + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
            draws = team_stats.draws + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
            losses = team_stats.losses + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
            goals_for = team_stats.goals_for + NEW.home_score,
            goals_against = team_stats.goals_against + NEW.away_score,
            points = team_stats.points + CASE 
                WHEN NEW.home_score > NEW.away_score THEN 3
                WHEN NEW.home_score = NEW.away_score THEN 1
                ELSE 0
            END;

        -- Update away team stats
        INSERT INTO team_stats (team_id, league_id, season_year, games_played, wins, draws, losses, goals_for, goals_against, points)
        VALUES (
            NEW.away_team_id, 
            NEW.league_id, 
            EXTRACT(YEAR FROM NEW.scheduled_date),
            1,
            CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
            CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
            CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
            NEW.away_score,
            NEW.home_score,
            CASE 
                WHEN NEW.away_score > NEW.home_score THEN 3
                WHEN NEW.away_score = NEW.home_score THEN 1
                ELSE 0
            END
        )
        ON CONFLICT (team_id, league_id, season_year)
        DO UPDATE SET
            games_played = team_stats.games_played + 1,
            wins = team_stats.wins + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
            draws = team_stats.draws + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
            losses = team_stats.losses + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
            goals_for = team_stats.goals_for + NEW.away_score,
            goals_against = team_stats.goals_against + NEW.home_score,
            points = team_stats.points + CASE 
                WHEN NEW.away_score > NEW.home_score THEN 3
                WHEN NEW.away_score = NEW.home_score THEN 1
                ELSE 0
            END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_stats_on_match_completion
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_team_stats_on_match_completion();

-- =============================================================================
-- INITIAL DATA SETUP
-- =============================================================================

-- Insert default application configurations
INSERT INTO app_configurations (id, value, description, is_public) VALUES 
('scoring_rules', '{"win": 3, "draw": 1, "loss": 0}', 'Points awarded for match results', true),
('achievement_point_multipliers', '{"bronze": 1, "silver": 2, "gold": 5, "platinum": 10}', 'Point multipliers for achievement difficulties', false),
('league_settings', '{"max_teams_per_league": 32, "max_matches_per_season": 60, "default_match_duration": 90}', 'Default league operational settings', true),
('match_event_types', '["goal", "assist", "yellow_card", "red_card", "substitution", "injury", "timeout", "penalty", "own_goal", "save"]', 'Available match event types', true),
('sport_types', '["football", "basketball", "volleyball", "tennis", "badminton", "cricket", "rugby"]', 'Supported sport types', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample achievements for gamification
INSERT INTO achievements (name, description, icon, category, difficulty, requirements, points_value) VALUES 
('First Goal', 'Score your first goal', '⚽', 'goals', 'bronze', '{"goals": 1}', 10),
('Hat Trick Hero', 'Score 3 goals in a single match', '🎩', 'goals', 'gold', '{"goals_in_match": 3}', 100),
('Assist Master', 'Record 10 assists in a season', '🅰️', 'assists', 'silver', '{"assists": 10}', 50),
('Team Player', 'Play in 10 matches', '👥', 'matches', 'bronze', '{"matches_played": 10}', 25),
('Century Club', 'Play in 100 matches', '💯', 'matches', 'platinum', '{"matches_played": 100}', 500),
('Goal Machine', 'Score 20 goals in a season', '🔥', 'goals', 'gold', '{"goals": 20}', 200),
('Captain Fantastic', 'Captain a team to 5 wins', '👑', 'leadership', 'silver', '{"captain_wins": 5}', 75),
('Clean Sheet King', 'Keep 5 clean sheets as goalkeeper', '🧤', 'team_play', 'silver', '{"clean_sheets": 5}', 60)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =============================================================================

-- Enable real-time for live match tracking
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE team_join_requests;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profiles linked to Supabase Auth users';
COMMENT ON TABLE leagues IS 'Pre-created leagues that players can discover and join';
COMMENT ON TABLE teams IS 'Teams within leagues that players can join';
COMMENT ON TABLE team_members IS 'Many-to-many relationship between users and teams';
COMMENT ON TABLE team_join_requests IS 'Join requests from players wanting to join teams';
COMMENT ON TABLE matches IS 'Scheduled and completed matches between teams';
COMMENT ON TABLE match_events IS 'Real-time events that occur during matches';
COMMENT ON TABLE player_stats IS 'Player statistics aggregated by league and season';
COMMENT ON TABLE team_stats IS 'Team statistics aggregated by league and season';
COMMENT ON TABLE achievements IS 'Achievement definitions for gamification';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';

COMMENT ON VIEW league_standings IS 'League standings with calculated positions and statistics';
COMMENT ON VIEW player_leaderboard IS 'Player performance leaderboard with calculated metrics';
COMMENT ON VIEW player_cross_league_stats IS 'Cross-league player statistics for comparisons';
COMMENT ON VIEW active_matches IS 'Currently active or upcoming matches for real-time tracking';

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_league_standings_league_position ON league_standings(league_id, position);
CREATE INDEX IF NOT EXISTS idx_player_leaderboard_league_goals ON player_leaderboard(league_id, goals DESC);
CREATE INDEX IF NOT EXISTS idx_player_cross_league_total_goals ON player_cross_league_stats(total_goals DESC);