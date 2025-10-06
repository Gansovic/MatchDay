-- Migration: Add League Publishing Features
-- Date: 2025-09-08
-- Description: Add columns to support league publishing and public registration

-- Add publishing-related columns to leagues table
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_approve_teams BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_deadline DATE,
ADD COLUMN IF NOT EXISTS max_teams INTEGER,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create index for efficient public league queries
CREATE INDEX IF NOT EXISTS idx_leagues_public ON leagues(is_public, is_active) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_leagues_featured ON leagues(featured, is_public, is_active) WHERE featured = true;

-- Add comments for documentation
COMMENT ON COLUMN leagues.is_public IS 'Whether this league is publicly visible for team registration';
COMMENT ON COLUMN leagues.auto_approve_teams IS 'Whether team join requests are automatically approved';
COMMENT ON COLUMN leagues.registration_deadline IS 'Deadline for team registration';
COMMENT ON COLUMN leagues.max_teams IS 'Maximum number of teams allowed in this league';
COMMENT ON COLUMN leagues.published_at IS 'When this league was first published publicly';
COMMENT ON COLUMN leagues.featured IS 'Whether this league is featured in public listings';