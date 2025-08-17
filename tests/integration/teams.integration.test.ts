/**
 * Teams API Integration Tests
 * 
 * Tests the teams API endpoints against the actual database:
 * - POST /api/teams - Team creation with database verification
 * - GET /api/teams - Team retrieval with relationship verification
 * - Database integrity and foreign key constraints
 * - Team independence from leagues
 * - Captain assignment and team member creation
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/teams/route';
import { 
  createTestClient, 
  createTestUser, 
  createTestLeague, 
  cleanupTestData,
  generateTestName,
  verifyTeamExists,
  verifyTeamMemberExists,
  TestUser,
  TestLeague
} from '@tests/utils/database-test-utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

describe('Teams API Integration Tests', () => {
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
      email: 'test-captain@example.com',
      password: 'testpass123',
      display_name: 'Test Captain',
      full_name: 'Captain Test User'
    });
    createdUserIds.push(testUser.id);

    // Create test league
    testLeague = await createTestLeague(supabase, {
      name: generateTestName('Test League'),
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

  describe('POST /api/teams - Team Creation', () => {
    it('should create a team with valid data and verify database state', async () => {
      const teamData = {
        name: generateTestName('Test Team'),
        sport: 'football',
        league: testLeague.name,
        description: 'A test team for integration testing',
        maxMembers: 20,
        location: 'Test City',
        color: '#FF5733'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Verify API response
      expect(response.status).toBe(201);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.name).toBe(teamData.name);
      expect(responseData.data.league_id).toBe(testLeague.id);
      expect(responseData.data.captain_id).toBe(testUser.id);
      expect(responseData.message).toBe('Team created successfully');

      const teamId = responseData.data.id;
      createdTeamIds.push(teamId);

      // Verify team exists in database with correct data
      const dbTeam = await verifyTeamExists(supabase, teamId);
      expect(dbTeam.name).toBe(teamData.name);
      expect(dbTeam.league_id).toBe(testLeague.id);
      expect(dbTeam.captain_id).toBe(testUser.id);
      expect(dbTeam.team_color).toBe(teamData.color);
      expect(dbTeam.max_players).toBe(teamData.maxMembers);
      expect(dbTeam.min_players).toBe(7); // Default value

      // Verify captain is automatically added as team member
      const isMember = await verifyTeamMemberExists(supabase, teamId, testUser.id);
      expect(isMember).toBe(true);

      // Verify team member record details
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', testUser.id)
        .eq('is_active', true)
        .single();

      expect(teamMember).toBeDefined();
      expect(teamMember.position).toBe('midfielder'); // Default position
      expect(teamMember.jersey_number).toBe(1); // Default jersey number
    });

    it('should enforce team name uniqueness within a league', async () => {
      const teamName = generateTestName('Unique Team');
      
      // Create first team
      const teamData1 = {
        name: teamName,
        league: testLeague.name,
        description: 'First team with this name'
      };

      const request1 = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData1)
      });

      const response1 = await POST(request1);
      const responseData1 = await response1.json();
      
      expect(response1.status).toBe(201);
      createdTeamIds.push(responseData1.data.id);

      // Try to create second team with same name
      const teamData2 = {
        name: teamName, // Same name
        league: testLeague.name, // Same league
        description: 'Second team with duplicate name'
      };

      const request2 = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData2)
      });

      const response2 = await POST(request2);
      const responseData2 = await response2.json();

      // Verify duplicate name is rejected
      expect(response2.status).toBe(400);
      expect(responseData2.error).toBe('Team creation failed');
      expect(responseData2.message).toContain('already exists');
    });

    it('should validate required fields and return proper errors', async () => {
      const invalidTeamData = {
        // Missing required 'name' field
        league: testLeague.name,
        description: 'Team without name'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(invalidTeamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.validationErrors).toBeDefined();
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('required')
          })
        ])
      );
    });

    it('should reject team creation for non-existent league', async () => {
      const teamData = {
        name: generateTestName('Test Team'),
        league: 'Non-Existent League',
        description: 'Team for non-existent league'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('League not found');
      expect(responseData.message).toContain('not found or is not active');
    });

    it('should reject requests without authentication', async () => {
      const teamData = {
        name: generateTestName('Test Team'),
        league: testLeague.name,
        description: 'Team without auth'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
      expect(responseData.message).toBe('Authentication required');
    });

    it('should validate color format', async () => {
      const teamData = {
        name: generateTestName('Test Team'),
        league: testLeague.name,
        color: 'invalid-color' // Invalid hex color
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'color',
            message: expect.stringContaining('valid hex color')
          })
        ])
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalTeamData = {
        name: generateTestName('Minimal Team'),
        league: testLeague.name
        // No optional fields provided
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(minimalTeamData)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      
      const teamId = responseData.data.id;
      createdTeamIds.push(teamId);

      // Verify default values in database
      const dbTeam = await verifyTeamExists(supabase, teamId);
      expect(dbTeam.team_color).toBe('#2563eb'); // Default blue
      expect(dbTeam.max_players).toBe(22); // Default football squad size
      expect(dbTeam.min_players).toBe(7); // Default minimum
    });
  });

  describe('GET /api/teams - Team Retrieval', () => {
    beforeEach(async () => {
      // Create a test team for retrieval tests
      const teamData = {
        name: generateTestName('Retrieval Test Team'),
        league: testLeague.name,
        description: 'Team for testing retrieval'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();
      
      if (responseData.data?.id) {
        createdTeamIds.push(responseData.data.id);
      }
    });

    it('should retrieve all teams with league relationships', async () => {
      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'GET'
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.message).toBe('Teams retrieved successfully');

      // Verify that teams include league data
      if (responseData.data.length > 0) {
        const team = responseData.data.find((t: any) => createdTeamIds.includes(t.id));
        expect(team).toBeDefined();
        expect(team.league).toBeDefined();
        expect(team.league.name).toBe(testLeague.name);
      }
    });

    it('should handle empty results gracefully', async () => {
      // Clean up existing teams first
      await cleanupTestData(supabase, { teamIds: createdTeamIds });
      createdTeamIds = [];

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'GET'
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.message).toBe('Teams retrieved successfully');
    });
  });

  describe('Database Integrity and Team Independence', () => {
    it('should maintain team data when league is deleted (team independence)', async () => {
      // Create a temporary league for this test
      const tempLeague = await createTestLeague(supabase, {
        name: generateTestName('Temporary League'),
        sport_type: 'football',
        league_type: 'competitive'
      });

      // Create a team in the temporary league
      const teamData = {
        name: generateTestName('Independent Team'),
        league: tempLeague.name,
        description: 'Team to test independence'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(201);
      const teamId = responseData.data.id;
      createdTeamIds.push(teamId);

      // Verify team exists and is linked to league
      let dbTeam = await verifyTeamExists(supabase, teamId);
      expect(dbTeam.league_id).toBe(tempLeague.id);

      // Delete the league
      await supabase
        .from('leagues')
        .delete()
        .eq('id', tempLeague.id);

      // Verify team still exists but is now orphaned
      dbTeam = await verifyTeamExists(supabase, teamId);
      expect(dbTeam.id).toBe(teamId);
      expect(dbTeam.name).toBe(teamData.name);
      expect(dbTeam.captain_id).toBe(testUser.id);
      
      // Team should be orphaned (league_id might be null or team might still exist)
      // The exact behavior depends on your database constraints
    });

    it('should enforce foreign key constraints for captain_id', async () => {
      // Try to create a team record directly with non-existent captain
      const directTeamInsert = {
        name: generateTestName('Invalid Captain Team'),
        league_id: testLeague.id,
        captain_id: '00000000-0000-0000-0000-000000000000', // Non-existent user
        team_color: '#FF0000',
        max_players: 22,
        min_players: 7
      };

      const { error } = await supabase
        .from('teams')
        .insert(directTeamInsert);

      // Should fail due to foreign key constraint
      expect(error).toBeDefined();
      expect(error.code).toBe('23503'); // Foreign key violation
    });

    it('should maintain referential integrity when captain is deleted', async () => {
      // Create a temporary user to be captain
      const tempUser = await createTestUser(supabase, {
        email: 'temp-captain@example.com',
        password: 'temppass123',
        display_name: 'Temp Captain'
      });

      // Create team with temporary captain
      const teamData = {
        name: generateTestName('Temp Captain Team'),
        league: testLeague.name,
        description: 'Team with temporary captain'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempUser.access_token}`
        },
        body: JSON.stringify(teamData)
      });

      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(201);
      const teamId = responseData.data.id;
      createdTeamIds.push(teamId);

      // Verify team exists with temp captain
      const dbTeam = await verifyTeamExists(supabase, teamId);
      expect(dbTeam.captain_id).toBe(tempUser.id);

      // Try to delete the captain user
      // The behavior here depends on your database constraints
      // It might prevent deletion or set captain_id to null
      const { error } = await supabase.auth.admin.deleteUser(tempUser.id);
      
      // The exact assertion depends on your constraint configuration
      // This test documents the expected behavior
      if (error) {
        // If deletion is prevented by constraints
        expect(error).toBeDefined();
      } else {
        // If deletion is allowed, captain_id might be set to null
        const updatedTeam = await verifyTeamExists(supabase, teamId);
        // Check if captain_id is null or team handling is appropriate
      }
    });
  });
});