-- Add missing tables for TeamService

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team statistics table
CREATE TABLE IF NOT EXISTS team_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season_year)
);

-- Add missing columns to leagues table
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS sport_type VARCHAR(50) DEFAULT 'football',
ADD COLUMN IF NOT EXISTS league_type VARCHAR(50) DEFAULT 'competitive',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add missing columns to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS is_starter BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_team_stats_team_id ON team_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_league_id ON team_stats(league_id);

-- Demo user profile will be created when a real auth user signs up

-- Insert sample leagues for football
INSERT INTO leagues (name, description, sport_type, league_type, location, is_active, is_public, season)
VALUES 
  ('Metropolitan Football League', 'Competitive football league for downtown area', 'football', 'competitive', 'Downtown Sports Complex', true, true, '2025'),
  ('Elite Soccer League', 'High-level competitive football', 'football', 'competitive', 'North District', true, true, '2025'),
  ('Weekend Football Division', 'Casual weekend football games', 'football', 'casual', 'South Stadium', true, true, '2025'),
  ('City Football Championship', 'City-wide football championship', 'football', 'competitive', 'City Arena', true, true, '2025'),
  ('Regional Football League', 'Regional casual football league', 'football', 'casual', 'Community Center', true, true, '2025')
ON CONFLICT DO NOTHING;