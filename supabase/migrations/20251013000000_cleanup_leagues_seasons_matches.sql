-- Clean Database: Delete All Matches, Leagues, and Seasons
-- Preserves: Users and Teams
-- Deletes: All matches, seasons, leagues, and related data

-- Step 1: Delete player stats (depends on matches)
DELETE FROM player_stats;

-- Step 2: Delete matches (depends on seasons)
DELETE FROM matches;

-- Step 3: Delete season_teams (team registrations in seasons)
DELETE FROM season_teams;

-- Step 4: Delete seasons (depends on leagues)
DELETE FROM seasons;

-- Step 5: Delete leagues
DELETE FROM leagues;

-- Step 6: Update teams to remove league references
-- This ensures teams are not orphaned with invalid league_id references
UPDATE teams SET league_id = NULL WHERE league_id IS NOT NULL;

-- Verification queries (optional - comment these out if not needed)
-- SELECT 'Remaining matches:', COUNT(*) FROM matches;
-- SELECT 'Remaining seasons:', COUNT(*) FROM seasons;
-- SELECT 'Remaining leagues:', COUNT(*) FROM leagues;
-- SELECT 'Remaining teams:', COUNT(*) FROM teams;
-- SELECT 'Remaining users:', COUNT(*) FROM auth.users;
