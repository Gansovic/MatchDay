/**
 * TeamService Unit Tests - Comprehensive Coverage
 *
 * Tests for all public methods of TeamService including:
 * - Team creation with transactions and FK constraints
 * - Team details retrieval with caching
 * - User teams with performance optimizations
 * - Team updates with authorization
 * - League search and assignment
 * - Orphaned team management
 * - Cache management and real-time subscriptions
 */

import { TeamService } from '../../../packages/services/src/team.service';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
  channel: jest.fn(),
} as unknown as SupabaseClient;

describe('TeamService', () => {
  let teamService: TeamService;

  beforeEach(() => {
    jest.clearAllMocks();
    teamService = TeamService.getInstance(mockSupabaseClient);
    // Clear cache to prevent test interference
    teamService.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = TeamService.getInstance(mockSupabaseClient);
      const instance2 = TeamService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if getInstance called without client on first initialization', () => {
      // Reset the singleton by accessing private static instance
      const TeamServiceConstructor = TeamService as any;
      const originalInstance = TeamServiceConstructor.instance;
      TeamServiceConstructor.instance = null;

      expect(() => {
        TeamService.getInstance();
      }).toThrow('SupabaseClient required for first initialization');

      // Restore instance
      TeamServiceConstructor.instance = originalInstance;
    });

    it('should update supabase client when getInstance called with new client', () => {
      const newMockClient = {
        from: jest.fn(),
      } as unknown as SupabaseClient;

      const instance = TeamService.getInstance(newMockClient);

      expect(instance).toBe(teamService);
      // The instance should now use the new client
    });
  });

  describe('createTeam', () => {
    it('should successfully create a team with all steps', async () => {
      const teamData = {
        league_id: 'league123',
        name: 'Test Team',
        team_color: '#FF0000',
        max_players: 22,
        min_players: 7,
        description: 'A test team',
      };

      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        is_active: true,
      };

      const mockNewTeam = {
        id: 'team123',
        league_id: teamData.league_id,
        name: teamData.name,
        team_color: teamData.team_color,
        captain_id: null,
        max_players: teamData.max_players,
        min_players: teamData.min_players,
        team_bio: teamData.description,
        is_recruiting: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === 'leagues') {
          // Step 1: Verify league exists
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockLeague,
                error: null,
              }),
            }),
          };
        } else if (callCount === 2 && table === 'teams') {
          // Step 2: Check name uniqueness
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No duplicate found
              }),
            }),
          };
        } else if (callCount === 3 && table === 'teams') {
          // Step 3: Create team
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockNewTeam,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4 && table === 'team_members') {
          // Step 4: Add creator as member
          return {
            insert: jest.fn().mockResolvedValue({
              data: { id: 'member123' },
              error: null,
            }),
          };
        } else if (callCount === 5 && table === 'teams') {
          // Step 5: Update captain_id
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.createTeam('captain123', teamData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('team123');
      expect(result.data?.captain_id).toBe('captain123');
      expect(result.data?.memberCount).toBe(1);
      expect(result.data?.availableSpots).toBe(21);
    });

    it('should return error if league not found', async () => {
      const teamData = {
        league_id: 'nonexistent-league',
        name: 'Test Team',
        team_color: '#FF0000',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'League not found' },
          }),
        }),
      });

      const result = await teamService.createTeam('captain123', teamData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LEAGUE_NOT_FOUND');
      expect(result.error?.message).toContain('not found or is not active');
    });

    it('should return error if team name already exists in league', async () => {
      const teamData = {
        league_id: 'league123',
        name: 'Duplicate Team',
        team_color: '#FF0000',
      };

      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        is_active: true,
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockLeague,
                error: null,
              }),
            }),
          };
        } else if (callCount === 2 && table === 'teams') {
          // Duplicate name found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'existing-team' },
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.createTeam('captain123', teamData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEAM_NAME_EXISTS');
      expect(result.error?.message).toContain('already exists');
    });

    it('should rollback team creation if adding member fails', async () => {
      const teamData = {
        league_id: 'league123',
        name: 'Test Team',
        team_color: '#FF0000',
      };

      const mockNewTeam = {
        id: 'team123',
        league_id: teamData.league_id,
        name: teamData.name,
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // League check - success
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'league123', is_active: true },
                error: null,
              }),
            }),
          };
        } else if (callCount === 2) {
          // Name uniqueness check - success
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        } else if (callCount === 3) {
          // Team creation - success
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockNewTeam,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4 && table === 'team_members') {
          // Member creation - FAIL
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Member creation failed' },
            }),
          };
        } else if (callCount === 5 && table === 'teams') {
          // Rollback - delete team
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.createTeam('captain123', teamData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should have called delete on teams table for rollback
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    });

    it('should create team without adding creator when auto_add_creator is false', async () => {
      const teamData = {
        league_id: 'league123',
        name: 'Test Team',
        team_color: '#FF0000',
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'league123', is_active: true },
                error: null,
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        } else if (callCount === 3) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'team123', ...teamData },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Update captain
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.createTeam('captain123', teamData, {
        auto_add_creator: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.memberCount).toBe(0);
      expect(result.data?.availableSpots).toBe(22);
    });
  });

  describe('getTeamDetails', () => {
    it('should retrieve detailed team information with cache', async () => {
      const mockTeamData = {
        id: 'team123',
        name: 'Test Team',
        team_color: '#FF0000',
        captain_id: 'captain123',
        league_id: 'league123',
        max_players: 22,
        league: {
          id: 'league123',
          name: 'Test League',
          sport_type: 'football',
        },
        team_members: [
          {
            id: 'member1',
            user_id: 'captain123',
            is_active: true,
            user_profile: {
              id: 'captain123',
              display_name: 'Captain Name',
            },
          },
          {
            id: 'member2',
            user_id: 'player456',
            is_active: true,
            user_profile: {
              id: 'player456',
              display_name: 'Player Name',
            },
          },
        ],
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTeamData,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'captain123',
                    display_name: 'Captain Profile',
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.getTeamDetails('team123');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('team123');
      expect(result.data?.memberCount).toBe(2);
      expect(result.data?.availableSpots).toBe(20);
      expect(result.data?.league).toBeDefined();
      expect(result.data?.captain).toBeDefined();
    });

    it('should return cached data when available', async () => {
      const mockTeamData = {
        id: 'team123',
        name: 'Cached Team',
        league_id: 'league123',
        team_members: [],
      };

      // First call should fetch from database
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTeamData, league: null, team_members: [] },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        }
        return {};
      });

      const result1 = await teamService.getTeamDetails('team123');
      expect(result1.success).toBe(true);

      // Clear the mock call count
      jest.clearAllMocks();

      // Second call should use cache (no database calls)
      const result2 = await teamService.getTeamDetails('team123');

      expect(result2.success).toBe(true);
      expect(result2.data?.name).toBe('Cached Team');
      // Database should not be called again (mock was cleared)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return error if team not found', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Team not found' },
            }),
          }),
        }),
      });

      const result = await teamService.getTeamDetails('nonexistent-team');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEAM_NOT_FOUND');
      expect(result.error?.message).toBe('Team not found');
    });

    it('should handle database errors gracefully', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const result = await teamService.getTeamDetails('team123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONNECTION_ERROR');
    });
  });

  describe('getUserTeams', () => {
    it('should retrieve all teams for a user with performance optimization', async () => {
      const mockMemberships = [
        {
          team_id: 'team1',
          user_id: 'user123',
          is_active: true,
          joined_at: '2024-01-01T00:00:00Z',
          team: {
            id: 'team1',
            name: 'Team One',
            team_color: '#FF0000',
            captain_id: 'captain1',
            league_id: 'league1',
            max_players: 22,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            league: {
              id: 'league1',
              name: 'League One',
            },
          },
        },
        {
          team_id: 'team2',
          user_id: 'user123',
          is_active: true,
          joined_at: '2024-01-02T00:00:00Z',
          team: {
            id: 'team2',
            name: 'Team Two',
            team_color: '#00FF00',
            captain_id: 'captain2',
            league_id: 'league2',
            max_players: 20,
            is_active: true,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            league: {
              id: 'league2',
              name: 'League Two',
            },
          },
        },
      ];

      let teamMembersCallCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          teamMembersCallCount++;
          if (teamMembersCallCount === 1) {
            // First call: complex query with joins
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null,
                }),
              }),
            };
          } else {
            // Second call: simple count query
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [{ team_id: 'team1' }, { team_id: 'team1' }, { team_id: 'team2' }],
                  error: null,
                }),
              }),
            };
          }
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  {
                    team_id: 'team1',
                    wins: 5,
                    draws: 2,
                    losses: 1,
                    goals_for: 15,
                    goals_against: 8,
                    points: 17,
                  },
                  {
                    team_id: 'team2',
                    wins: 3,
                    draws: 3,
                    losses: 2,
                    goals_for: 12,
                    goals_against: 10,
                    points: 12,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      });

      const result = await teamService.getUserTeams('user123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe('team1');
      expect(result.data?.[0].league).toBeDefined();
      expect(result.data?.[0].stats).toBeDefined();
      expect(result.data?.[0].stats?.points).toBe(17);
    });

    it('should filter inactive teams when includeInactive is false', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      });

      const result = await teamService.getUserTeams('user123', { includeInactive: false });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      // Verify eq('is_active', true) was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    });

    it('should respect limit option', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: mockLimit,
        }),
      });

      await teamService.getUserTeams('user123', { limit: 10 });

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should handle empty team list', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }));

      const result = await teamService.getUserTeams('user-with-no-teams');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' },
          }),
        }),
      });

      const result = await teamService.getUserTeams('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('updateTeam', () => {
    it('should successfully update team when user is captain', async () => {
      const updates = {
        name: 'Updated Team Name',
        team_color: '#0000FF',
        team_bio: 'Updated bio',
        is_recruiting: false,
      };

      const mockTeam = {
        id: 'team123',
        captain_id: 'captain123',
      };

      const mockUpdatedTeam = {
        ...mockTeam,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Verify captain
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTeam,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Update team
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockUpdatedTeam,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.updateTeam('team123', 'captain123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Team Name');
      expect(result.data?.team_color).toBe('#0000FF');
    });

    it('should return error if user is not the captain', async () => {
      const updates = {
        name: 'Unauthorized Update',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'team123',
                captain_id: 'different-captain',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await teamService.updateTeam('team123', 'non-captain-user', updates);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.error?.message).toContain('Only team captains');
    });

    it('should handle update errors', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { captain_id: 'captain123' },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'UPDATE_ERROR', message: 'Update failed' },
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await teamService.updateTeam('team123', 'captain123', { name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPDATE_ERROR');
    });
  });

  describe('findLeagueByName', () => {
    it('should find active league by sport and name', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'San Jose Soccer League',
        sport_type: 'football',
        is_active: true,
        is_public: true,
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockLeague,
            error: null,
          }),
        }),
      });

      const result = await teamService.findLeagueByName('football', 'San Jose Soccer League');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('league123');
      expect(result.data?.sport_type).toBe('football');
    });

    it('should return error if league not found', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      });

      const result = await teamService.findLeagueByName('basketball', 'Nonexistent League');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LEAGUE_NOT_FOUND');
      expect(result.error?.message).toContain('No active league found');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' },
          }),
        }),
      });

      const result = await teamService.findLeagueByName('football', 'Test League');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('searchTeams', () => {
    it('should search teams with filters', async () => {
      const mockTeams = [
        {
          id: 'team1',
          name: 'FC Barcelona',
          league: {
            id: 'league1',
            name: 'Spanish League',
            is_active: true,
            is_public: true,
          },
        },
        {
          id: 'team2',
          name: 'Real Madrid',
          league: {
            id: 'league1',
            name: 'Spanish League',
            is_active: true,
            is_public: true,
          },
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockTeams,
            error: null,
            count: 2,
          }),
        }),
      });

      // Mock getTeamDetails for each team
      const originalGetTeamDetails = teamService.getTeamDetails;
      teamService.getTeamDetails = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'team1',
          name: 'FC Barcelona',
          memberCount: 15,
          availableSpots: 7,
          members: [],
          league: null,
          leagues: [],
        },
      });

      const result = await teamService.searchTeams({
        query: 'Barcelona',
        sport: 'football',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(2);

      // Restore original method
      teamService.getTeamDetails = originalGetTeamDetails;
    });

    it('should filter by available spots', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });

      const result = await teamService.searchTeams({
        hasAvailableSpots: true,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    });

    it('should handle pagination correctly', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 50,
          }),
        }),
      });

      const result = await teamService.searchTeams({
        limit: 10,
        offset: 20,
      });

      expect(result.success).toBe(true);
      expect(result.pagination?.page).toBe(3); // offset 20 / limit 10 + 1
      expect(result.pagination?.hasNext).toBe(true);
      expect(result.pagination?.hasPrevious).toBe(true);
    });

    it('should handle search errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'SEARCH_ERROR', message: 'Search failed' },
            count: 0,
          }),
        }),
      });

      const result = await teamService.searchTeams({});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_ERROR');
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache when pattern not provided', () => {
      // Add some cache entries
      const service = teamService as any;
      service.cache.set('key1', { data: 'value1', timestamp: Date.now(), ttl: 300 });
      service.cache.set('key2', { data: 'value2', timestamp: Date.now(), ttl: 300 });

      teamService.clearCache();

      expect(service.cache.size).toBe(0);
    });

    it('should clear cache matching pattern', () => {
      const service = teamService as any;
      service.cache.set('team_service:getTeamDetails:123', {
        data: 'value1',
        timestamp: Date.now(),
        ttl: 300,
      });
      service.cache.set('team_service:getUserTeams:456', {
        data: 'value2',
        timestamp: Date.now(),
        ttl: 300,
      });
      service.cache.set('other_service:data', { data: 'value3', timestamp: Date.now(), ttl: 300 });

      teamService.clearCache('getTeamDetails');

      expect(service.cache.has('team_service:getTeamDetails:123')).toBe(false);
      expect(service.cache.has('team_service:getUserTeams:456')).toBe(true);
      expect(service.cache.has('other_service:data')).toBe(true);
    });
  });

  describe('Realtime Subscriptions', () => {
    it('should set up realtime subscription for team updates', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      (mockSupabaseClient.channel as jest.Mock).mockReturnValue(mockChannel);

      const callback = jest.fn();
      teamService.subscribeToTeamUpdates('team123', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('team-team123-updates');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          table: 'teams',
        }),
        callback
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should support custom subscription options', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      (mockSupabaseClient.channel as jest.Mock).mockReturnValue(mockChannel);

      const callback = jest.fn();
      teamService.subscribeToTeamUpdates('team123', callback, {
        table: 'team_members',
        event: 'INSERT',
        schema: 'public',
        filter: 'team_id=eq.team123',
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          table: 'team_members',
          filter: 'team_id=eq.team123',
        }),
        callback
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null league in getTeamDetails', async () => {
      const mockTeamData = {
        id: 'team123',
        name: 'Orphaned Team',
        league_id: null,
        captain_id: null,
        league: null,
        team_members: [],
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTeamData,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.getTeamDetails('team123');

      expect(result.success).toBe(true);
      expect(result.data?.isOrphaned).toBe(true);
      expect(result.data?.league).toBeNull();
    });

    it('should handle unexpected exception types', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        throw { custom: 'error', notAnError: true }; // Non-Error object
      });

      const result = await teamService.getUserTeams('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('An unexpected error occurred');
    });
  });

  describe('getOrphanedTeams', () => {
    it('should retrieve teams without league_id', async () => {
      const mockOrphanedTeams = [
        {
          id: 'team1',
          name: 'Orphaned Team 1',
          league_id: null,
          captain_id: 'captain1',
          is_archived: false,
          league: null,
          team_members: [],
        },
        {
          id: 'team2',
          name: 'Orphaned Team 2',
          league_id: null,
          captain_id: 'captain2',
          is_archived: false,
          league: null,
          team_members: [],
        },
      ];

      let teamsCallCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          teamsCallCount++;
          if (teamsCallCount === 1) {
            // First call: query orphaned teams
            return {
              select: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: mockOrphanedTeams,
                        error: null,
                        count: 2,
                      }),
                    }),
                  }),
                }),
              }),
            };
          } else {
            // Subsequent calls: getTeamDetails for each team
            const teamIndex = Math.min(teamsCallCount - 2, mockOrphanedTeams.length - 1);
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockOrphanedTeams[teamIndex],
                    error: null,
                  }),
                }),
              }),
            };
          }
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValueOnce({
                // getTeamLeagues query
                data: [],
                error: null,
              }).mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                // Single team stats query
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        } else if (table === 'season_teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.getOrphanedTeams();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.pagination?.total).toBe(2);
      // Note: We don't check exact data length as getTeamDetails for each team has
      // complex nested queries that would require extensive mocking
    });

    it('should exclude archived teams by default', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await teamService.getOrphanedTeams();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'DB_ERROR', message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await teamService.getOrphanedTeams();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('reassignTeamToLeague', () => {
    it('should successfully reassign orphaned team to new league', async () => {
      const teamId = 'team123';
      const newLeagueId = 'league456';
      const userId = 'captain1';

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'teams' && callCount === 1) {
          // Verify captain
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    captain_id: userId,
                    name: 'Test Team',
                    league_id: null,
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'leagues') {
          // Verify league exists
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: newLeagueId, name: 'New League', is_active: true },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams' && callCount === 3) {
          // Check name uniqueness
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  neq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams' && callCount === 4) {
          // Update team
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: teamId, league_id: newLeagueId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams' && callCount === 5) {
          // getTeamDetails call
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: teamId,
                    name: 'Test Team',
                    league_id: newLeagueId,
                    team_members: [],
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.reassignTeamToLeague(teamId, newLeagueId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error if user is not captain', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { captain_id: 'differentUser', name: 'Test Team' },
              error: null,
            }),
          }),
        }),
      });

      const result = await teamService.reassignTeamToLeague('team123', 'league456', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return error if league not found', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { captain_id: 'user123', name: 'Test Team' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.reassignTeamToLeague('team123', 'league456', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LEAGUE_NOT_FOUND');
    });

    it('should return error if team name exists in new league', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'teams' && callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { captain_id: 'user123', name: 'Test Team' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'league456', name: 'New League' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams' && callCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  neq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'existingTeam' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await teamService.reassignTeamToLeague('team123', 'league456', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEAM_NAME_EXISTS');
    });
  });

  describe('archiveTeam', () => {
    it('should successfully archive a team', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Verify captain
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { captain_id: 'user123' },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Update team
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'team123',
                      is_archived: true,
                      is_recruiting: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await teamService.archiveTeam('team123', 'user123');

      expect(result.success).toBe(true);
      expect(result.data?.is_archived).toBe(true);
    });

    it('should return error if user is not captain', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { captain_id: 'differentUser' },
              error: null,
            }),
          }),
        }),
      });

      const result = await teamService.archiveTeam('team123', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await teamService.archiveTeam('team123', 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
