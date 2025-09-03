-- Create Seasons Table (Simplified)
-- This creates a basic seasons table without complex constraints

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    season_year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'draft',
    description TEXT,
    max_teams INTEGER DEFAULT 20,
    registration_start DATE,
    registration_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT seasons_start_before_end CHECK (start_date < end_date),
    CONSTRAINT seasons_name_league_unique UNIQUE (name, league_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON public.seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_seasons_is_current ON public.seasons(is_current);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON public.seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON public.seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON public.seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON public.seasons(season_year);

-- Add updated_at trigger
CREATE TRIGGER handle_seasons_updated_at 
    BEFORE UPDATE ON public.seasons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active seasons" ON public.seasons 
    FOR SELECT USING (is_active = true);

CREATE POLICY "League admins can manage seasons" ON public.seasons 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leagues 
            WHERE id = league_id
        )
    );

COMMENT ON TABLE public.seasons IS 'Seasons for leagues with simplified structure';