-- MatchDay Football App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('player', 'captain', 'admin');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE position_type AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    position position_type,
    preferred_foot VARCHAR(10),
    role user_role DEFAULT 'player',
    bio TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type VARCHAR(50) NOT NULL DEFAULT 'football',
    league_type VARCHAR(50) NOT NULL DEFAULT 'competitive',
    location VARCHAR(255),
    season_start TIMESTAMP WITH TIME ZONE,
    season_end TIMESTAMP WITH TIME ZONE,
    max_teams INTEGER DEFAULT 16,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    season VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    captain_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location VARCHAR(255),
    founded_year INTEGER,
    max_players INTEGER DEFAULT 22,
    min_players INTEGER DEFAULT 11,
    team_color VARCHAR(7) DEFAULT '#3B82F6',
    team_bio TEXT,
    is_recruiting BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    previous_league_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, league_id)
);

-- Team members table (junction table)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position position_type,
    jersey_number INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, jersey_number)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    status match_status DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics table
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample leagues
INSERT INTO leagues (id, name, description, sport_type, league_type, location, season_start, season_end, season, is_active, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'League1', 'Professional football league - Division 1', 'football', 'competitive', 'Metropolitan Area', '2024-08-01', '2025-06-30', '2024/25', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'LaLiga', 'Spanish professional football league', 'football', 'competitive', 'Spain', '2024-08-15', '2025-05-30', '2024/25', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'Weekend Football Division', 'Casual weekend football league', 'football', 'recreational', 'City Center', '2024-09-01', '2025-04-30', '2024/25', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'City Championship League', 'City-wide championship competition', 'football', 'competitive', 'Downtown', '2024-08-10', '2025-07-15', '2024/25', true, true);

-- Insert sample users
INSERT INTO users (id, email, full_name, position, role) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'john.doe@example.com', 'John Doe', 'midfielder', 'captain'),
('550e8400-e29b-41d4-a716-446655440101', 'jane.smith@example.com', 'Jane Smith', 'forward', 'player'),
('550e8400-e29b-41d4-a716-446655440102', 'mike.wilson@example.com', 'Mike Wilson', 'goalkeeper', 'player');

-- Insert sample teams
INSERT INTO teams (id, name, league_id, captain_id, location, max_players, team_color) VALUES
('550e8400-e29b-41d4-a716-446655440200', 'Thunder Eagles', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'Central Stadium', 22, '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440201', 'Lightning Strikers', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'North Field', 22, '#EF4444'),
('550e8400-e29b-41d4-a716-446655440202', 'Phoenix United', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Sports Complex', 22, '#F97316');

-- Insert sample team members
INSERT INTO team_members (team_id, user_id, position, jersey_number) VALUES
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', 'midfielder', 10),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'forward', 9),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 'goalkeeper', 1);

-- Create indexes for better performance
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_matches_league_id ON matches(league_id);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX idx_player_stats_match_id ON player_stats(match_id);