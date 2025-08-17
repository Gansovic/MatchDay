-- Add missing fields to leagues table to match TypeScript interface

-- Add new columns to leagues table
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS sport_type VARCHAR(50) NOT NULL DEFAULT 'football',
ADD COLUMN IF NOT EXISTS league_type VARCHAR(50) NOT NULL DEFAULT 'competitive',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS season_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS season_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Clean up any existing fake leagues first, then ensure only the 2 real leagues exist
DELETE FROM leagues WHERE id NOT IN (
    'e73dd372-ddb9-4419-9b97-6dd9717b76c2', 
    '20f5b4c7-ced3-4000-9680-3e7d567c1e2e'
);

-- Create only the 2 real leagues (updated with correct IDs and locations)
INSERT INTO leagues (id, name, description, sport_type, league_type, location, season_start, season_end, season, is_active, is_public) 
VALUES 
('e73dd372-ddb9-4419-9b97-6dd9717b76c2', 'League1', 'Professional football league - Division 1', 'football', 'competitive', 'Test Stadium', '2024-08-01', '2025-06-30', '2024/25', true, true),
('20f5b4c7-ced3-4000-9680-3e7d567c1e2e', 'LaLiga', 'Spanish professional football league', 'football', 'competitive', 'Madrid, Spain', '2024-08-15', '2025-05-30', '2024/25', true, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sport_type = EXCLUDED.sport_type,
    league_type = EXCLUDED.league_type,
    location = EXCLUDED.location,
    season_start = EXCLUDED.season_start,
    season_end = EXCLUDED.season_end,
    is_active = EXCLUDED.is_active,
    is_public = EXCLUDED.is_public;