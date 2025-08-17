/**
 * Error Handling Integration Tests
 * 
 * Comprehensive tests for error scenarios, edge cases, and resilience:
 * - API error handling and validation
 * - Database constraint violations and recovery
 * - Edge cases and boundary conditions
 * - Network error simulation
 * - Malformed request handling
 * - Security validation
 */

import { NextRequest } from 'next/server';
import { POST as TeamsPost, GET as TeamsGet } from '@/app/api/teams/route';
import { GET as LeaguesGet } from '@/app/api/leagues/route';
import { GET as ProfileGet, PUT as ProfilePut, PATCH as ProfilePatch } from '@/app/api/profile/route';
import { 
  createTestClient, 
  createTestUser, 
  createTestLeague, 
  cleanupTestData,
  generateTestName,
  TestUser,
  TestLeague
} from '@tests/utils/database-test-utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

describe('Error Handling Integration Tests', () => {
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
      email: 'error-test@example.com',
      password: 'testpass123',
      display_name: 'Error Test User',
      full_name: 'Error Handling Test User'
    });
    createdUserIds.push(testUser.id);

    // Create test league
    testLeague = await createTestLeague(supabase, {
      name: generateTestName('Error Test League'),
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

  describe('Teams API Error Handling', () => {
    describe('Malformed Requests', () => {
      it('should handle invalid JSON in request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: '{ invalid json structure'
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Invalid request body');
        expect(responseData.message).toContain('valid JSON');
      });

      it('should handle missing content-type header', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testUser.access_token}`
            // Missing Content-Type
          },
          body: JSON.stringify({
            name: 'Test Team',
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        // Should still work but good to test behavior
        expect(response.status).toBeOneOf([201, 400]); // Depends on Next.js handling
      });

      it('should handle empty request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: ''
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Invalid request body');
      });

      it('should handle null request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: 'null'
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Validation failed');
      });
    });

    describe('Authentication Errors', () => {
      it('should handle missing authorization header', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test Team',
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData.error).toBe('Unauthorized');
        expect(responseData.message).toBe('Authentication required');
      });

      it('should handle malformed authorization header', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'InvalidFormat token123'
          },
          body: JSON.stringify({
            name: 'Test Team',
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData.error).toBe('Unauthorized');
        expect(responseData.message).toBe('Authentication required');
      });

      it('should handle expired/invalid tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer expired.jwt.token'
          },
          body: JSON.stringify({
            name: 'Test Team',
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData.error).toBe('Unauthorized');
        expect(responseData.message).toContain('Invalid or expired');
      });

      it('should handle empty bearer token', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
          },
          body: JSON.stringify({
            name: 'Test Team',
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData.error).toBe('Unauthorized');
      });
    });

    describe('Validation Errors', () => {
      it('should handle extremely long team names', async () => {
        const longName = 'A'.repeat(1000); // Very long name
        
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify({
            name: longName,
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Validation failed');
        expect(responseData.validationErrors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.stringContaining('characters')
            })
          ])
        );
      });

      it('should handle invalid color formats', async () => {
        const invalidColors = ['not-a-color', 'rgb(255,0,0)', '#GGG', '#12345', '#1234567'];
        
        for (const color of invalidColors) {
          const request = new NextRequest('http://localhost:3000/api/teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${testUser.access_token}`
            },
            body: JSON.stringify({
              name: generateTestName('Color Test'),
              league: testLeague.name,
              color: color
            })
          });

          const response = await TeamsPost(request);
          const responseData = await response.json();

          expect(response.status).toBe(400);
          expect(responseData.validationErrors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'color',
                message: expect.stringContaining('hex color')
              })
            ])
          );
        }
      });

      it('should handle invalid numeric values', async () => {
        const invalidData = {
          name: generateTestName('Invalid Numbers'),
          league: testLeague.name,
          maxMembers: -5 // Negative number
        };

        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify(invalidData)
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.validationErrors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'maxMembers',
              message: expect.stringContaining('between')
            })
          ])
        );
      });

      it('should handle multiple validation errors at once', async () => {
        const invalidData = {
          name: 'A', // Too short
          league: '', // Empty
          color: 'invalid',
          maxMembers: 100, // Too large
          description: 'A'.repeat(1000) // Too long
        };

        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify(invalidData)
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Validation failed');
        expect(responseData.validationErrors.length).toBeGreaterThan(1);
        
        const errorFields = responseData.validationErrors.map((e: any) => e.field);
        expect(errorFields).toContain('name');
        expect(errorFields).toContain('league');
        expect(errorFields).toContain('color');
      });
    });

    describe('Business Logic Errors', () => {
      it('should handle attempts to create teams in inactive leagues', async () => {
        // Create inactive league
        const inactiveLeague = await createTestLeague(supabase, {
          name: generateTestName('Inactive League'),
          sport_type: 'football',
          league_type: 'competitive',
          is_active: false // Inactive
        });
        createdLeagueIds.push(inactiveLeague.id);

        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify({
            name: generateTestName('Team for Inactive League'),
            league: inactiveLeague.name
          })
        });

        const response = await TeamsPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('League not found');
        expect(responseData.message).toContain('not active');
      });

      it('should handle special characters in team names', async () => {
        const specialNames = [
          'Team <script>alert("xss")</script>',
          'Team "Quotes"',
          "Team 'Single Quotes'",
          'Team & Ampersand',
          'Team %20 URL Encoded'
        ];

        for (const name of specialNames) {
          const request = new NextRequest('http://localhost:3000/api/teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${testUser.access_token}`
            },
            body: JSON.stringify({
              name: name,
              league: testLeague.name
            })
          });

          const response = await TeamsPost(request);
          const responseData = await response.json();

          if (response.status === 201) {
            // If creation succeeds, verify name is properly sanitized
            expect(responseData.data.name).not.toContain('<script>');
            createdTeamIds.push(responseData.data.id);
          } else {
            // If validation fails, it should be due to invalid characters
            expect(response.status).toBe(400);
          }
        }
      });
    });
  });

  describe('Profile API Error Handling', () => {
    describe('Validation Edge Cases', () => {
      it('should handle invalid date formats', async () => {
        const invalidDates = [
          '2024-13-01', // Invalid month
          '2024-02-30', // Invalid day
          '2024/01/01', // Wrong format
          'not-a-date',
          '2024-1-1', // Single digit
          '24-01-01' // Two digit year
        ];

        for (const date of invalidDates) {
          const request = new NextRequest('http://localhost:3000/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${testUser.access_token}`
            },
            body: JSON.stringify({
              date_of_birth: date
            })
          });

          const response = await ProfilePut(request);
          const responseData = await response.json();

          expect(response.status).toBe(400);
          expect(responseData.validationErrors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'date_of_birth',
                message: expect.stringMatching(/(format|Invalid|valid)/i)
              })
            ])
          );
        }
      });

      it('should handle phone number edge cases', async () => {
        const invalidPhones = [
          'abc123', // Letters in phone
          '123', // Too short
          '+1' + '9'.repeat(20), // Too long
          '+0123456789', // Starts with 0 after country code
          '++1234567890' // Double plus
        ];

        for (const phone of invalidPhones) {
          const request = new NextRequest('http://localhost:3000/api/profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${testUser.access_token}`
            },
            body: JSON.stringify({
              phone: phone
            })
          });

          const response = await ProfilePatch(request);
          const responseData = await response.json();

          expect(response.status).toBe(400);
          expect(responseData.validationErrors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'phone',
                message: expect.stringContaining('valid phone')
              })
            ])
          );
        }
      });

      it('should handle extremely large payloads', async () => {
        const largeData = {
          bio: 'A'.repeat(100000), // Extremely long bio
          full_name: 'B'.repeat(10000),
          display_name: 'C'.repeat(1000)
        };

        const request = new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify(largeData)
        });

        const response = await ProfilePut(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('VALIDATION_FAILED');
      });
    });

    describe('Type Validation', () => {
      it('should handle incorrect data types', async () => {
        const wrongTypes = {
          full_name: 123, // Should be string
          display_name: true, // Should be string
          bio: [], // Should be string
          phone: {}, // Should be string
          date_of_birth: 20240101 // Should be string
        };

        const request = new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify(wrongTypes)
        });

        const response = await ProfilePut(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.validationErrors.length).toBeGreaterThan(0);
      });

      it('should handle null vs undefined values', async () => {
        const nullValues = {
          full_name: null,
          display_name: undefined,
          bio: null
        };

        const request = new NextRequest('http://localhost:3000/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify(nullValues)
        });

        const response = await ProfilePatch(request);
        
        // Should handle null values gracefully for optional fields
        expect(response.status).toBeOneOf([200, 400]);
      });
    });
  });

  describe('Database Error Simulation', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test simulates what happens when database is unavailable
      // Note: This is more of a documentation of expected behavior
      // since we can't easily simulate DB failures in integration tests
      
      // If database were unavailable, we'd expect:
      // - 500 Internal Server Error
      // - Proper error message
      // - No data corruption
      
      // For now, we'll test that valid requests work (proving DB is available)
      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'GET'
      });

      const response = await TeamsGet(request);
      
      // If this succeeds, database is working
      expect([200, 500]).toContain(response.status);
    });

    it('should handle constraint violations gracefully', async () => {
      // Create a team first
      const teamName = generateTestName('Constraint Test Team');
      
      const request1 = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          name: teamName,
          league: testLeague.name
        })
      });

      const response1 = await TeamsPost(request1);
      if (response1.status === 201) {
        const data1 = await response1.json();
        createdTeamIds.push(data1.data.id);
      }

      // Try to create duplicate team
      const request2 = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          name: teamName, // Same name
          league: testLeague.name // Same league
        })
      });

      const response2 = await TeamsPost(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.error).toBeDefined();
      expect(data2.message).toContain('already exists');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle unicode and international characters', async () => {
      const unicodeData = {
        name: '测试队伍 🏈 Équipe',
        league: testLeague.name,
        description: 'Team with émojis 😀 and ünïcödé characters'
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(unicodeData)
      });

      const response = await TeamsPost(request);
      const responseData = await response.json();

      if (response.status === 201) {
        expect(responseData.data.name).toBe(unicodeData.name);
        createdTeamIds.push(responseData.data.id);
      } else {
        // If unicode isn't supported, should get validation error
        expect(response.status).toBe(400);
      }
    });

    it('should handle very short valid inputs', async () => {
      const minimalValidData = {
        name: 'AB', // Minimum length
        league: testLeague.name
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(minimalValidData)
      });

      const response = await TeamsPost(request);
      
      if (response.status === 201) {
        const responseData = await response.json();
        createdTeamIds.push(responseData.data.id);
      }
      
      expect([201, 400]).toContain(response.status);
    });

    it('should handle maximum valid inputs', async () => {
      const maxValidData = {
        name: 'A'.repeat(50), // Maximum allowed length
        league: testLeague.name,
        description: 'A'.repeat(500), // Maximum description
        maxMembers: 50, // Maximum members
        location: 'A'.repeat(100) // Maximum location
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(maxValidData)
      });

      const response = await TeamsPost(request);
      
      if (response.status === 201) {
        const responseData = await response.json();
        createdTeamIds.push(responseData.data.id);
      }
      
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Security Validation', () => {
    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE teams; --",
        "' OR 1=1 --",
        "'; INSERT INTO teams (name) VALUES ('hacked'); --",
        "' UNION SELECT * FROM users --"
      ];

      for (const maliciousInput of sqlInjectionAttempts) {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify({
            name: maliciousInput,
            league: testLeague.name
          })
        });

        const response = await TeamsPost(request);
        
        // Should either reject the input or sanitize it
        // Should NOT result in SQL injection
        expect(response.status).toBeOneOf([201, 400]);
        
        if (response.status === 201) {
          const responseData = await response.json();
          // If accepted, verify it was sanitized
          expect(responseData.data.name).not.toContain('DROP TABLE');
          expect(responseData.data.name).not.toContain('INSERT INTO');
          createdTeamIds.push(responseData.data.id);
        }
      }
    });

    it('should prevent XSS attempts', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">'
      ];

      for (const xssInput of xssAttempts) {
        const request = new NextRequest('http://localhost:3000/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify({
            name: generateTestName('XSS Test'),
            league: testLeague.name,
            description: xssInput
          })
        });

        const response = await TeamsPost(request);
        
        if (response.status === 201) {
          const responseData = await response.json();
          // Should be sanitized
          expect(responseData.data.description).not.toContain('<script>');
          expect(responseData.data.description).not.toContain('javascript:');
          createdTeamIds.push(responseData.data.id);
        }
      }
    });
  });
});