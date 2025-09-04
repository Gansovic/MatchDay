-- Add missing columns to seasons table to match SeasonService interface
-- This migration adds all columns expected by the application that are missing from the current schema

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
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seasons_tournament_format ON seasons(tournament_format);
CREATE INDEX IF NOT EXISTS idx_seasons_fixtures_status ON seasons(fixtures_status);
CREATE INDEX IF NOT EXISTS idx_seasons_registration_deadline ON seasons(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_seasons_min_max_teams ON seasons(min_teams, max_teams);

-- Add helpful comments
COMMENT ON COLUMN seasons.tournament_format IS 'Type of tournament: league (round-robin), knockout (elimination), or hybrid';
COMMENT ON COLUMN seasons.fixtures_status IS 'Status of fixture generation for this season';
COMMENT ON COLUMN seasons.registration_deadline IS 'Deadline for teams to register for this season';
COMMENT ON COLUMN seasons.match_frequency IS 'Number of matches per time period';
COMMENT ON COLUMN seasons.preferred_match_time IS 'Preferred time for matches to be scheduled';
COMMENT ON COLUMN seasons.rules IS 'Custom rules and regulations for this season';
COMMENT ON COLUMN seasons.settings IS 'Configuration settings for this season';
COMMENT ON COLUMN seasons.metadata IS 'Additional metadata and custom fields';

-- Update RLS policies to include new audit columns
DROP POLICY IF EXISTS "League admins can manage seasons" ON seasons;
CREATE POLICY "League admins can manage seasons" ON seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = seasons.league_id 
            AND (leagues.created_by = auth.uid() OR auth.uid() IN (
                -- Add logic for league admins/moderators if needed
                SELECT auth.uid()
            ))
        )
    );

-- Add constraint to ensure registration deadline is before season start
ALTER TABLE seasons 
ADD CONSTRAINT seasons_registration_before_start 
    CHECK (registration_deadline IS NULL OR registration_deadline <= start_date);

-- Add constraint to ensure min_teams <= max_teams
ALTER TABLE seasons 
ADD CONSTRAINT seasons_min_max_teams_check 
    CHECK (min_teams IS NULL OR max_teams IS NULL OR min_teams <= max_teams);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added missing columns to seasons table';
    RAISE NOTICE 'Added columns: tournament_format, registration_deadline, match_frequency, preferred_match_time';
    RAISE NOTICE 'Added columns: min_teams, rounds, scoring rules, fixtures tracking';
    RAISE NOTICE 'Added JSON fields: rules, settings, metadata';
    RAISE NOTICE 'Added audit fields: created_by, updated_by';
    RAISE NOTICE 'Seasons table now matches SeasonService interface requirements';
END $$;