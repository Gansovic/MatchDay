/**
 * Player Service Test Suite
 *
 * Comprehensive tests for PlayerService covering:
 * - Singleton pattern
 * - Player profiles with complex joins
 * - Cross-league statistics
 * - Global rankings (RPC calls)
 * - Achievements with progress tracking
 * - Team join requests workflow
 * - Player search with filters
 * - Real-time subscriptions
 * - Cache management
 *
 * Target coverage: 80%+ statements, 70%+ branches, 75%+ functions, 80%+ lines
 */

import { PlayerService } from '../../../packages/services/src/player.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../packages/database/src/database.types';

describe('PlayerService', () => {
  let playerService: PlayerService;
  let mockSupabaseClient: any;
  const userId = 'user123';
  const teamId = 'team456';
  const leagueId = 'league789';

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
      channel: jest.fn(),
    } as unknown as SupabaseClient<Database>;

    jest.clearAllMocks();
    (PlayerService as any).instance = undefined;
    playerService = PlayerService.getInstance(mockSupabaseClient);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = PlayerService.getInstance(mockSupabaseClient);
      const instance2 = PlayerService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(playerService);
    });

    it('should throw error if getInstance called without client on first initialization', () => {
      (PlayerService as any).instance = undefined;

      expect(() => PlayerService.getInstance()).toThrow('SupabaseClient required for first initialization');
    });

    it('should return same instance even when called with new client', () => {
      const newClient = {
        from: jest.fn(),
        rpc: jest.fn(),
        channel: jest.fn()
      } as unknown as SupabaseClient<Database>;
      const instance = PlayerService.getInstance(newClient);

      expect(instance).toBe(playerService);
      // Note: PlayerService doesn't update the client on subsequent calls (unlike UserService)
      // It just returns the existing instance
    });
  });

  describe('getPlayerProfile', () => {
    const mockProfile = {
      id: userId,
      email: 'test@example.com',
      display_name: 'Test Player',
      preferred_position: 'Forward',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    };

    const mockTeamMemberships = [
      {
        id: 'tm1',
        user_id: userId,
        team_id: teamId,
        is_active: true,
        team: {
          id: teamId,
          name: 'Test Team',
          league_id: leagueId,
          league: {
            id: leagueId,
            name: 'Test League'
          }
        }
      }
    ];

    const mockAchievements = [
      {
        id: 'ach1',
        user_id: userId,
        achievement_id: 'achievement1',
        earned_at: '2025-01-01T00:00:00Z',
        achievement: {
          id: 'achievement1',
          name: 'First Goal',
          description: 'Score your first goal',
          category: 'goals'
        }
      }
    ];

    const mockCrossLeagueStats = {
      player_id: userId,
      season_year: 2025,
      total_goals: 10,
      total_assists: 5,
      total_games_played: 20
    };

    const mockRankings = {
      goals: { rank: 5, total: 100, percentile: 95 },
      assists: { rank: 10, total: 100, percentile: 90 },
      matches: { rank: 3, total: 100, percentile: 97 }
    };

    it('should fetch comprehensive player profile with all relations', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'users' && callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null
                })
              })
            })
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeamMemberships,
                  error: null
                })
              })
            })
          };
        } else if (table === 'user_achievements') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockAchievements,
                  error: null
                })
              })
            })
          };
        } else if (table === 'player_cross_league_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockCrossLeagueStats,
                    error: null
                  })
                })
              })
            })
          };
        }
      });

      // Mock getPlayerGlobalRankings
      jest.spyOn(playerService as any, 'getPlayerGlobalRankings').mockResolvedValue({
        data: mockRankings,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(userId);
      expect(result.data?.teams).toHaveLength(1);
      expect(result.data?.achievements).toHaveLength(1);
      expect(result.data?.crossLeagueStats).toEqual(mockCrossLeagueStats);
      expect(result.data?.globalRankings).toEqual(mockRankings);
    });

    it('should return PLAYER_NOT_FOUND for PGRST116 error', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' }
            })
          })
        })
      });

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('PLAYER_NOT_FOUND');
    });

    it('should return cached data when available', async () => {
      const cachedProfile = {
        ...mockProfile,
        teams: [],
        achievements: [],
        crossLeagueStats: null,
        globalRankings: { goals: null, assists: null, matches: null }
      };

      // Set cache
      (playerService as any).cache.set(
        `player_service:getPlayerProfile:${JSON.stringify({ userId })}`,
        { data: cachedProfile, timestamp: Date.now(), ttl: 300 }
      );

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedProfile);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should bypass cache with revalidateOnBackground option', async () => {
      // Set cache
      (playerService as any).cache.set(
        `player_service:getPlayerProfile:${JSON.stringify({ userId })}`,
        { data: mockProfile, timestamp: Date.now(), ttl: 300 }
      );

      // Mock fresh data fetch
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });

      const result = await playerService.getPlayerProfile(userId, { revalidateOnBackground: true });

      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should handle missing cross-league stats gracefully (PGRST116)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null
                })
              })
            })
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          };
        } else if (table === 'user_achievements') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          };
        } else if (table === 'player_cross_league_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          };
        }
      });

      jest.spyOn(playerService as any, 'getPlayerGlobalRankings').mockResolvedValue({
        data: { goals: null, assists: null, matches: null },
        error: null,
        success: true
      });

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data?.crossLeagueStats).toBeNull();
    });

    it('should handle team memberships query errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null
                })
              })
            })
          };
        } else if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          };
        }
      });

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors in profile fetch', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' }
            })
          })
        })
      });

      const result = await playerService.getPlayerProfile(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updatePlayerProfile', () => {
    const updates = {
      display_name: 'Updated Name',
      preferred_position: 'Midfielder'
    };

    it('should update player profile successfully', async () => {
      const updatedProfile = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfile,
                error: null
              })
            })
          })
        })
      });

      const result = await playerService.updatePlayerProfile(userId, updates);

      expect(result.success).toBe(true);
      expect(result.data?.display_name).toBe(updates.display_name);
    });

    it('should update updated_at timestamp', async () => {
      let capturedUpdate: any;

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockImplementation((data) => {
          capturedUpdate = data;
          return {
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: userId, ...data },
                  error: null
                })
              })
            })
          };
        })
      });

      await playerService.updatePlayerProfile(userId, updates);

      expect(capturedUpdate.updated_at).toBeDefined();
    });

    it('should invalidate cache after successful update', async () => {
      // Set cache
      const cacheKey = `player_service:getPlayerProfile:${JSON.stringify({ userId })}`;
      (playerService as any).cache.set(cacheKey, {
        data: { id: userId },
        timestamp: Date.now(),
        ttl: 300
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: userId, ...updates },
                error: null
              })
            })
          })
        })
      });

      await playerService.updatePlayerProfile(userId, updates);

      expect((playerService as any).cache.has(cacheKey)).toBe(false);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
              })
            })
          })
        })
      });

      const result = await playerService.updatePlayerProfile(userId, updates);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getCrossLeagueStats', () => {
    const mockStats = {
      player_id: userId,
      season_year: 2025,
      total_goals: 15,
      total_assists: 8,
      total_games_played: 25
    };

    it('should fetch stats for current year when year not provided', async () => {
      const eqChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockStats,
            error: null
          })
        })
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain)
        })
      });

      const result = await playerService.getCrossLeagueStats(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should fetch stats for specific season year', async () => {
      const eqChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockStats,
            error: null
          })
        })
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain)
        })
      });

      const result = await playerService.getCrossLeagueStats(userId, 2024);

      expect(result.success).toBe(true);
    });

    it('should return cached data when available', async () => {
      const cacheKey = `player_service:getCrossLeagueStats:${JSON.stringify({ userId, year: 2025 })}`;
      (playerService as any).cache.set(cacheKey, {
        data: mockStats,
        timestamp: Date.now(),
        ttl: 600
      });

      const result = await playerService.getCrossLeagueStats(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return null for PGRST116 error (no stats)', async () => {
      const eqChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain)
        })
      });

      const result = await playerService.getCrossLeagueStats(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle database errors', async () => {
      const eqChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain)
        })
      });

      const result = await playerService.getCrossLeagueStats(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPlayerGlobalRankings', () => {
    it('should calculate rankings when all RPCs succeed', async () => {
      mockSupabaseClient.rpc.mockImplementation((method: string, params: any) => {
        if (params.stat_column === 'total_goals') {
          return Promise.resolve({
            data: { rank: 5, total_players: 100 },
            error: null
          });
        } else if (params.stat_column === 'total_assists') {
          return Promise.resolve({
            data: { rank: 10, total_players: 100 },
            error: null
          });
        } else if (params.stat_column === 'total_games_played') {
          return Promise.resolve({
            data: { rank: 3, total_players: 100 },
            error: null
          });
        }
      });

      const result = await playerService.getPlayerGlobalRankings(userId);

      expect(result.success).toBe(true);
      expect(result.data?.goals).toEqual({
        rank: 5,
        total: 100,
        percentile: 95
      });
      expect(result.data?.assists).toEqual({
        rank: 10,
        total: 100,
        percentile: 90
      });
      expect(result.data?.matches).toEqual({
        rank: 3,
        total: 100,
        percentile: 97
      });
    });

    it('should handle partial RPC failures gracefully', async () => {
      mockSupabaseClient.rpc.mockImplementation((method: string, params: any) => {
        if (params.stat_column === 'total_goals') {
          return Promise.resolve({
            data: { rank: 5, total_players: 100 },
            error: null
          });
        } else {
          return Promise.reject(new Error('RPC failed'));
        }
      });

      const result = await playerService.getPlayerGlobalRankings(userId);

      expect(result.success).toBe(true);
      expect(result.data?.goals).toBeDefined();
      expect(result.data?.assists).toBeNull();
      expect(result.data?.matches).toBeNull();
    });

    it('should calculate percentiles correctly', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { rank: 1, total_players: 100 },
        error: null
      });

      const result = await playerService.getPlayerGlobalRankings(userId);

      expect(result.success).toBe(true);
      expect(result.data?.goals?.percentile).toBe(99);
    });

    it('should return cached rankings', async () => {
      const cachedRankings = {
        goals: { rank: 5, total: 100, percentile: 95 },
        assists: null,
        matches: null
      };

      const cacheKey = `player_service:getPlayerGlobalRankings:${JSON.stringify({ userId })}`;
      (playerService as any).cache.set(cacheKey, {
        data: cachedRankings,
        timestamp: Date.now(),
        ttl: 1800
      });

      const result = await playerService.getPlayerGlobalRankings(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedRankings);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should handle all RPCs failing', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('All RPCs failed'));

      const result = await playerService.getPlayerGlobalRankings(userId);

      expect(result.success).toBe(true);
      expect(result.data?.goals).toBeNull();
      expect(result.data?.assists).toBeNull();
      expect(result.data?.matches).toBeNull();
    });
  });

  describe('getPlayerAchievements', () => {
    const mockAchievements = [
      {
        id: 'ach1',
        name: 'First Goal',
        category: 'goals',
        requirements: { goals: 1 },
        is_active: true,
        sort_order: 1,
        user_achievements: [
          { id: 'ua1', user_id: userId, achievement_id: 'ach1', earned_at: '2025-01-01T00:00:00Z' }
        ]
      },
      {
        id: 'ach2',
        name: '10 Goals',
        category: 'goals',
        requirements: { goals: 10 },
        is_active: true,
        sort_order: 2,
        user_achievements: []
      }
    ];

    const mockStats = {
      player_id: userId,
      season_year: 2025,
      total_goals: 5,
      total_assists: 3,
      total_games_played: 10
    };

    it('should fetch all achievements with pagination', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockAchievements,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerAchievements(userId, { limit: 50, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      });
    });

    it('should filter by category', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockAchievements,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      await playerService.getPlayerAchievements(userId, { category: 'goals' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('achievements');
    });

    it('should filter by completed status (completed: true)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockAchievements[0]],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerAchievements(userId, { completed: true });

      expect(result.success).toBe(true);
    });

    it('should filter by completed status (completed: false)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockAchievements[1]],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerAchievements(userId, { completed: false });

      expect(result.success).toBe(true);
    });

    it('should calculate progress for incomplete achievements', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockAchievements,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerAchievements(userId);

      expect(result.success).toBe(true);
      expect(result.data?.[1].progress).toEqual({
        current: 5,
        target: 10,
        percentage: 50
      });
    });

    it('should handle pagination correctly (hasNext, hasPrevious)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockAchievements,
                error: null,
                count: 100
              })
            })
          })
        })
      });

      jest.spyOn(playerService, 'getCrossLeagueStats').mockResolvedValue({
        data: mockStats,
        error: null,
        success: true
      });

      const result = await playerService.getPlayerAchievements(userId, { limit: 20, offset: 20 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true
      });
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
                count: null
              })
            })
          })
        })
      });

      const result = await playerService.getPlayerAchievements(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTeamJoinRequests', () => {
    const mockRequests = [
      {
        id: 'req1',
        user_id: userId,
        team_id: teamId,
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        team: {
          id: teamId,
          name: 'Test Team',
          league_id: leagueId,
          league: {
            id: leagueId,
            name: 'Test League'
          }
        }
      }
    ];

    it('should fetch all team join requests', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockRequests,
                error: null
              })
            })
          })
        })
      });

      const result = await playerService.getTeamJoinRequests(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].team.name).toBe('Test Team');
    });

    it('should filter by status', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockRequests,
                error: null
              })
            })
          })
        })
      });

      await playerService.getTeamJoinRequests(userId, { status: 'pending' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_join_requests');
    });

    it('should apply limit', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockRequests,
                error: null
              })
            })
          })
        })
      });

      await playerService.getTeamJoinRequests(userId, { limit: 10 });

      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      const result = await playerService.getTeamJoinRequests(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('submitTeamJoinRequest', () => {
    const requestOptions = {
      message: 'I would like to join',
      preferredPosition: 'Forward',
      requestedJerseyNumber: 10
    };

    it('should submit new request successfully', async () => {
      const newRequest = {
        id: 'req1',
        user_id: userId,
        team_id: teamId,
        status: 'pending',
        ...requestOptions
      };

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_join_requests') {
          callCount++;
          if (callCount === 1) {
            // Check for existing request (3 eq calls)
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' }
                      })
                    })
                  })
                })
              })
            };
          } else {
            // Insert new request
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: newRequest,
                    error: null
                  })
                })
              })
            };
          }
        }
      });

      const result = await playerService.submitTeamJoinRequest(userId, teamId, requestOptions);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
    });

    it('should return DUPLICATE_REQUEST for existing pending request', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'existing-req' },
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await playerService.submitTeamJoinRequest(userId, teamId, requestOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DUPLICATE_REQUEST');
    });

    it('should handle check errors other than PGRST116', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await playerService.submitTeamJoinRequest(userId, teamId, requestOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should set 30-day expiration', async () => {
      let capturedInsert: any;

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_join_requests') {
          callCount++;
          if (callCount === 1) {
            // Check for existing request (3 eq calls)
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' }
                      })
                    })
                  })
                })
              })
            };
          } else {
            // Insert new request
            return {
              insert: jest.fn().mockImplementation((data) => {
                capturedInsert = data;
                return {
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'req1', ...data },
                      error: null
                    })
                  })
                };
              })
            };
          }
        }
      });

      await playerService.submitTeamJoinRequest(userId, teamId, requestOptions);

      expect(capturedInsert.expires_at).toBeDefined();
      const expiresAt = new Date(capturedInsert.expires_at);
      const now = new Date();
      const daysDiff = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('should handle database errors during insert', async () => {
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_join_requests') {
          callCount++;
          if (callCount === 1) {
            // Check for existing request (3 eq calls)
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' }
                      })
                    })
                  })
                })
              })
            };
          } else {
            // Insert fails
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Insert failed' }
                  })
                })
              })
            };
          }
        }
      });

      const result = await playerService.submitTeamJoinRequest(userId, teamId, requestOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('withdrawTeamJoinRequest', () => {
    const requestId = 'req123';

    it('should withdraw pending request successfully', async () => {
      const eqChain2 = {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: requestId, status: 'withdrawn' },
              error: null
            })
          })
        })
      };

      const eqChain1 = {
        eq: jest.fn().mockReturnValue(eqChain2)
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain1)
        })
      });

      const result = await playerService.withdrawTeamJoinRequest(userId, requestId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should only withdraw if status is pending', async () => {
      const eqChain2 = {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: requestId, status: 'withdrawn' },
              error: null
            })
          })
        })
      };

      const eqChain1 = {
        eq: jest.fn().mockReturnValue(eqChain2)
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain1)
        })
      });

      await playerService.withdrawTeamJoinRequest(userId, requestId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_join_requests');
    });

    it('should handle database errors', async () => {
      const eqChain2 = {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' }
            })
          })
        })
      };

      const eqChain1 = {
        eq: jest.fn().mockReturnValue(eqChain2)
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(eqChain1)
        })
      });

      const result = await playerService.withdrawTeamJoinRequest(userId, requestId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('searchPlayers', () => {
    const mockPlayers = [
      {
        player_id: 'player1',
        display_name: 'John Doe',
        season_year: 2025,
        total_goals: 20,
        total_assists: 10,
        total_games_played: 15
      },
      {
        player_id: 'player2',
        display_name: 'Jane Smith',
        season_year: 2025,
        total_goals: 18,
        total_assists: 12,
        total_games_played: 20
      }
    ];

    it('should search players with basic query', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockPlayers,
                  error: null,
                  count: 2
                })
              })
            })
          })
        })
      });

      const result = await playerService.searchPlayers({ query: 'John' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by query string (ilike)', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockPlayers[0]],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const result = await playerService.searchPlayers({ query: 'John' });

      expect(result.success).toBe(true);
    });

    it('should filter by minGames', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockPlayers[1]],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const result = await playerService.searchPlayers({ minGames: 20 });

      expect(result.success).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockPlayers,
                error: null,
                count: 100
              })
            })
          })
        })
      });

      const result = await playerService.searchPlayers({ limit: 20, offset: 40 });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true
      });
    });

    it('should handle database errors and return empty with pagination', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
                count: null
              })
            })
          })
        })
      });

      const result = await playerService.searchPlayers({ limit: 20 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    });
  });

  describe('subscribeToPlayerUpdates', () => {
    it('should subscribe with default options', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      const callback = jest.fn();
      playerService.subscribeToPlayerUpdates(userId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(`player-${userId}-updates`);
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        }),
        callback
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should subscribe with custom options', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      const callback = jest.fn();
      const customOptions = {
        table: 'player_stats',
        event: 'INSERT',
        schema: 'public',
        filter: `player_id=eq.${userId}`
      };

      playerService.subscribeToPlayerUpdates(userId, callback, customOptions);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          table: 'player_stats',
          filter: `player_id=eq.${userId}`
        }),
        callback
      );
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      // Populate cache
      (playerService as any).cache.set('player_service:getPlayerProfile:user1', {
        data: {},
        timestamp: Date.now(),
        ttl: 300
      });
      (playerService as any).cache.set('player_service:getCrossLeagueStats:user1', {
        data: {},
        timestamp: Date.now(),
        ttl: 300
      });
      (playerService as any).cache.set('other_service:method:user1', {
        data: {},
        timestamp: Date.now(),
        ttl: 300
      });
    });

    it('should clear all cache when no pattern provided', () => {
      playerService.clearCache();

      expect((playerService as any).cache.size).toBe(0);
    });

    it('should clear cache by pattern', () => {
      playerService.clearCache('getPlayerProfile');

      expect((playerService as any).cache.has('player_service:getPlayerProfile:user1')).toBe(false);
      expect((playerService as any).cache.has('player_service:getCrossLeagueStats:user1')).toBe(true);
      expect((playerService as any).cache.has('other_service:method:user1')).toBe(true);
    });

    it('should handle empty cache', () => {
      (playerService as any).cache.clear();

      expect(() => playerService.clearCache()).not.toThrow();
      expect((playerService as any).cache.size).toBe(0);
    });
  });

  describe('Private Helpers', () => {
    describe('handleError', () => {
      it('should format errors consistently', () => {
        const error = {
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: { info: 'Extra details' }
        };

        const result = (playerService as any).handleError(error, 'testOperation');

        expect(result).toEqual({
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: { info: 'Extra details' },
          timestamp: expect.any(String)
        });
      });

      it('should handle errors without code', () => {
        const error = { message: 'Generic error' };

        const result = (playerService as any).handleError(error, 'testOperation');

        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('Generic error');
      });
    });

    describe('getCacheKey', () => {
      it('should generate unique keys based on operation and params', () => {
        const key1 = (playerService as any).getCacheKey('getProfile', { userId: 'user1' });
        const key2 = (playerService as any).getCacheKey('getProfile', { userId: 'user2' });
        const key3 = (playerService as any).getCacheKey('getStats', { userId: 'user1' });

        expect(key1).not.toBe(key2);
        expect(key1).not.toBe(key3);
        expect(key1).toBe('player_service:getProfile:{"userId":"user1"}');
      });
    });

    describe('getFromCache', () => {
      it('should return cached data if not expired', () => {
        const key = 'test_key';
        const data = { id: 'test' };

        (playerService as any).cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: 300
        });

        const result = (playerService as any).getFromCache(key);

        expect(result).toEqual(data);
      });

      it('should return null for expired cache', () => {
        const key = 'test_key';
        const data = { id: 'test' };

        (playerService as any).cache.set(key, {
          data,
          timestamp: Date.now() - 400000, // 400 seconds ago
          ttl: 300 // 300 second TTL
        });

        const result = (playerService as any).getFromCache(key);

        expect(result).toBeNull();
        expect((playerService as any).cache.has(key)).toBe(false);
      });

      it('should return null for missing key', () => {
        const result = (playerService as any).getFromCache('nonexistent_key');

        expect(result).toBeNull();
      });
    });

    describe('setCache', () => {
      it('should store data with TTL', () => {
        const key = 'test_key';
        const data = { id: 'test' };
        const ttl = 600;

        jest.spyOn(Date, 'now').mockReturnValue(1000000);

        (playerService as any).setCache(key, data, ttl);

        const cached = (playerService as any).cache.get(key);
        expect(cached.data).toEqual(data);
        expect(cached.timestamp).toBe(1000000);
        expect(cached.ttl).toBe(600);
      });

      it('should use default TTL of 300 seconds', () => {
        const key = 'test_key';
        const data = { id: 'test' };

        (playerService as any).setCache(key, data);

        const cached = (playerService as any).cache.get(key);
        expect(cached.ttl).toBe(300);
      });
    });
  });
});
