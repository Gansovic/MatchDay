-- SQL script to fix the missing logo_media_id link
-- This links existing media records to their leagues

-- First, let's see what we have
SELECT
    l.id as league_id,
    l.name as league_name,
    l.logo_media_id as current_logo_media_id,
    m.id as media_id,
    m.filename,
    m.context_type
FROM leagues l
LEFT JOIN media m ON m.league_id = l.id AND m.context_type = 'league_icon'
ORDER BY l.name;

-- Update leagues with their corresponding media records
UPDATE leagues l
SET logo_media_id = m.id
FROM media m
WHERE m.league_id = l.id
    AND m.context_type = 'league_icon'
    AND l.logo_media_id IS NULL;

-- Verify the update
SELECT
    l.id as league_id,
    l.name as league_name,
    l.logo_media_id as updated_logo_media_id,
    m.id as media_id,
    m.filename
FROM leagues l
LEFT JOIN media m ON m.id = l.logo_media_id
ORDER BY l.name;