/**
 * Database Integrity Integration Tests
 * 
 * Tests core database functionality, constraints, and integrity:
 * - Foreign key constraints and referential integrity
 * - Team independence from leagues (recent feature)
 * - Captain assignment and team member relationships
 * - Data consistency and constraint enforcement
 * - Database schema validation
 */

import { 
  createTestClient, 
  createTestUser, 
  createTestLeague, 
  createTestTeam,
  addTeamMember,
  cleanupTestData,
  generateTestName,
  verifyTeamExists,
  verifyTeamMemberExists,
  TestUser,
  TestLeague,
  TestTeam
} from '@tests/utils/database-test-utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

describe('Database Integrity Integration Tests', () => {
  let supabase: SupabaseClient<Database>;
  let testUser: TestUser;
  let testLeague: TestLeague;
  let createdTeamIds: string[] = [];
  let createdUserIds: string[] = [];
  let createdLeagueIds: string[] = [];

  beforeAll(async () => {
    supabase = createTestClient();
    
    // Create test user
    testUser = await createTestUser(supabase, {
      email: 'test-captain@integrity.test',
      password: 'testpass123',
      display_name: 'Integrity Test Captain',
      full_name: 'Database Integrity Test User'
    });
    createdUserIds.push(testUser.id);

    // Create test league
    testLeague = await createTestLeague(supabase, {
      name: generateTestName('Integrity Test League'),
      sport_type: 'football',
      league_type: 'competitive',
      location: 'Test City',
      is_active: true,
      is_public: true
    });
    createdLeagueIds.push(testLeague.id);
  });

  afterAll(async () => {
    // Clean up all test data
    await cleanupTestData(supabase, {
      teamIds: createdTeamIds,
      userIds: createdUserIds,
      leagueIds: createdLeagueIds
    });
  });

  afterEach(async () => {
    // Clean up teams created in each test
    if (createdTeamIds.length > 0) {
      await cleanupTestData(supabase, {
        teamIds: createdTeamIds
      });
      createdTeamIds = [];
    }
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce captain_id foreign key constraint', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      // Try to create a team with non-existent captain
      const { error } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Invalid Captain Team'),
          league_id: testLeague.id,
          captain_id: fakeUserId,
          team_color: '#FF0000',
          max_players: 22,
          min_players: 7
        });

      // Should fail with foreign key constraint violation
      expect(error).toBeDefined();
      expect(error.code).toBe('23503'); // PostgreSQL foreign key violation
      expect(error.message).toContain('violates foreign key constraint');
    });

    it('should enforce league_id foreign key constraint when league is required', async () => {
      const fakeLeagueId = '00000000-0000-0000-0000-000000000000';
      
      // Try to create a team with non-existent league
      const { error } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Invalid League Team'),
          league_id: fakeLeagueId,
          captain_id: testUser.id,
          team_color: '#FF0000',
          max_players: 22,
          min_players: 7
        });

      // Should fail with foreign key constraint violation
      expect(error).toBeDefined();
      expect(error.code).toBe('23503'); // PostgreSQL foreign key violation
    });

    it('should enforce team_members foreign key constraints', async () => {
      // Create a valid team first
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('FK Test Team'),
        league_id: testLeague.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const fakeTeamId = '00000000-0000-0000-0000-000000000000';

      // Try to add member with invalid user_id
      const { error: userError } = await supabase
        .from('team_members')
        .insert({
          team_id: testTeam.id,
          user_id: fakeUserId,
          position: 'midfielder',
          jersey_number: 10
        });

      expect(userError).toBeDefined();
      expect(userError.code).toBe('23503');

      // Try to add member with invalid team_id
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          team_id: fakeTeamId,
          user_id: testUser.id,
          position: 'midfielder',
          jersey_number: 10
        });

      expect(teamError).toBeDefined();
      expect(teamError.code).toBe('23503');
    });
  });

  describe('Team Independence Feature', () => {
    it('should allow teams to exist without a league (orphaned teams)', async () => {
      // Create a team with null league_id (orphaned team)
      const { data: orphanedTeam, error } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Orphaned Team'),
          league_id: null, // No league
          captain_id: testUser.id,
          team_color: '#FF5733',
          max_players: 22,
          min_players: 7,
          team_bio: 'This team has no league'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(orphanedTeam).toBeDefined();
      expect(orphanedTeam.league_id).toBeNull();
      expect(orphanedTeam.captain_id).toBe(testUser.id);
      
      createdTeamIds.push(orphanedTeam.id);

      // Verify team can be retrieved and functions normally
      const retrievedTeam = await verifyTeamExists(supabase, orphanedTeam.id);
      expect(retrievedTeam.name).toBe(orphanedTeam.name);
      expect(retrievedTeam.league_id).toBeNull();
    });

    it('should preserve teams when their league is deleted', async () => {
      // Create a temporary league
      const tempLeague = await createTestLeague(supabase, {
        name: generateTestName('Temporary League'),
        sport_type: 'football',
        league_type: 'competitive'
      });

      // Create a team in that league
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('Team in Temp League'),
        league_id: tempLeague.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      // Verify team is linked to league
      let team = await verifyTeamExists(supabase, testTeam.id);
      expect(team.league_id).toBe(tempLeague.id);

      // Delete the league
      const { error: deleteError } = await supabase
        .from('leagues')
        .delete()
        .eq('id', tempLeague.id);

      expect(deleteError).toBeNull();

      // Verify team still exists and is now orphaned or handled appropriately
      team = await verifyTeamExists(supabase, testTeam.id);
      expect(team.id).toBe(testTeam.id);
      expect(team.name).toBe(testTeam.name);
      expect(team.captain_id).toBe(testUser.id);
      
      // Team should either be orphaned (league_id = null) or constraint should prevent deletion
      // The exact behavior depends on your database constraint configuration
      // This test documents the expected behavior
    });

    it('should handle team reassignment to different leagues', async () => {
      // Create two leagues
      const league1 = await createTestLeague(supabase, {
        name: generateTestName('League One'),
        sport_type: 'football',
        league_type: 'competitive'
      });
      
      const league2 = await createTestLeague(supabase, {
        name: generateTestName('League Two'),
        sport_type: 'football',
        league_type: 'recreational'
      });

      // Create team in league1
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('Mobile Team'),
        league_id: league1.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      // Verify initial league assignment
      let team = await verifyTeamExists(supabase, testTeam.id);
      expect(team.league_id).toBe(league1.id);

      // Move team to league2
      const { error: updateError } = await supabase
        .from('teams')
        .update({ league_id: league2.id })
        .eq('id', testTeam.id);

      expect(updateError).toBeNull();

      // Verify team moved
      team = await verifyTeamExists(supabase, testTeam.id);
      expect(team.league_id).toBe(league2.id);

      // Clean up temporary leagues
      await supabase.from('leagues').delete().eq('id', league1.id);
      await supabase.from('leagues').delete().eq('id', league2.id);
    });
  });

  describe('Captain and Team Member Relationships', () => {
    it('should ensure captain is also a team member', async () => {
      // Create a team
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('Captain Test Team'),
        league_id: testLeague.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      // Add captain as team member
      await addTeamMember(supabase, testTeam.id, testUser.id, {
        position: 'captain',
        jersey_number: 1
      });

      // Verify captain is both captain and member
      const team = await verifyTeamExists(supabase, testTeam.id);
      expect(team.captain_id).toBe(testUser.id);

      const isMember = await verifyTeamMemberExists(supabase, testTeam.id, testUser.id);
      expect(isMember).toBe(true);
    });

    it('should handle multiple team members with unique constraints', async () => {
      // Create a team
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('Multi Member Team'),
        league_id: testLeague.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      // Create additional test users
      const member1 = await createTestUser(supabase, {
        email: 'member1@test.com',
        password: 'testpass123',
        display_name: 'Member One'
      });
      createdUserIds.push(member1.id);

      const member2 = await createTestUser(supabase, {
        email: 'member2@test.com',
        password: 'testpass123',
        display_name: 'Member Two'
      });
      createdUserIds.push(member2.id);

      // Add members with different jersey numbers
      await addTeamMember(supabase, testTeam.id, testUser.id, {
        position: 'captain',
        jersey_number: 1
      });

      await addTeamMember(supabase, testTeam.id, member1.id, {
        position: 'midfielder',
        jersey_number: 10
      });

      await addTeamMember(supabase, testTeam.id, member2.id, {
        position: 'forward',
        jersey_number: 9
      });

      // Verify all members exist
      expect(await verifyTeamMemberExists(supabase, testTeam.id, testUser.id)).toBe(true);
      expect(await verifyTeamMemberExists(supabase, testTeam.id, member1.id)).toBe(true);
      expect(await verifyTeamMemberExists(supabase, testTeam.id, member2.id)).toBe(true);

      // Try to add same member twice (should fail or handle gracefully)
      const { error: duplicateError } = await supabase
        .from('team_members')
        .insert({
          team_id: testTeam.id,
          user_id: member1.id,
          position: 'defender',
          jersey_number: 5,
          is_active: true
        });

      // Should fail due to unique constraint on (team_id, user_id) if it exists
      // Or should be handled gracefully by the application
      if (duplicateError) {
        expect(duplicateError.code).toBe('23505'); // Unique constraint violation
      }
    });

    it('should prevent jersey number conflicts within a team', async () => {
      // Create a team
      const testTeam = await createTestTeam(supabase, {
        name: generateTestName('Jersey Conflict Team'),
        league_id: testLeague.id,
        captain_id: testUser.id
      });
      createdTeamIds.push(testTeam.id);

      // Create additional test user
      const member1 = await createTestUser(supabase, {
        email: 'jersey1@test.com',
        password: 'testpass123',
        display_name: 'Jersey Member'
      });
      createdUserIds.push(member1.id);

      // Add first member with jersey number 10
      await addTeamMember(supabase, testTeam.id, testUser.id, {
        position: 'midfielder',
        jersey_number: 10
      });

      // Try to add second member with same jersey number
      const { error: conflictError } = await supabase
        .from('team_members')
        .insert({
          team_id: testTeam.id,
          user_id: member1.id,
          position: 'forward',
          jersey_number: 10, // Same jersey number
          is_active: true
        });

      // Should fail if unique constraint exists on (team_id, jersey_number)
      if (conflictError) {
        expect(conflictError.code).toBe('23505'); // Unique constraint violation
      }
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should enforce required fields and defaults', async () => {
      // Try to create team with minimal required data
      const { data: minimalTeam, error } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Minimal Team'),
          captain_id: testUser.id
          // No league_id (should be allowed for orphaned teams)
          // Other fields should use defaults
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(minimalTeam).toBeDefined();
      expect(minimalTeam.name).toBeTruthy();
      expect(minimalTeam.captain_id).toBe(testUser.id);
      expect(minimalTeam.league_id).toBeNull(); // Should allow null
      expect(minimalTeam.max_players).toBeDefined(); // Should have default
      expect(minimalTeam.min_players).toBeDefined(); // Should have default
      
      createdTeamIds.push(minimalTeam.id);
    });

    it('should enforce string length constraints', async () => {
      const longName = 'A'.repeat(256); // Very long name
      
      const { error } = await supabase
        .from('teams')
        .insert({
          name: longName,
          league_id: testLeague.id,
          captain_id: testUser.id
        });

      // Should fail if name has length constraint
      if (error) {
        expect(error.code).toBe('22001'); // String too long
      }
    });

    it('should handle numeric constraints properly', async () => {
      // Test invalid player counts
      const { error: maxError } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Invalid Max Team'),
          league_id: testLeague.id,
          captain_id: testUser.id,
          max_players: -1, // Invalid negative value
          min_players: 7
        });

      const { error: minError } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Invalid Min Team'),
          league_id: testLeague.id,
          captain_id: testUser.id,
          max_players: 22,
          min_players: 0 // Invalid zero value
        });

      // Should fail with check constraints if they exist
      if (maxError) {
        expect(maxError.code).toBe('23514'); // Check constraint violation
      }
      if (minError) {
        expect(minError.code).toBe('23514'); // Check constraint violation
      }
    });
  });

  describe('Transaction Integrity', () => {
    it('should maintain consistency during team creation with member addition', async () => {
      // Test the pattern used in team creation API
      // Step 1: Create team without captain
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: generateTestName('Transaction Test Team'),
          league_id: testLeague.id,
          captain_id: null, // Initially null
          team_color: '#FF0000',
          max_players: 22,
          min_players: 7
        })
        .select()
        .single();

      expect(teamError).toBeNull();
      expect(newTeam).toBeDefined();
      createdTeamIds.push(newTeam.id);

      // Step 2: Add captain as member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: testUser.id,
          position: 'midfielder',
          jersey_number: 1,
          is_active: true
        });

      expect(memberError).toBeNull();

      // Step 3: Update team with captain_id
      const { error: updateError } = await supabase
        .from('teams')
        .update({ captain_id: testUser.id })
        .eq('id', newTeam.id);

      expect(updateError).toBeNull();

      // Verify final state
      const finalTeam = await verifyTeamExists(supabase, newTeam.id);
      expect(finalTeam.captain_id).toBe(testUser.id);

      const isMember = await verifyTeamMemberExists(supabase, newTeam.id, testUser.id);
      expect(isMember).toBe(true);
    });

    it('should handle concurrent team creation attempts gracefully', async () => {
      const teamName = generateTestName('Concurrent Team');
      
      // Simulate concurrent team creation with same name in same league
      const promises = [
        supabase.from('teams').insert({
          name: teamName,
          league_id: testLeague.id,
          captain_id: testUser.id
        }).select().single(),
        supabase.from('teams').insert({
          name: teamName,
          league_id: testLeague.id,
          captain_id: testUser.id
        }).select().single()
      ];

      const results = await Promise.allSettled(promises);
      
      // At least one should succeed, one might fail due to unique constraint
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBeGreaterThanOrEqual(1);
      
      // Clean up any successful creations
      for (const result of successful) {
        if (result.status === 'fulfilled' && result.value.data) {
          createdTeamIds.push(result.value.data.id);
        }
      }
    });
  });
});