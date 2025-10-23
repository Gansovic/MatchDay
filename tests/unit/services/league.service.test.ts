/**
 * LeagueService Unit Tests - Comprehensive Coverage
 *
 * Tests for all public methods of LeagueService including:
 * - League creation and publishing (admin operations)
 * - League discovery with advanced filtering
 * - Compatibility scoring and team availability
 * - Player league memberships
 * - Cache management and real-time subscriptions
 */

import { LeagueService } from '../../../packages/services/src/league.service';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
  channel: jest.fn(),
} as unknown as SupabaseClient;

// Mock global fetch for getLeagueDetails
global.fetch = jest.fn();

describe('LeagueService', () => {
  let leagueService: LeagueService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (LeagueService as any).instance = undefined;
    leagueService = LeagueService.getInstance(mockSupabaseClient);
    // Clear cache to prevent test interference
    leagueService.clearCache();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = LeagueService.getInstance(mockSupabaseClient);
      const instance2 = LeagueService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if getInstance called without client on first initialization', () => {
      // Reset the singleton
      (LeagueService as any).instance = undefined;

      expect(() => {
        LeagueService.getInstance();
      }).toThrow('SupabaseClient required for first initialization');
    });

    it('should update supabase client when getInstance called with new client', () => {
      const newMockClient = {
        from: jest.fn(),
      } as unknown as SupabaseClient;

      const instance = LeagueService.getInstance(newMockClient);

      expect(instance).toBe(leagueService);
    });
  });

  describe('createLeague', () => {
    it('should successfully create a league with default values', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        sport_type: 'football',
        league_type: 'competitive',
        created_by: 'user123',
        is_active: true,
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLeague,
              error: null,
            }),
          }),
        }),
      });

      const result = await leagueService.createLeague('Test League', 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeague);
      expect(result.data?.name).toBe('Test League');
      expect(result.data?.is_public).toBe(false);
    });

    it('should clear cache after successful league creation', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        created_by: 'user123',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLeague,
              error: null,
            }),
          }),
        }),
      });

      const clearCacheSpy = jest.spyOn(leagueService, 'clearCache');

      await leagueService.createLeague('Test League', 'user123');

      expect(clearCacheSpy).toHaveBeenCalledWith('discoverLeagues');
      expect(clearCacheSpy).toHaveBeenCalledWith('getAdminLeagues');
    });

    it('should return error on database constraint violation', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint',
              },
            }),
          }),
        }),
      });

      const result = await leagueService.createLeague('Duplicate League', 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('23505');
    });

    it('should handle database errors gracefully', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'CONNECTION_ERROR',
                message: 'Database connection failed',
              },
            }),
          }),
        }),
      });

      const result = await leagueService.createLeague('Test League', 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('publishLeague', () => {
    it('should successfully publish a league (set is_public to true)', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        is_public: true,
        updated_at: new Date().toISOString(),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockLeague,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.publishLeague({
        leagueId: 'league123',
        isPublic: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.is_public).toBe(true);
    });

    it('should successfully unpublish a league (set is_public to false)', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        is_public: false,
        updated_at: new Date().toISOString(),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockLeague,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.publishLeague({
        leagueId: 'league123',
        isPublic: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.is_public).toBe(false);
    });

    it('should update max_teams when provided', async () => {
      const mockLeague = {
        id: 'league123',
        name: 'Test League',
        is_public: true,
        max_teams: 16,
        updated_at: new Date().toISOString(),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockLeague,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.publishLeague({
        leagueId: 'league123',
        isPublic: true,
        maxTeams: 16,
      });

      expect(result.success).toBe(true);
      expect(result.data?.max_teams).toBe(16);
    });

    it('should return error if league not found', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: {
                  code: 'PGRST116',
                  message: 'League not found',
                },
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.publishLeague({
        leagueId: 'nonexistent',
        isPublic: true,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PGRST116');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: {
                  code: 'DB_ERROR',
                  message: 'Database error',
                },
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.publishLeague({
        leagueId: 'league123',
        isPublic: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAdminLeagues', () => {
    it('should retrieve leagues created by admin with team counts', async () => {
      const mockLeagues = [
        {
          id: 'league1',
          name: 'Admin League 1',
          created_by: 'admin123',
          is_active: true,
          teams: [
            { id: 'team1', name: 'Team 1' },
            { id: 'team2', name: 'Team 2' },
          ],
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLeagues,
                      error: null,
                      count: 1,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getAdminLeagues('admin123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should return cached data when available', async () => {
      const mockLeagues = [
        { id: 'league1', name: 'Cached League', created_by: 'admin123', teams: [] },
      ];

      // First call - populate cache
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLeagues,
                      error: null,
                      count: 1,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      await leagueService.getAdminLeagues('admin123');

      // Clear mocks
      jest.clearAllMocks();

      // Second call - should use cache
      const result2 = await leagueService.getAdminLeagues('admin123');

      expect(result2.success).toBe(true);
      // Supabase client should not be called again
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                      count: 50,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getAdminLeagues('admin123', {
        limit: 10,
        offset: 20,
      });

      expect(result.success).toBe(true);
      expect(result.pagination?.page).toBe(3); // offset 20 / limit 10 + 1
      expect(result.pagination?.hasNext).toBe(true);
      expect(result.pagination?.hasPrevious).toBe(true);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: null,
                  error: {
                    code: 'DB_ERROR',
                    message: 'Database error',
                  },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.getAdminLeagues('admin123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('discoverLeagues', () => {
    const mockLeagues = [
      {
        id: 'league1',
        name: 'Public League 1',
        sport_type: 'football',
        league_type: 'competitive',
        location: 'New York',
        is_active: true,
        is_public: true,
        teams: [],
      },
    ];

    it('should discover public leagues without filters', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLeagues,
                      error: null,
                      count: 1,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by sport type', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: mockLeagues,
                    error: null,
                    count: 1,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues({
        sportType: 'football',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by league type', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockLeagues,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues({
        leagueType: 'competitive',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by location (ilike)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: mockLeagues,
                        error: null,
                        count: 1,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues({
        location: 'New York',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by search (name/description)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  or: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: mockLeagues,
                        error: null,
                        count: 1,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues({
        search: 'test',
      });

      expect(result.success).toBe(true);
    });

    it('should check user membership when userId provided', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLeagues,
                      error: null,
                      count: 1,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [{ team: { league_id: 'league1' } }],
                error: null,
                count: 1,
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.discoverLeagues({}, { userId: 'user123' });

      expect(result.success).toBe(true);
    });

    it('should calculate compatibility scores when requested', async () => {
      // This test verifies the option is handled, detailed compatibility testing is in separate describe block
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLeagues,
                      error: null,
                      count: 1,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user123', location: 'New York' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'player_cross_league_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      });

      // Mock fetch for getLeagueDetails in calculateCompatibilityScore
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeagues[0],
        }),
      });

      const result = await leagueService.discoverLeagues(
        {},
        { userId: 'user123', includeCompatibilityScore: true }
      );

      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: null,
                  error: {
                    code: 'DB_ERROR',
                    message: 'Database error',
                  },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await leagueService.discoverLeagues();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getLeagueDetails', () => {
    const mockLeagueData = {
      id: 'league123',
      name: 'Test League',
      sport_type: 'football',
      is_active: true,
      is_public: true,
      max_teams: 16,
      teams: [
        {
          id: 'team1',
          name: 'Team 1',
          max_players: 11,
          team_members: [
            { id: 'member1', user_id: 'user1', is_active: true },
            { id: 'member2', user_id: 'user2', is_active: true },
          ],
        },
      ],
    };

    it('should fetch league details via API endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeagueData,
        }),
      });

      const result = await leagueService.getLeagueDetails('league123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('league123');
      expect(global.fetch).toHaveBeenCalledWith('/api/leagues/league123');
    });

    it('should return cached data when available', async () => {
      // First call - populate cache
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeagueData,
        }),
      });

      await leagueService.getLeagueDetails('league123');

      // Clear fetch mock
      (global.fetch as jest.Mock).mockClear();

      // Second call - should use cache
      const result2 = await leagueService.getLeagueDetails('league123');

      expect(result2.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should process teams with player counts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeagueData,
        }),
      });

      const result = await leagueService.getLeagueDetails('league123');

      expect(result.success).toBe(true);
      expect(result.data?.playerCount).toBe(2); // 2 active members
      expect(result.data?.teamCount).toBe(1);
    });

    it('should return error for 404 league not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'League not found',
        }),
      });

      const result = await leagueService.getLeagueDetails('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LEAGUE_NOT_FOUND');
    });

    it('should handle API request errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await leagueService.getLeagueDetails('league123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
    });
  });

  describe('calculateCompatibilityScore', () => {
    const mockLeague = {
      id: 'league123',
      name: 'Test League',
      sport_type: 'football',
      league_type: 'competitive',
      location: 'New York',
      entry_fee: 50,
      season_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      season_end: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
      availableSpots: 15,
      teams: [],
      teamCount: 0,
      playerCount: 0,
      isUserMember: false,
    };

    it('should calculate compatibility with all factors', async () => {
      // Mock getLeagueDetails
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeague,
        }),
      });

      // Mock user profile and stats
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'user123',
                    display_name: 'Test User',
                    location: 'New York',
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'player_cross_league_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      player_id: 'user123',
                      avg_goals_per_game: 0.6,
                      total_games_played: 20,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.calculateCompatibilityScore('league123', 'user123');

      expect(result.success).toBe(true);
      expect(result.data?.score).toBeGreaterThan(0);
      expect(result.data?.factors).toBeDefined();
      expect(result.data?.factors.skillMatch).toBeDefined();
      expect(result.data?.factors.locationProximity).toBeDefined();
    });

    it('should return cached score when available', async () => {
      // First call
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeague,
        }),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user123', location: 'New York' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      await leagueService.calculateCompatibilityScore('league123', 'user123');

      // Clear mocks
      jest.clearAllMocks();

      // Second call - should use cache
      const result2 = await leagueService.calculateCompatibilityScore('league123', 'user123');

      expect(result2.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should generate recommendations based on low scores', async () => {
      const lowScoreLeague = {
        ...mockLeague,
        location: 'Los Angeles', // Different location
        entry_fee: 150, // High fee
        availableSpots: 2, // Limited spots
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: lowScoreLeague,
        }),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user123', location: 'New York' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { total_games_played: 5 },
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      const result = await leagueService.calculateCompatibilityScore('league123', 'user123');

      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toBeDefined();
      expect(result.data?.recommendations.length).toBeGreaterThan(0);
    });

    it('should return neutral score (50) for new players without stats', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeague,
        }),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user123', location: 'New York' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'player_cross_league_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null, // No stats for new player
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.calculateCompatibilityScore('league123', 'user123');

      expect(result.success).toBe(true);
      expect(result.data?.factors.skillMatch).toBe(50);
    });

    it('should handle league not found error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'League not found',
        }),
      });

      const result = await leagueService.calculateCompatibilityScore('nonexistent', 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAvailableTeams', () => {
    it('should retrieve teams with available spots', async () => {
      const mockTeams = [
        {
          id: 'team1',
          name: 'Team 1',
          captain_id: 'captain1',
          max_players: 11,
          is_recruiting: true,
          team_members: [
            { id: 'member1', user_id: 'user1', is_active: true },
            { id: 'member2', user_id: 'user2', is_active: true },
          ],
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'captain1', display_name: 'Captain Name' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getAvailableTeams('league123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.[0].availableSpots).toBe(9); // 11 - 2 active members
    });

    it('should filter out full teams (availableSpots = 0)', async () => {
      const mockTeams = [
        {
          id: 'team1',
          name: 'Full Team',
          max_players: 2,
          is_recruiting: true,
          team_members: [
            { id: 'member1', is_active: true },
            { id: 'member2', is_active: true },
          ],
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getAvailableTeams('league123');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0); // Full team filtered out
    });

    it('should include captain contact information', async () => {
      const mockTeams = [
        {
          id: 'team1',
          name: 'Team 1',
          captain_id: 'captain1',
          max_players: 11,
          is_recruiting: true,
          team_members: [],
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'captain1', display_name: 'Captain Name' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getAvailableTeams('league123');

      expect(result.success).toBe(true);
      expect(result.data?.[0].captainContact).toBeDefined();
      expect(result.data?.[0].captainContact?.name).toBe('Captain Name');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'DB_ERROR',
                message: 'Database error',
              },
            }),
          }),
        }),
      });

      const result = await leagueService.getAvailableTeams('league123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPlayerLeagueMemberships', () => {
    it('should retrieve player\'s active league memberships', async () => {
      const mockMemberships = [
        {
          id: 'membership1',
          user_id: 'user123',
          team_id: 'team1',
          position: 'Forward',
          jersey_number: 10,
          joined_at: '2024-01-01T00:00:00Z',
          is_active: true,
          team: {
            id: 'team1',
            name: 'Team 1',
            league_id: 'league1',
            league: {
              id: 'league1',
              name: 'Test League',
              is_active: true,
            },
          },
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'team1', name: 'Team 1' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getPlayerLeagueMemberships('user123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.[0].isUserMember).toBe(true);
    });

    it('should return cached data when available', async () => {
      const mockMemberships = [
        {
          id: 'membership1',
          user_id: 'user123',
          team_id: 'team1',
          team: {
            id: 'team1',
            name: 'Team 1',
            league_id: 'league1',
            league: {
              id: 'league1',
              name: 'Test League',
            },
          },
        },
      ];

      // First call
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      await leagueService.getPlayerLeagueMemberships('user123');

      // Clear mocks
      jest.clearAllMocks();

      // Second call - should use cache
      const result2 = await leagueService.getPlayerLeagueMemberships('user123');

      expect(result2.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should include team membership details', async () => {
      const mockMemberships = [
        {
          id: 'membership1',
          user_id: 'user123',
          team_id: 'team1',
          position: 'Forward',
          jersey_number: 10,
          joined_at: '2024-01-01T00:00:00Z',
          is_active: true,
          team: {
            id: 'team1',
            name: 'Team 1',
            league_id: 'league1',
            league: {
              id: 'league1',
              name: 'Test League',
            },
          },
        },
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const result = await leagueService.getPlayerLeagueMemberships('user123');

      expect(result.success).toBe(true);
      expect(result.data?.[0].teamMembership).toBeDefined();
      expect(result.data?.[0].teamMembership.position).toBe('Forward');
      expect(result.data?.[0].teamMembership.jerseyNumber).toBe(10);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'DB_ERROR',
                message: 'Database error',
              },
            }),
          }),
        }),
      });

      const result = await leagueService.getPlayerLeagueMemberships('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache when pattern not provided', () => {
      // Add some cache entries
      const service = leagueService as any;
      service.cache.set('test1', { data: 'value1', timestamp: Date.now(), ttl: 600 });
      service.cache.set('test2', { data: 'value2', timestamp: Date.now(), ttl: 600 });

      expect(service.cache.size).toBe(2);

      leagueService.clearCache();

      expect(service.cache.size).toBe(0);
    });

    it('should clear cache matching specific pattern', () => {
      const service = leagueService as any;
      service.cache.set('league_service:discoverLeagues:test', {
        data: 'value1',
        timestamp: Date.now(),
        ttl: 600,
      });
      service.cache.set('league_service:getAdminLeagues:test', {
        data: 'value2',
        timestamp: Date.now(),
        ttl: 600,
      });
      service.cache.set('league_service:otherMethod:test', {
        data: 'value3',
        timestamp: Date.now(),
        ttl: 600,
      });

      expect(service.cache.size).toBe(3);

      leagueService.clearCache('discoverLeagues');

      expect(service.cache.size).toBe(2);
      expect(service.cache.has('league_service:discoverLeagues:test')).toBe(false);
      expect(service.cache.has('league_service:getAdminLeagues:test')).toBe(true);
    });
  });

  describe('Realtime Subscriptions', () => {
    it('should set up realtime subscription for league updates', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      (mockSupabaseClient.channel as jest.Mock).mockReturnValue(mockChannel);

      const callback = jest.fn();
      leagueService.subscribeToLeagueUpdates('league123', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('league-league123-updates');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          table: 'leagues',
          filter: 'id=eq.league123',
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
      const options = {
        table: 'teams',
        event: 'INSERT' as const,
        schema: 'public',
        filter: 'league_id=eq.league123',
      };

      leagueService.subscribeToLeagueUpdates('league123', callback, options);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          table: 'teams',
          filter: 'league_id=eq.league123',
        }),
        callback
      );
    });
  });
});
