-- Create Seasons Table for Historical Season Management
-- Run Date: 2025-09-02

-- Create seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    max_teams INTEGER DEFAULT 20,
    registration_start DATE,
    registration_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT seasons_start_before_end CHECK (start_date < end_date),
    CONSTRAINT seasons_name_league_unique UNIQUE (name, league_id),
    CONSTRAINT seasons_one_current_per_league EXCLUDE USING gist (
        league_id WITH =, 
        is_current WITH = 
    ) WHERE (is_current = true)
);

-- Add season_id to existing tables
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

ALTER TABLE public.division_standings
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

ALTER TABLE public.division_fixtures
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Create player_stats table for seasonal statistics
CREATE TABLE IF NOT EXISTS public.player_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    matches_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0, -- For goalkeepers
    saves INTEGER DEFAULT 0, -- For goalkeepers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT player_stats_user_team_season_unique UNIQUE (user_id, team_id, season_id),
    CONSTRAINT player_stats_non_negative_values CHECK (
        matches_played >= 0 AND minutes_played >= 0 AND goals >= 0 AND 
        assists >= 0 AND yellow_cards >= 0 AND red_cards >= 0 AND
        clean_sheets >= 0 AND saves >= 0
    )
);

-- Create match_player_stats for individual match performance
CREATE TABLE IF NOT EXISTS public.match_player_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    is_starter BOOLEAN DEFAULT true,
    substitution_time INTEGER, -- Minute of substitution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT match_player_stats_user_match_unique UNIQUE (match_id, user_id),
    CONSTRAINT match_player_stats_non_negative_values CHECK (
        minutes_played >= 0 AND minutes_played <= 120 AND goals >= 0 AND 
        assists >= 0 AND yellow_cards >= 0 AND red_cards >= 0
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON public.seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_seasons_is_current ON public.seasons(is_current);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON public.seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON public.seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON public.matches(season_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON public.player_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season_id ON public.player_stats(season_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_match_id ON public.match_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_user_id ON public.match_player_stats(user_id);

-- Add updated_at triggers
CREATE TRIGGER handle_seasons_updated_at 
    BEFORE UPDATE ON public.seasons
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_player_stats_updated_at 
    BEFORE UPDATE ON public.player_stats
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

-- Seasons policies - anyone can view active seasons
CREATE POLICY "Anyone can view active seasons" ON public.seasons 
    FOR SELECT USING (is_active = true);

-- League admins can manage seasons
CREATE POLICY "League admins can manage seasons" ON public.seasons 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leagues 
            WHERE id = league_id AND created_by = auth.uid()
        )
    );

-- Player stats policies - anyone can view
CREATE POLICY "Anyone can view player stats" ON public.player_stats 
    FOR SELECT USING (true);

-- Users can view their own stats, league admins can manage all stats
CREATE POLICY "Users can view own stats, admins can manage" ON public.player_stats 
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.leagues 
            WHERE id = league_id AND created_by = auth.uid()
        )
    );

-- Match player stats policies - anyone can view
CREATE POLICY "Anyone can view match player stats" ON public.match_player_stats 
    FOR SELECT USING (true);

-- Users can view their own match stats, league admins can manage all
CREATE POLICY "Users can view own match stats, admins can manage" ON public.match_player_stats 
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.leagues l ON m.league_id = l.id
            WHERE m.id = match_id AND l.created_by = auth.uid()
        )
    );

-- Create the 2023 Season for myLeague
INSERT INTO public.seasons (
    id,
    name,
    display_name,
    league_id,
    start_date,
    end_date,
    is_current,
    is_active,
    description,
    max_teams,
    registration_start,
    registration_end
) VALUES (
    '2023-season-261f251e-aee8-4153-a4c7-537b565e7e3f',
    '2023',
    '2023 Season',
    '261f251e-aee8-4153-a4c7-537b565e7e3f', -- myLeague ID
    '2023-01-15',
    '2023-12-15',
    false, -- Not current (historical season)
    true,
    'The complete 2023 football season featuring 12 teams competing in a round-robin tournament over 22 rounds.',
    12,
    '2022-12-01',
    '2023-01-10'
) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.seasons IS 'Historical and current seasons for leagues';
COMMENT ON TABLE public.player_stats IS 'Aggregated player statistics per season';
COMMENT ON TABLE public.match_player_stats IS 'Individual match performance data for players';