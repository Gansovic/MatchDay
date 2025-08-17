# Team Independence from Leagues

## Overview
Teams in MatchDay are now independent from leagues, meaning they persist even when their associated league is deleted or changed. This ensures that player statistics and team history are preserved.

## Database Changes

### Modified Constraints
- **teams.league_id**: Changed from `ON DELETE CASCADE` to `ON DELETE SET NULL`
  - Teams no longer get deleted when their league is deleted
  - The league_id becomes NULL, marking the team as "orphaned"

### New Columns
- **teams.is_archived** (boolean): Indicates if a team is archived/inactive
- **teams.previous_league_name** (varchar): Stores the name of the last league the team belonged to

### New Database Objects
- **orphaned_teams** view: Provides easy access to teams without a league
- **reassign_team_to_league()** function: Helper to reassign orphaned teams to new leagues
- **Triggers**: Automatically capture league name before deletion

## Service Layer Updates

### TeamService Methods
- **getOrphanedTeams()**: Retrieve all teams without a league
- **reassignTeamToLeague()**: Assign an orphaned team to a new league
- **archiveTeam()**: Archive a team that's no longer active

### TeamWithDetails Interface
- Added `isOrphaned` flag
- Added `previousLeagueName` field
- League is now nullable

## How It Works

1. **When a league is deleted:**
   - Teams' league_id is set to NULL (not deleted)
   - Previous league name is captured automatically
   - Team members and their stats are preserved
   - Matches are deleted (league-specific events)

2. **Orphaned teams can:**
   - Be reassigned to a new league
   - Be archived if no longer needed
   - Maintain all their members and historical data

## Usage Examples

### Finding Orphaned Teams
```typescript
const teamService = TeamService.getInstance(supabase);
const { data: orphanedTeams } = await teamService.getOrphanedTeams({
  includeArchived: false
});
```

### Reassigning a Team
```typescript
const { data: reassignedTeam } = await teamService.reassignTeamToLeague(
  teamId,
  newLeagueId,
  userId // Must be team captain
);
```

### Archiving a Team
```typescript
const { data: archivedTeam } = await teamService.archiveTeam(
  teamId,
  userId // Must be team captain
);
```

## Migration Scripts

Three migration files were created:
1. `20250817000000_make_teams_independent_from_leagues.sql` - Main schema changes
2. `20250817000001_fix_league_name_trigger.sql` - Trigger improvements
3. `20250817000002_improve_league_name_capture.sql` - Final trigger optimization

## Testing

Test scripts are available in `/scripts`:
- `test_team_independence.js` - Basic independence test
- `test_team_with_stats.js` - Comprehensive test with player stats

## Benefits

1. **Data Preservation**: Player statistics and team history are never lost
2. **Flexibility**: Teams can move between leagues or exist independently
3. **Better UX**: Players don't lose their team affiliations unexpectedly
4. **Admin Control**: Orphaned teams can be managed and reassigned as needed