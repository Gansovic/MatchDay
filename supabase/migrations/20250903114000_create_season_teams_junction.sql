-- Create season_teams junction table for team-season relationships
-- This replaces the direct league-team relationship with a more flexible season-based approach

CREATE TABLE IF NOT EXISTS season_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'withdrawn', 'suspended')),
  jersey_number_range VARCHAR(50), -- e.g., "1-23" for squad numbers
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a team can only be registered once per season
  CONSTRAINT unique_season_team UNIQUE(season_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX idx_season_teams_season_id ON season_teams(season_id);
CREATE INDEX idx_season_teams_team_id ON season_teams(team_id);
CREATE INDEX idx_season_teams_status ON season_teams(status);
CREATE INDEX idx_season_teams_registration_date ON season_teams(registration_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER season_teams_updated_at
    BEFORE UPDATE ON season_teams
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE season_teams IS 'Junction table managing team registrations for specific seasons';
COMMENT ON COLUMN season_teams.status IS 'Team status in the season: registered, active, withdrawn, suspended';
COMMENT ON COLUMN season_teams.jersey_number_range IS 'Range of jersey numbers allocated to this team for the season';

-- Migrate existing team-league relationships to season-team relationships
-- This will associate teams with the current/active season of their league
DO $$
DECLARE
    team_record RECORD;
    season_record RECORD;
BEGIN
    -- For each team that has a league association
    FOR team_record IN 
        SELECT DISTINCT t.id as team_id, t.league_id
        FROM teams t 
        WHERE t.league_id IS NOT NULL
    LOOP
        -- Find the current/active season for this league
        SELECT s.id INTO season_record
        FROM seasons s
        WHERE s.league_id = team_record.league_id
          AND (s.is_current = true OR s.status = 'active')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        -- If we found an active season, create the season_teams relationship
        IF season_record IS NOT NULL THEN
            INSERT INTO season_teams (season_id, team_id, status)
            VALUES (season_record, team_record.team_id, 'active')
            ON CONFLICT (season_id, team_id) DO NOTHING;
            
            RAISE NOTICE 'Migrated team % to season %', team_record.team_id, season_record;
        ELSE
            RAISE NOTICE 'No active season found for team % in league %', team_record.team_id, team_record.league_id;
        END IF;
    END LOOP;
END $$;