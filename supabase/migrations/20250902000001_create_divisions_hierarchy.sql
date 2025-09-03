-- Enhanced League Hierarchy Migration
-- Creates League → Division → Team → Match hierarchy
-- Run Date: 2025-09-02

-- Create division skill levels enum
CREATE TYPE division_skill_level AS ENUM (
    'beginner',
    'intermediate', 
    'advanced',
    'professional',
    'youth',
    'veterans'
);

-- Create divisions table
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    skill_level division_skill_level DEFAULT 'intermediate',
    min_teams INTEGER DEFAULT 4,
    max_teams INTEGER DEFAULT 16,
    current_teams INTEGER DEFAULT 0,
    max_players_per_team INTEGER DEFAULT 22,
    min_players_per_team INTEGER DEFAULT 11,
    is_active BOOLEAN DEFAULT true,
    registration_open BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    season_start TIMESTAMP WITH TIME ZONE,
    season_end TIMESTAMP WITH TIME ZONE,
    match_duration_minutes INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT divisions_min_max_teams_check CHECK (min_teams <= max_teams),
    CONSTRAINT divisions_min_max_players_check CHECK (min_players_per_team <= max_players_per_team),
    CONSTRAINT divisions_name_league_unique UNIQUE (name, league_id)
);

-- Create division standings table
CREATE TABLE IF NOT EXISTS public.division_standings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    position INTEGER,
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    UNIQUE(division_id, team_id),
    CONSTRAINT division_standings_points_check CHECK (points >= 0),
    CONSTRAINT division_standings_matches_check CHECK (matches_played >= 0),
    CONSTRAINT division_standings_wins_check CHECK (wins >= 0),
    CONSTRAINT division_standings_draws_check CHECK (draws >= 0),
    CONSTRAINT division_standings_losses_check CHECK (losses >= 0),
    CONSTRAINT division_standings_games_consistency CHECK (matches_played = wins + draws + losses)
);

-- Create match fixtures table for round-robin scheduling
CREATE TABLE IF NOT EXISTS public.division_fixtures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
    round_number INTEGER NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(200),
    is_scheduled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT division_fixtures_teams_different CHECK (home_team_id != away_team_id),
    CONSTRAINT division_fixtures_round_positive CHECK (round_number > 0)
);

-- Add division_id to existing tables
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL;

-- Update matches table to include division reference
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS round_number INTEGER,
ADD COLUMN IF NOT EXISTS fixture_id UUID REFERENCES public.division_fixtures(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_divisions_league_id ON public.divisions(league_id);
CREATE INDEX IF NOT EXISTS idx_divisions_skill_level ON public.divisions(skill_level);
CREATE INDEX IF NOT EXISTS idx_divisions_active ON public.divisions(is_active);
CREATE INDEX IF NOT EXISTS idx_division_standings_division_id ON public.division_standings(division_id);
CREATE INDEX IF NOT EXISTS idx_division_standings_position ON public.division_standings(position);
CREATE INDEX IF NOT EXISTS idx_division_fixtures_division_id ON public.division_fixtures(division_id);
CREATE INDEX IF NOT EXISTS idx_division_fixtures_round ON public.division_fixtures(round_number);
CREATE INDEX IF NOT EXISTS idx_teams_division_id ON public.teams(division_id);
CREATE INDEX IF NOT EXISTS idx_matches_division_id ON public.matches(division_id);

-- Update existing triggers for updated_at
CREATE TRIGGER handle_divisions_updated_at 
    BEFORE UPDATE ON public.divisions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_division_standings_updated_at 
    BEFORE UPDATE ON public.division_standings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to update current_teams count in divisions
CREATE OR REPLACE FUNCTION public.update_division_team_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_teams count for the affected division(s)
    IF TG_OP = 'DELETE' THEN
        UPDATE public.divisions 
        SET current_teams = (
            SELECT COUNT(*) 
            FROM public.teams 
            WHERE division_id = OLD.division_id AND is_active = true
        )
        WHERE id = OLD.division_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE public.divisions 
        SET current_teams = (
            SELECT COUNT(*) 
            FROM public.teams 
            WHERE division_id = NEW.division_id AND is_active = true
        )
        WHERE id = NEW.division_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle division change
        IF OLD.division_id IS DISTINCT FROM NEW.division_id THEN
            -- Update old division count
            IF OLD.division_id IS NOT NULL THEN
                UPDATE public.divisions 
                SET current_teams = (
                    SELECT COUNT(*) 
                    FROM public.teams 
                    WHERE division_id = OLD.division_id AND is_active = true
                )
                WHERE id = OLD.division_id;
            END IF;
            -- Update new division count
            IF NEW.division_id IS NOT NULL THEN
                UPDATE public.divisions 
                SET current_teams = (
                    SELECT COUNT(*) 
                    FROM public.teams 
                    WHERE division_id = NEW.division_id AND is_active = true
                )
                WHERE id = NEW.division_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain team count
CREATE TRIGGER update_division_team_count_trigger
    AFTER INSERT OR UPDATE OF division_id, is_active OR DELETE ON public.teams
    FOR EACH ROW EXECUTE PROCEDURE public.update_division_team_count();

-- Add RLS policies for divisions
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_fixtures ENABLE ROW LEVEL SECURITY;

-- Division policies - anyone can view active divisions
CREATE POLICY "Anyone can view active divisions" ON public.divisions 
    FOR SELECT USING (is_active = true);

-- League admins can manage divisions in their leagues
CREATE POLICY "League admins can manage divisions" ON public.divisions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leagues 
            WHERE id = league_id AND created_by = auth.uid()
        )
    );

-- Division standings - anyone can view
CREATE POLICY "Anyone can view division standings" ON public.division_standings 
    FOR SELECT USING (true);

-- League admins can update standings
CREATE POLICY "League admins can update standings" ON public.division_standings 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.divisions d
            JOIN public.leagues l ON d.league_id = l.id
            WHERE d.id = division_id AND l.created_by = auth.uid()
        )
    );

-- Division fixtures - anyone can view
CREATE POLICY "Anyone can view division fixtures" ON public.division_fixtures 
    FOR SELECT USING (true);

-- League admins can manage fixtures
CREATE POLICY "League admins can manage fixtures" ON public.division_fixtures 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.divisions d
            JOIN public.leagues l ON d.league_id = l.id
            WHERE d.id = division_id AND l.created_by = auth.uid()
        )
    );

-- Insert sample divisions for existing leagues
INSERT INTO public.divisions (id, name, description, league_id, skill_level, max_teams, season_start, season_end) 
VALUES 
    (
        'div-550e8400-e29b-41d4-a716-446655440001', 
        'Premier Division', 
        'Top tier competitive division', 
        '550e8400-e29b-41d4-a716-446655440001', 
        'professional', 
        12,
        '2024-09-01',
        '2024-12-31'
    ),
    (
        'div-550e8400-e29b-41d4-a716-446655440002', 
        'Championship Division', 
        'Second tier competitive division', 
        '550e8400-e29b-41d4-a716-446655440001', 
        'advanced', 
        14,
        '2024-09-01',
        '2024-12-31'
    ),
    (
        'div-6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a', 
        'Community Division', 
        'Friendly community division', 
        '6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a', 
        'intermediate', 
        16,
        '2024-10-01',
        '2024-11-30'
    )
ON CONFLICT (id) DO NOTHING;

-- Update existing teams to be in divisions
UPDATE public.teams 
SET division_id = 'div-550e8400-e29b-41d4-a716-446655440001'
WHERE league_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE public.teams 
SET division_id = 'div-6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a'
WHERE league_id = '6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a';

-- Initialize standings for teams in divisions
INSERT INTO public.division_standings (division_id, team_id)
SELECT DISTINCT t.division_id, t.id
FROM public.teams t
WHERE t.division_id IS NOT NULL AND t.is_active = true
ON CONFLICT (division_id, team_id) DO NOTHING;