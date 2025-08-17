-- Migration: Fix teams table captain_id foreign key constraint
-- Purpose: Resolve chicken-and-egg problem with team creation
-- Date: 2025-08-17

-- Step 1: Check current constraints
-- First, let's see what foreign key actually exists
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid = 'teams'::regclass
AND conname LIKE '%captain%';

-- Step 2: Drop the incorrect foreign key constraint if it references team_members
ALTER TABLE teams 
DROP CONSTRAINT IF EXISTS teams_captain_id_fkey;

-- Step 3: Re-add the constraint to reference users table (which is correct)
-- and make it DEFERRABLE so we can handle circular dependencies if needed
ALTER TABLE teams 
ADD CONSTRAINT teams_captain_id_fkey 
FOREIGN KEY (captain_id) 
REFERENCES users(id) 
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- Step 4: Make captain_id nullable to allow team creation without a captain initially
ALTER TABLE teams 
ALTER COLUMN captain_id DROP NOT NULL;

-- Step 5: Add a comment explaining the approach
COMMENT ON COLUMN teams.captain_id IS 'Reference to the team captain (users table). Can be NULL initially and set after team creation.';

-- Step 6: Create or replace a function to safely create a team with captain
CREATE OR REPLACE FUNCTION create_team_with_captain(
    p_team_name VARCHAR(255),
    p_league_id UUID,
    p_captain_id UUID,
    p_team_color VARCHAR(7) DEFAULT '#3B82F6',
    p_team_bio TEXT DEFAULT NULL,
    p_max_players INTEGER DEFAULT 22,
    p_min_players INTEGER DEFAULT 11,
    p_location VARCHAR(255) DEFAULT NULL,
    p_founded_year INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_team_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_captain_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'User with ID % does not exist', p_captain_id;
    END IF;
    
    -- Create the team with captain_id set
    INSERT INTO teams (
        name,
        league_id,
        captain_id,
        team_color,
        team_bio,
        max_players,
        min_players,
        location,
        founded_year,
        is_recruiting
    ) VALUES (
        p_team_name,
        p_league_id,
        p_captain_id,
        p_team_color,
        p_team_bio,
        p_max_players,
        p_min_players,
        p_location,
        p_founded_year,
        true
    ) RETURNING id INTO v_team_id;
    
    -- Add the captain as a team member
    INSERT INTO team_members (
        team_id,
        user_id,
        position,
        jersey_number,
        is_active
    ) VALUES (
        v_team_id,
        p_captain_id,
        'midfielder', -- Default position
        1, -- Default jersey number for captain
        true
    );
    
    RETURN v_team_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_team_with_captain IS 'Safely creates a team with a captain and automatically adds the captain as a team member';

-- Step 7: Create an alternative approach using a transaction-safe method
CREATE OR REPLACE FUNCTION create_team_deferred(
    p_team_name VARCHAR(255),
    p_league_id UUID,
    p_captain_id UUID,
    p_team_color VARCHAR(7) DEFAULT '#3B82F6',
    p_team_bio TEXT DEFAULT NULL,
    p_max_players INTEGER DEFAULT 22,
    p_min_players INTEGER DEFAULT 11
) RETURNS TABLE(team_id UUID, success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_team_id UUID;
    v_error_message TEXT;
BEGIN
    -- Start a subtransaction
    BEGIN
        -- First create team without captain
        INSERT INTO teams (
            name,
            league_id,
            captain_id,
            team_color,
            team_bio,
            max_players,
            min_players,
            is_recruiting
        ) VALUES (
            p_team_name,
            p_league_id,
            NULL, -- Initially NULL
            p_team_color,
            p_team_bio,
            p_max_players,
            p_min_players,
            true
        ) RETURNING id INTO v_team_id;
        
        -- Add captain as team member
        INSERT INTO team_members (
            team_id,
            user_id,
            position,
            jersey_number,
            is_active
        ) VALUES (
            v_team_id,
            p_captain_id,
            'midfielder',
            1,
            true
        );
        
        -- Update team with captain_id
        UPDATE teams 
        SET captain_id = p_captain_id 
        WHERE id = v_team_id;
        
        RETURN QUERY SELECT v_team_id, true, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        RETURN QUERY SELECT NULL::UUID, false, v_error_message;
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_team_deferred IS 'Creates a team using deferred approach - creates team first, then adds captain';

-- Step 8: Verify that the admin user exists (the one hardcoded in the API)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = '14dc794d-a769-4b96-8a79-5c05484f493e') THEN
        RAISE NOTICE 'Warning: Hardcoded admin user ID (14dc794d-a769-4b96-8a79-5c05484f493e) does not exist in users table';
    END IF;
END $$;