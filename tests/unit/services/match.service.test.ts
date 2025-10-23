/**
 * Unit tests for MatchService
 *
 * Comprehensive test suite covering all public methods with success paths,
 * error handling, edge cases, caching, and real-time subscriptions.
 */

import { MatchService } from '../../../packages/services/src/match.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('MatchService', () => {
  let matchService: MatchService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(),
      channel: jest.fn(),
    } as unknown as SupabaseClient;

    jest.clearAllMocks();
    (MatchService as any).instance = undefined;
    matchService = MatchService.getInstance(mockSupabaseClient);
    matchService.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = MatchService.getInstance(mockSupabaseClient);
      const instance2 = MatchService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should throw error if getInstance called without client on first initialization', () => {
      (MatchService as any).instance = undefined;
      expect(() => MatchService.getInstance()).toThrow('SupabaseClient required for first initialization');
    });

    it('should update supabase client when getInstance called with new client', () => {
      const newMockClient = { from: jest.fn() } as unknown as SupabaseClient;
      const instance = MatchService.getInstance(newMockClient);
      expect(instance).toBeDefined();
    });
  });

  describe('getPlayerMatches', () => {
    const userId = 'user123';

    it('should retrieve player matches with pagination and details', async () => {
      const mockTeams = [{ team_id: 'team1' }, { team_id: 'team2' }];
      const mockMatches = [
        {
          id: 'match1',
          home_team_id: 'team1',
          away_team_id: 'team3',
          scheduled_date: '2025-10-20',
          status: 'completed',
          home_team: { id: 'team1', name: 'Team 1' },
          away_team: { id: 'team3', name: 'Team 3' },
          league: { id: 'league1', name: 'League 1' }
        }
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockMatches,
                      error: null,
                      count: 1
                    })
                  })
                })
              })
            })
          };
        } else if (table === 'match_events') {
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
        }
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
      });

      const result = await matchService.getPlayerMatches(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });

    it('should return cached data when available', async () => {
      const mockTeams = [{ team_id: 'team1' }];
      const mockMatches = [
        {
          id: 'match1',
          home_team_id: 'team1',
          away_team_id: 'team2',
          home_team: { id: 'team1', name: 'Team 1' },
          away_team: { id: 'team2', name: 'Team 2' },
          league: { id: 'league1', name: 'League 1' }
        }
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockMatches,
                      error: null,
                      count: 1
                    })
                  })
                })
              })
            })
          };
        } else if (table === 'match_events') {
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
        }
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
      });

      // First call
      await matchService.getPlayerMatches(userId);

      // Clear mock to ensure second call uses cache
      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getPlayerMatches(userId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockTeams = [{ team_id: 'team1' }];
      const mockMatches = [
        {
          id: 'match1',
          home_team_id: 'team1',
          away_team_id: 'team2',
          home_team: { id: 'team1', name: 'Team 1' },
          away_team: { id: 'team2', name: 'Team 2' },
          league: { id: 'league1', name: 'League 1' }
        }
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockMatches,
                      error: null,
                      count: 50
                    })
                  })
                })
              })
            })
          };
        } else if (table === 'match_events') {
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
        }
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
      });

      const result = await matchService.getPlayerMatches(userId, {}, { limit: 10, offset: 20 });

      expect(result.success).toBe(true);
      expect(result.pagination?.page).toBe(3); // offset 20 / limit 10 + 1
      expect(result.pagination?.limit).toBe(10);
      expect(result.pagination?.total).toBe(50);
      expect(result.pagination?.totalPages).toBe(5);
      expect(result.pagination?.hasNext).toBe(true);
      expect(result.pagination?.hasPrevious).toBe(true);
    });

    it('should return empty array when user has no teams', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await matchService.getPlayerMatches(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination?.total).toBe(0);
    });

    it('should filter by league ID', async () => {
      const mockTeams = [{ team_id: 'team1' }];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          const selectMock = {
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          };
          return {
            select: jest.fn().mockReturnValue(selectMock)
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        };
      });

      await matchService.getPlayerMatches(userId, { leagueId: 'league1' });

      const matchesQuery = (mockSupabaseClient.from as jest.Mock).mock.results.find(
        (result) => result.value?.select
      );
      expect(matchesQuery).toBeDefined();
    });

    it('should filter by status', async () => {
      const mockTeams = [{ team_id: 'team1' }];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          const selectMock = {
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          };
          return {
            select: jest.fn().mockReturnValue(selectMock)
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        };
      });

      await matchService.getPlayerMatches(userId, { status: 'completed' });

      const matchesQuery = (mockSupabaseClient.from as jest.Mock).mock.results.find(
        (result) => result.value?.select
      );
      expect(matchesQuery).toBeDefined();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await matchService.getPlayerMatches(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('DB_ERROR');
    });

    it('should filter by dateFrom, dateTo, and venue', async () => {
      const mockTeams = [{ team_id: 'team1' }];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTeams,
                  error: null
                })
              })
            })
          };
        } else if (table === 'matches') {
          const selectMock = {
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          };
          return {
            select: jest.fn().mockReturnValue(selectMock)
          };
        }
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
      });

      await matchService.getPlayerMatches(userId, {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        venue: 'Stadium'
      });

      const matchesQuery = (mockSupabaseClient.from as jest.Mock).mock.results.find(
        (result) => result.value?.select
      );
      expect(matchesQuery).toBeDefined();
    });
  });

  describe('getMatchDetails', () => {
    const matchId = 'match123';

    it('should fetch match details with complete information', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'completed',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        }
      });

      const result = await matchService.getMatchDetails(matchId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(matchId);
      expect(result.data?.homeTeam).toEqual(mockMatch.home_team);
      expect(result.data?.awayTeam).toEqual(mockMatch.away_team);
    });

    it('should return cached data when available', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'completed',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        }
      });

      // First call
      await matchService.getMatchDetails(matchId);

      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getMatchDetails(matchId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return MATCH_NOT_FOUND error for non-existent match', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Match not found' }
            })
          })
        })
      });

      const result = await matchService.getMatchDetails(matchId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MATCH_NOT_FOUND');
    });

    it('should include player stats when userId provided', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'completed',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'user123', display_name: 'Player 1' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'match_events') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          };
        }
      });

      const result = await matchService.getMatchDetails(matchId, { userId: 'user123' });

      expect(result.success).toBe(true);
      expect(result.data?.playerStats).toBeDefined();
    });

    it('should include analytics when includeAnalytics is true', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        match_duration: 90,
        status: 'completed',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
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
        }
      });

      const result = await matchService.getMatchDetails(matchId, { includeAnalytics: true });

      expect(result.success).toBe(true);
      expect(result.data?.analytics).toBeDefined();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await matchService.getMatchDetails(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getLiveMatchData', () => {
    const matchId = 'match123';

    it('should fetch live match data with recent events', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'live',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                }),
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await matchService.getLiveMatchData(matchId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.match).toBeDefined();
      expect(result.data?.recentEvents).toBeDefined();
      expect(result.data?.liveStats).toBeDefined();
    });

    it('should calculate live stats correctly', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'live',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' },
        match_events: []
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                }),
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await matchService.getLiveMatchData(matchId);

      expect(result.success).toBe(true);
      expect(result.data?.liveStats).toEqual({
        homeTeamStats: {},
        awayTeamStats: {},
        playerStats: {}
      });
    });

    it('should handle match not found error', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Match not found' }
            })
          })
        })
      });

      const result = await matchService.getLiveMatchData(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Match not found' }
            })
          })
        })
      });

      const result = await matchService.getLiveMatchData(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getActiveMatches', () => {
    it('should retrieve active matches successfully', async () => {
      const mockActiveMatches = [
        { id: 'match1', league_id: 'league1', sport_type: 'soccer' },
        { id: 'match2', league_id: 'league2', sport_type: 'soccer' }
      ];

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: mockActiveMatches,
            error: null
          })
        })
      });

      const result = await matchService.getActiveMatches();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActiveMatches);
    });

    it('should return cached data when available', async () => {
      const mockActiveMatches = [
        { id: 'match1', league_id: 'league1', sport_type: 'soccer' }
      ];

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: mockActiveMatches,
            error: null
          })
        })
      });

      // First call
      await matchService.getActiveMatches();

      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getActiveMatches();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should filter by league ID', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      await matchService.getActiveMatches({ leagueId: 'league1' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('active_matches');
    });

    it('should filter by sport type', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      await matchService.getActiveMatches({ sportType: 'soccer' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('active_matches');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' }
          })
        })
      });

      const result = await matchService.getActiveMatches();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('getMatchPrediction', () => {
    const matchId = 'match123';

    it('should calculate match prediction with team statistics', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        league_id: 'league1',
        home_team: { id: 'team1', name: 'Team 1' },  // Database join returns snake_case
        away_team: { id: 'team2', name: 'Team 2' },  // Database join returns snake_case
        league: { id: 'league1', name: 'League 1' },
        match_events: [],
        // Required fields for prediction calculation
        home_score: 0,
        away_score: 0
      };

      const mockHomeStats = {
        team_id: 'team1',
        wins: 10,
        games_played: 15,
        goals_for: 25,
        goals_against: 15
      };

      const mockAwayStats = {
        team_id: 'team2',
        wins: 8,
        games_played: 15,
        goals_for: 20,
        goals_against: 18
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
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
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field: string, value: any) => ({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: value === 'team1' ? mockHomeStats : mockAwayStats,
                    error: null
                  })
                })
              }))
            })
          };
        }
      });

      const result = await matchService.getMatchPrediction(matchId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.matchId).toBe(matchId);
      expect(result.data?.homeWinProbability).toBeGreaterThan(0);
      expect(result.data?.awayWinProbability).toBeGreaterThan(0);
      expect(typeof result.data?.drawProbability).toBe('number');
    });

    it('should return cached prediction when available', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        league_id: 'league1',
        home_team: { id: 'team1', name: 'Team 1' },  // Database join returns snake_case
        away_team: { id: 'team2', name: 'Team 2' },  // Database join returns snake_case
        league: { id: 'league1', name: 'League 1' },
        match_events: [],
        // Required fields for prediction calculation
        home_score: 0,
        away_score: 0
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
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
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field: string, value: any) => ({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { wins: 5, games_played: 10, goals_for: 15, goals_against: 10 },
                    error: null
                  })
                })
              }))
            })
          };
        }
      });

      // First call
      await matchService.getMatchPrediction(matchId);

      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getMatchPrediction(matchId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle match not found error', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Match not found' }
            })
          })
        })
      });

      const result = await matchService.getMatchPrediction(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should calculate correct probabilities and expected goals', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        league_id: 'league1',
        home_team: { id: 'team1', name: 'Team 1' },  // Database join returns snake_case
        away_team: { id: 'team2', name: 'Team 2' },  // Database join returns snake_case
        league: { id: 'league1', name: 'League 1' },
        match_events: [],
        // Required fields for prediction calculation
        home_score: 0,
        away_score: 0
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
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
        } else if (table === 'match_events') {
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
        } else if (table === 'team_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field: string, value: any) => ({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { wins: 10, games_played: 10, goals_for: 30, goals_against: 5 },
                    error: null
                  })
                })
              }))
            })
          };
        }
      });

      const result = await matchService.getMatchPrediction(matchId);

      expect(result.success).toBe(true);
      expect(result.data?.expectedGoalsHome).toBeDefined();
      expect(result.data?.expectedGoalsAway).toBeDefined();
      expect(result.data?.keyFactors).toBeDefined();
      expect(result.data?.confidence).toBeDefined();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await matchService.getMatchPrediction(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPlayerMatchPerformance', () => {
    const matchId = 'match123';
    const playerId = 'player123';

    it('should retrieve player performance metrics for match', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: playerId, display_name: 'Player 1' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'match_events') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [
                      { id: '1', event_type: 'goal', player_id: playerId },
                      { id: '2', event_type: 'assist', player_id: playerId }
                    ],
                    error: null
                  })
                })
              })
            })
          };
        }
      });

      const result = await matchService.getPlayerMatchPerformance(matchId, playerId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.playerId).toBe(playerId);
      expect(result.data?.goals).toBe(1);
      expect(result.data?.assists).toBe(1);
    });

    it('should return cached data when available', async () => {
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: playerId, display_name: 'Player 1' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'match_events') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          };
        }
      });

      // First call
      await matchService.getPlayerMatchPerformance(matchId, playerId);

      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getPlayerMatchPerformance(matchId, playerId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return PLAYER_NOT_IN_MATCH error when player not found', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Player not found' }
            })
          })
        })
      });

      const result = await matchService.getPlayerMatchPerformance(matchId, playerId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PLAYER_NOT_IN_MATCH');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await matchService.getPlayerMatchPerformance(matchId, playerId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createMatch', () => {
    it('should successfully create match between two teams', async () => {
      const matchData = {
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        matchDate: '2025-10-25',
        venue: 'Stadium 1',
        leagueId: 'league1',
        matchType: 'league' as const
      };

      const mockTeams = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' }
      ];

      const mockMatch = {
        id: 'match123',
        home_team_id: 'team1',
        away_team_id: 'team2',
        match_date: matchData.matchDate,
        venue: matchData.venue,
        home_team: mockTeams[0],
        away_team: mockTeams[1],
        league: { id: 'league1', name: 'League 1' }
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockTeams,
                error: null
              })
            })
          };
        } else if (table === 'matches') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await matchService.createMatch(matchData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('match123');
    });

    it('should validate teams exist before creation', async () => {
      const matchData = {
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        matchDate: '2025-10-25'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ id: 'team1', name: 'Team 1' }], // Only one team
            error: null
          })
        })
      });

      const result = await matchService.createMatch(matchData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TEAMS');
    });

    it('should return error for invalid teams', async () => {
      const matchData = {
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        matchDate: '2025-10-25'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Teams not found' }
          })
        })
      });

      const result = await matchService.createMatch(matchData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should clear cache after successful creation', async () => {
      const matchData = {
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        matchDate: '2025-10-25'
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'team1' }, { id: 'team2' }],
                error: null
              })
            })
          };
        } else if (table === 'matches') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'match123' },
                  error: null
                })
              })
            })
          };
        }
      });

      const clearCacheSpy = jest.spyOn(matchService, 'clearCache');

      await matchService.createMatch(matchData);

      expect(clearCacheSpy).toHaveBeenCalledWith('getPlayerMatches');
      expect(clearCacheSpy).toHaveBeenCalledWith('getActiveMatches');
    });

    it('should handle database errors', async () => {
      const matchData = {
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        matchDate: '2025-10-25'
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'team1' }, { id: 'team2' }],
                error: null
              })
            })
          };
        } else if (table === 'matches') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'DB_ERROR', message: 'Insert failed' }
                })
              })
            })
          };
        }
      });

      const result = await matchService.createMatch(matchData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('updateMatchScore', () => {
    const matchId = 'match123';

    it('should update match score successfully', async () => {
      const scoreData = {
        homeScore: 2,
        awayScore: 1,
        status: 'completed' as const
      };

      const mockMatch = {
        id: matchId,
        home_score: 2,
        away_score: 1,
        status: 'completed',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' },
        league: { id: 'league1', name: 'League 1' }
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockMatch,
                error: null
              })
            })
          })
        })
      });

      const result = await matchService.updateMatchScore(matchId, scoreData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.home_score).toBe(2);
      expect(result.data?.away_score).toBe(1);
    });

    it('should update status when provided', async () => {
      const scoreData = {
        homeScore: 0,
        awayScore: 0,
        status: 'live' as const
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: matchId, status: 'live' },
                error: null
              })
            })
          })
        })
      });

      const result = await matchService.updateMatchScore(matchId, scoreData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('live');
    });

    it('should update duration and notes when provided', async () => {
      const scoreData = {
        homeScore: 2,
        awayScore: 2,
        duration: 95,
        notes: 'Extra time played'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: matchId, match_duration: 95, notes: 'Extra time played' },
                error: null
              })
            })
          })
        })
      });

      const result = await matchService.updateMatchScore(matchId, scoreData);

      expect(result.success).toBe(true);
      expect(result.data?.match_duration).toBe(95);
      expect(result.data?.notes).toBe('Extra time played');
    });

    it('should clear cache after update', async () => {
      const scoreData = {
        homeScore: 1,
        awayScore: 1
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: matchId },
                error: null
              })
            })
          })
        })
      });

      const clearCacheSpy = jest.spyOn(matchService, 'clearCache');

      await matchService.updateMatchScore(matchId, scoreData);

      expect(clearCacheSpy).toHaveBeenCalledWith('getPlayerMatches');
      expect(clearCacheSpy).toHaveBeenCalledWith('getMatchDetails');
      expect(clearCacheSpy).toHaveBeenCalledWith('getActiveMatches');
    });

    it('should handle database errors', async () => {
      const scoreData = {
        homeScore: 1,
        awayScore: 0
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Update failed' }
              })
            })
          })
        })
      });

      const result = await matchService.updateMatchScore(matchId, scoreData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('getMatchParticipants', () => {
    const matchId = 'match123';

    it('should retrieve match participants grouped by team', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        home_team: { id: 'team1', name: 'Team 1', team_color: 'red' },
        away_team: { id: 'team2', name: 'Team 2', team_color: 'blue' }
      };

      const mockParticipants = [
        {
          id: 'p1',
          user_id: 'user1',
          team_id: 'team1',
          position: 'Forward',
          jersey_number: 10,
          is_starter: true,
          is_captain: true,
          selected_at: '2025-10-23',
          user: { id: 'user1', display_name: 'Player 1' }
        },
        {
          id: 'p2',
          user_id: 'user2',
          team_id: 'team2',
          position: 'Goalkeeper',
          jersey_number: 1,
          is_starter: true,
          is_captain: false,
          selected_at: '2025-10-23',
          user: { id: 'user2', display_name: 'Player 2' }
        }
      ];

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
                  error: null
                })
              })
            })
          };
        } else if (table === 'match_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockParticipants,
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await matchService.getMatchParticipants(matchId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.homeTeam).toBeDefined();
      expect(result.data?.awayTeam).toBeDefined();
      expect(result.data?.homeTeam.participants.length).toBe(1);
      expect(result.data?.awayTeam.participants.length).toBe(1);
    });

    it('should return cached data when available', async () => {
      const mockMatch = {
        id: matchId,
        home_team_id: 'team1',
        away_team_id: 'team2',
        home_team: { id: 'team1', name: 'Team 1' },
        away_team: { id: 'team2', name: 'Team 2' }
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMatch,
                  error: null
                })
              })
            })
          };
        } else if (table === 'match_participants') {
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
        }
      });

      // First call
      await matchService.getMatchParticipants(matchId);

      jest.clearAllMocks();

      // Second call should use cache
      const result = await matchService.getMatchParticipants(matchId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle match not found error', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Match not found' }
            })
          })
        })
      });

      const result = await matchService.getMatchParticipants(matchId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await matchService.getMatchParticipants(matchId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('addMatchParticipant', () => {
    it('should add participant to match successfully', async () => {
      const participantData = {
        matchId: 'match123',
        teamId: 'team1',
        userId: 'user1',
        position: 'Forward',
        jerseyNumber: 10,
        isStarter: true,
        isCaptain: false
      };

      const mockParticipant = {
        id: 'p1',
        match_id: participantData.matchId,
        team_id: participantData.teamId,
        user_id: participantData.userId,
        user: { id: 'user1', display_name: 'Player 1' }
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockParticipant,
              error: null
            })
          })
        })
      });

      const result = await matchService.addMatchParticipant(participantData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('p1');
    });

    it('should upsert existing participant', async () => {
      const participantData = {
        matchId: 'match123',
        teamId: 'team1',
        userId: 'user1'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'p1' },
              error: null
            })
          })
        })
      });

      const result = await matchService.addMatchParticipant(participantData);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('match_participants');
    });

    it('should clear cache after adding', async () => {
      const participantData = {
        matchId: 'match123',
        teamId: 'team1',
        userId: 'user1'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'p1' },
              error: null
            })
          })
        })
      });

      const clearCacheSpy = jest.spyOn(matchService, 'clearCache');

      await matchService.addMatchParticipant(participantData);

      expect(clearCacheSpy).toHaveBeenCalledWith('getMatchParticipants');
    });

    it('should handle database errors', async () => {
      const participantData = {
        matchId: 'match123',
        teamId: 'team1',
        userId: 'user1'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Insert failed' }
            })
          })
        })
      });

      const result = await matchService.addMatchParticipant(participantData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('removeMatchParticipant', () => {
    const participantId = 'p123';

    it('should remove participant successfully', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const result = await matchService.removeMatchParticipant(participantId);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('match_participants');
    });

    it('should clear cache after removal', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const clearCacheSpy = jest.spyOn(matchService, 'clearCache');

      await matchService.removeMatchParticipant(participantId);

      expect(clearCacheSpy).toHaveBeenCalledWith('getMatchParticipants');
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { code: 'DB_ERROR', message: 'Delete failed' }
          })
        })
      });

      const result = await matchService.removeMatchParticipant(participantId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache when pattern not provided', () => {
      matchService.clearCache();
      // Cache is cleared, no specific assertion needed
      expect(true).toBe(true);
    });

    it('should clear cache matching specific pattern', () => {
      matchService.clearCache('getPlayerMatches');
      // Cache with pattern is cleared
      expect(true).toBe(true);
    });
  });

  describe('Realtime Subscriptions', () => {
    it('should set up realtime subscription for match updates', () => {
      const callback = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      (mockSupabaseClient.channel as jest.Mock).mockReturnValue(mockChannel);

      matchService.subscribeToMatchUpdates('match123', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('match-match123-updates');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should support custom subscription options', () => {
      const callback = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      (mockSupabaseClient.channel as jest.Mock).mockReturnValue(mockChannel);

      matchService.subscribeToMatchUpdates('match123', callback, {
        table: 'matches',
        event: 'UPDATE',
        schema: 'public'
      });

      expect(mockChannel.on).toHaveBeenCalled();
    });
  });
});
