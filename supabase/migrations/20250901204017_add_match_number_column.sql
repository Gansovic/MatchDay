-- Add match_number column to matches table for simpler URLs
-- This allows URLs like /matches/1 instead of /matches/uuid

-- Create sequence for auto-incrementing match numbers
CREATE SEQUENCE IF NOT EXISTS matches_match_number_seq;

-- Add match_number column with unique constraint
ALTER TABLE matches 
ADD COLUMN match_number INTEGER UNIQUE 
DEFAULT nextval('matches_match_number_seq');

-- Create index for fast lookups on match_number
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);

-- Update existing matches with sequential numbers (ordered by creation date)
DO $$
DECLARE
    match_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Loop through matches in creation order and assign sequential numbers
    FOR match_record IN 
        SELECT id FROM matches 
        WHERE match_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        UPDATE matches 
        SET match_number = counter 
        WHERE id = match_record.id;
        
        counter := counter + 1;
    END LOOP;
    
    -- Update sequence to continue from the highest assigned number
    PERFORM setval('matches_match_number_seq', counter);
END $$;