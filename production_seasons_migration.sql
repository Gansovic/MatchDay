-- ========================================================================
-- PRODUCTION SEASONS MIGRATION SCRIPT
-- Run this script in your Supabase SQL Editor for project: twkipeacdamypppxmmhe
-- ========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================
-- STEP 1: Create basic seasons table
-- ========================================================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),

  -- Constraints
  CONSTRAINT seasons_start_before_end CHECK (start_date < end_date),
  CONSTRAINT unique_season_name_per_league UNIQUE(name, league_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(season_year);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_is_current ON seasons(is_current);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);
CREATE UNIQUE INDEX IF NOT EXISTS seasons_name_league_unique ON seasons(name, league_id);

-- ========================================================================
-- STEP 2: Add missing columns to seasons table
-- ========================================================================

-- Add tournament format and competition settings
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS tournament_format VARCHAR(50) DEFAULT 'league'
    CHECK (tournament_format IN ('league', 'knockout', 'hybrid'));

-- Add registration and scheduling fields
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS registration_deadline DATE,
ADD COLUMN IF NOT EXISTS match_frequency INTEGER DEFAULT 1 CHECK (match_frequency > 0),
ADD COLUMN IF NOT EXISTS preferred_match_time TIME,
ADD COLUMN IF NOT EXISTS min_teams INTEGER DEFAULT 2 CHECK (min_teams >= 2);

-- Add competition structure
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS rounds INTEGER CHECK (rounds > 0),
ADD COLUMN IF NOT EXISTS total_matches_planned INTEGER DEFAULT 0 CHECK (total_matches_planned >= 0);

-- Add scoring rules
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS points_for_win INTEGER DEFAULT 3 CHECK (points_for_win >= 0),
ADD COLUMN IF NOT EXISTS points_for_draw INTEGER DEFAULT 1 CHECK (points_for_draw >= 0),
ADD COLUMN IF NOT EXISTS points_for_loss INTEGER DEFAULT 0 CHECK (points_for_loss >= 0),
ADD COLUMN IF NOT EXISTS allow_draws BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS home_away_balance BOOLEAN DEFAULT true;

-- Add fixture generation tracking
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS fixtures_status VARCHAR(50) DEFAULT 'pending'
    CHECK (fixtures_status IN ('pending', 'generating', 'completed', 'error')),
ADD COLUMN IF NOT EXISTS fixtures_generated_at TIMESTAMP WITH TIME ZONE;

-- Add JSON fields for flexible data storage
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add audit fields
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ========================================================================
-- STEP 3: Add season_id to matches table (if not exists)
-- ========================================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);

-- ========================================================================
-- STEP 4: Create season_teams junction table
-- ========================================================================
CREATE TABLE IF NOT EXISTS season_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_season_team_registration UNIQUE(season_id, team_id)
);

-- Indexes for season_teams
CREATE INDEX IF NOT EXISTS idx_season_teams_season_id ON season_teams(season_id);
CREATE INDEX IF NOT EXISTS idx_season_teams_team_id ON season_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_season_teams_status ON season_teams(status);

-- ========================================================================
-- STEP 5: Create season_standings table
-- ========================================================================
CREATE TABLE IF NOT EXISTS season_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Core standings data
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  points INTEGER GENERATED ALWAYS AS (wins * 3 + draws * 1) STORED,
  
  -- Additional statistics
  home_wins INTEGER DEFAULT 0,
  home_draws INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_draws INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  
  -- Form tracking (last 5 matches)
  recent_form VARCHAR(5) DEFAULT '', -- e.g., "WLDWW"
  
  -- Position tracking
  position INTEGER,
  previous_position INTEGER,
  position_change INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN previous_position IS NULL OR position IS NULL THEN 0
      ELSE previous_position - position
    END
  ) STORED,
  
  -- Metadata
  last_match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_season_team_standing UNIQUE(season_id, team_id),
  CONSTRAINT valid_matches_played CHECK (matches_played >= 0),
  CONSTRAINT valid_wins CHECK (wins >= 0),
  CONSTRAINT valid_draws CHECK (draws >= 0),
  CONSTRAINT valid_losses CHECK (losses >= 0),
  CONSTRAINT valid_goals_for CHECK (goals_for >= 0),
  CONSTRAINT valid_goals_against CHECK (goals_against >= 0),
  CONSTRAINT matches_total_check CHECK (matches_played = wins + draws + losses)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_season_standings_season_id ON season_standings(season_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_team_id ON season_standings(team_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_points ON season_standings(points DESC);
CREATE INDEX IF NOT EXISTS idx_season_standings_position ON season_standings(position);
CREATE INDEX IF NOT EXISTS idx_season_standings_goal_difference ON season_standings(goal_difference DESC);

-- Index for sorting by points, goal difference, goals for (common sorting criteria)
CREATE INDEX IF NOT EXISTS idx_season_standings_sort ON season_standings(season_id, points DESC, goal_difference DESC, goals_for DESC);

-- ========================================================================
-- STEP 6: Create updated_at triggers (if handle_updated_at function exists)
-- ========================================================================
DO $$
BEGIN
  -- Only create triggers if the handle_updated_at function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    -- Add updated_at trigger for seasons
    DROP TRIGGER IF EXISTS handle_seasons_updated_at ON seasons;
    CREATE TRIGGER handle_seasons_updated_at
        BEFORE UPDATE ON seasons
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
    
    -- Add updated_at trigger for season_teams
    DROP TRIGGER IF EXISTS handle_season_teams_updated_at ON season_teams;
    CREATE TRIGGER handle_season_teams_updated_at
        BEFORE UPDATE ON season_teams
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
    
    -- Add updated_at trigger for season_standings
    DROP TRIGGER IF EXISTS handle_season_standings_updated_at ON season_standings;
    CREATE TRIGGER handle_season_standings_updated_at
        BEFORE UPDATE ON season_standings
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
        
    RAISE NOTICE 'Updated_at triggers created successfully';
  ELSE
    RAISE NOTICE 'handle_updated_at function not found, skipping triggers';
  END IF;
END $$;

-- ========================================================================
-- STEP 7: Add helpful comments
-- ========================================================================
COMMENT ON TABLE seasons IS 'Season management table with comprehensive configuration options';
COMMENT ON COLUMN seasons.tournament_format IS 'Type of tournament: league (round-robin), knockout (elimination), or hybrid';
COMMENT ON COLUMN seasons.fixtures_status IS 'Status of fixture generation for this season';
COMMENT ON COLUMN seasons.registration_deadline IS 'Deadline for teams to register for this season';
COMMENT ON COLUMN seasons.rules IS 'Custom rules and regulations for this season';
COMMENT ON COLUMN seasons.settings IS 'Configuration settings for this season';
COMMENT ON COLUMN seasons.metadata IS 'Additional metadata and custom fields';

COMMENT ON TABLE season_teams IS 'Junction table linking teams to seasons with registration status';
COMMENT ON TABLE season_standings IS 'Season-based team standings with comprehensive statistics';
COMMENT ON COLUMN season_standings.goal_difference IS 'Automatically calculated as goals_for - goals_against';
COMMENT ON COLUMN season_standings.points IS 'Automatically calculated as wins * 3 + draws * 1';

-- ========================================================================
-- STEP 8: Create RLS policies (adjust as needed for your security requirements)
-- ========================================================================

-- Enable RLS on seasons table
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active seasons
DROP POLICY IF EXISTS "Anyone can view active seasons" ON seasons;
CREATE POLICY "Anyone can view active seasons" ON seasons
    FOR SELECT USING (is_active = true);

-- Policy: Authenticated users can manage seasons (adjust as needed)
DROP POLICY IF EXISTS "Authenticated users can manage seasons" ON seasons;
CREATE POLICY "Authenticated users can manage seasons" ON seasons
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Enable RLS on season_teams
ALTER TABLE season_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view season team registrations" ON season_teams;
CREATE POLICY "Anyone can view season team registrations" ON season_teams
    FOR SELECT USING (true);

-- Enable RLS on season_standings  
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view season standings" ON season_standings;
CREATE POLICY "Anyone can view season standings" ON season_standings
    FOR SELECT USING (true);

-- ========================================================================
-- FINAL SUCCESS MESSAGE
-- ========================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEASONS MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- seasons (with 35+ columns)';
    RAISE NOTICE '- season_teams (junction table)';
    RAISE NOTICE '- season_standings (standings system)';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns added:';
    RAISE NOTICE '- matches.season_id (linked to seasons)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create seasons for your myLeague';
    RAISE NOTICE '2. Link existing teams to seasons';
    RAISE NOTICE '3. Update matches with season references';
    RAISE NOTICE '========================================';
END $$;