-- Create season_standings table to replace league_standings
-- This provides proper season-based standings management

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
CREATE INDEX idx_season_standings_season_id ON season_standings(season_id);
CREATE INDEX idx_season_standings_team_id ON season_standings(team_id);
CREATE INDEX idx_season_standings_points ON season_standings(points DESC);
CREATE INDEX idx_season_standings_position ON season_standings(position);
CREATE INDEX idx_season_standings_goal_difference ON season_standings(goal_difference DESC);

-- Index for sorting by points, goal difference, goals for (common sorting criteria)
CREATE INDEX idx_season_standings_sort ON season_standings(season_id, points DESC, goal_difference DESC, goals_for DESC);

-- Add updated_at trigger
CREATE TRIGGER season_standings_updated_at
    BEFORE UPDATE ON season_standings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE season_standings IS 'Season-based team standings with comprehensive statistics';
COMMENT ON COLUMN season_standings.goal_difference IS 'Automatically calculated as goals_for - goals_against';
COMMENT ON COLUMN season_standings.points IS 'Automatically calculated as wins * 3 + draws * 1';
COMMENT ON COLUMN season_standings.position_change IS 'Change in position from previous update (+ = moved up, - = moved down)';
COMMENT ON COLUMN season_standings.recent_form IS 'Last 5 match results as string (W/D/L)';

-- Function to update standings based on match results
CREATE OR REPLACE FUNCTION update_season_standings()
RETURNS TRIGGER AS $$
DECLARE
    home_team_standing RECORD;
    away_team_standing RECORD;
BEGIN
    -- Only process if match is completed and has a season_id
    IF NEW.status != 'completed' OR NEW.season_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get or create standings for home team
    INSERT INTO season_standings (season_id, team_id)
    VALUES (NEW.season_id, NEW.home_team_id)
    ON CONFLICT (season_id, team_id) DO NOTHING;
    
    -- Get or create standings for away team  
    INSERT INTO season_standings (season_id, team_id)
    VALUES (NEW.season_id, NEW.away_team_id)
    ON CONFLICT (season_id, team_id) DO NOTHING;
    
    -- Update standings based on match result
    IF NEW.home_score > NEW.away_score THEN
        -- Home team wins
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            wins = wins + 1,
            home_wins = home_wins + 1,
            goals_for = goals_for + NEW.home_score,
            goals_against = goals_against + NEW.away_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.home_team_id;
        
        -- Away team loses
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            losses = losses + 1,
            away_losses = away_losses + 1,
            goals_for = goals_for + NEW.away_score,
            goals_against = goals_against + NEW.home_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.away_team_id;
        
    ELSIF NEW.home_score < NEW.away_score THEN
        -- Away team wins
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            wins = wins + 1,
            away_wins = away_wins + 1,
            goals_for = goals_for + NEW.away_score,
            goals_against = goals_against + NEW.home_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.away_team_id;
        
        -- Home team loses
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            losses = losses + 1,
            home_losses = home_losses + 1,
            goals_for = goals_for + NEW.home_score,
            goals_against = goals_against + NEW.away_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.home_team_id;
        
    ELSE
        -- Draw
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            draws = draws + 1,
            home_draws = home_draws + 1,
            goals_for = goals_for + NEW.home_score,
            goals_against = goals_against + NEW.away_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.home_team_id;
        
        UPDATE season_standings SET 
            matches_played = matches_played + 1,
            draws = draws + 1,
            away_draws = away_draws + 1,
            goals_for = goals_for + NEW.away_score,
            goals_against = goals_against + NEW.home_score,
            last_match_date = NEW.match_date
        WHERE season_id = NEW.season_id AND team_id = NEW.away_team_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update standings when matches are completed
CREATE TRIGGER matches_update_standings
    AFTER INSERT OR UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_season_standings();

-- Migrate existing league_standings data to season_standings
-- Note: This assumes league_standings table exists and needs to be migrated
DO $$
DECLARE
    standing_record RECORD;
    season_record UUID;
BEGIN
    -- Check if league_standings table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'league_standings') THEN
        
        -- Migrate each standing to the appropriate season
        FOR standing_record IN 
            SELECT ls.*, t.league_id
            FROM league_standings ls
            JOIN teams t ON ls.team_id = t.id
            WHERE t.league_id IS NOT NULL
        LOOP
            -- Find the current/active season for this league
            SELECT s.id INTO season_record
            FROM seasons s
            WHERE s.league_id = standing_record.league_id
              AND (s.is_current = true OR s.status = 'active')
            ORDER BY s.created_at DESC
            LIMIT 1;
            
            -- If we found a season, migrate the standing
            IF season_record IS NOT NULL THEN
                INSERT INTO season_standings (
                    season_id, team_id, matches_played, wins, draws, losses,
                    goals_for, goals_against, position, last_match_date
                ) VALUES (
                    season_record,
                    standing_record.team_id,
                    COALESCE(standing_record.matches_played, 0),
                    COALESCE(standing_record.wins, 0),
                    COALESCE(standing_record.draws, 0),
                    COALESCE(standing_record.losses, 0),
                    COALESCE(standing_record.goals_for, 0),
                    COALESCE(standing_record.goals_against, 0),
                    standing_record.position,
                    standing_record.last_match_date
                ) ON CONFLICT (season_id, team_id) DO UPDATE SET
                    matches_played = EXCLUDED.matches_played,
                    wins = EXCLUDED.wins,
                    draws = EXCLUDED.draws,
                    losses = EXCLUDED.losses,
                    goals_for = EXCLUDED.goals_for,
                    goals_against = EXCLUDED.goals_against,
                    position = EXCLUDED.position,
                    last_match_date = EXCLUDED.last_match_date;
                
                RAISE NOTICE 'Migrated standing for team % to season %', standing_record.team_id, season_record;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Migration from league_standings to season_standings completed';
    ELSE
        RAISE NOTICE 'No league_standings table found, skipping migration';
    END IF;
END $$;