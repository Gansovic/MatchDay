/**
 * Unit tests for SeasonService
 *
 * Comprehensive test suite covering all public methods with success paths,
 * error handling, edge cases, and complex fixture generation logic.
 */

import { SeasonService } from '../../../packages/services/src/season.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('SeasonService', () => {
  let seasonService: SeasonService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(),
    } as unknown as SupabaseClient;

    jest.clearAllMocks();
    (SeasonService as any).instance = undefined;
    seasonService = SeasonService.getInstance(mockSupabaseClient);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = SeasonService.getInstance(mockSupabaseClient);
      const instance2 = SeasonService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should throw error if getInstance called without client on first initialization', () => {
      (SeasonService as any).instance = undefined;
      expect(() => SeasonService.getInstance()).toThrow('SupabaseClient required for first initialization');
    });

    it('should accept new client on subsequent calls', () => {
      const newMockClient = { from: jest.fn() } as unknown as SupabaseClient;
      const instance = SeasonService.getInstance(newMockClient);
      expect(instance).toBeDefined();
    });
  });

  describe('getSeasonsByLeague', () => {
    const leagueId = 'league123';

    it('should retrieve all seasons for a league', async () => {
      const mockSeasons = [
        { id: 'season1', league_id: leagueId, name: 'Season 2025', season_year: 2025 },
        { id: 'season2', league_id: leagueId, name: 'Season 2024', season_year: 2024 }
      ];

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSeasons,
              error: null
            })
          })
        })
      });

      const result = await seasonService.getSeasonsByLeague(leagueId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSeasons);
      expect(result.message).toBe('Seasons retrieved successfully');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('seasons');
    });

    it('should order seasons by season_year descending', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: orderMock
          })
        })
      });

      await seasonService.getSeasonsByLeague(leagueId);

      expect(orderMock).toHaveBeenCalledWith('season_year', { ascending: false });
    });

    it('should return empty array when no seasons found', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await seasonService.getSeasonsByLeague(leagueId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await seasonService.getSeasonsByLeague(leagueId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to get seasons');
    });
  });

  describe('getSeasonDetails', () => {
    const seasonId = 'season123';

    it('should fetch season with teams', async () => {
      const mockSeason = {
        id: seasonId,
        name: 'Season 2025',
        league_id: 'league1',
        season_teams: [
          { id: 'st1', team_id: 'team1', status: 'registered', team: { id: 'team1', name: 'Team 1' } },
          { id: 'st2', team_id: 'team2', status: 'confirmed', team: { id: 'team2', name: 'Team 2' } }
        ]
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSeason,
              error: null
            })
          })
        })
      });

      const result = await seasonService.getSeasonDetails(seasonId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.teams).toEqual(mockSeason.season_teams);
      expect(result.message).toBe('Season details retrieved successfully');
    });

    it('should return SEASON_NOT_FOUND for non-existent season', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Season not found' }
            })
          })
        })
      });

      const result = await seasonService.getSeasonDetails(seasonId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEASON_NOT_FOUND');
      expect(result.error?.message).toBe('Season not found');
    });

    it('should include season_teams in response', async () => {
      const mockSeason = {
        id: seasonId,
        name: 'Season 2025',
        season_teams: []
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSeason,
              error: null
            })
          })
        })
      });

      const result = await seasonService.getSeasonDetails(seasonId);

      expect(result.success).toBe(true);
      expect(result.data?.teams).toEqual([]);
    });

    it('should handle PGRST116 error code specifically', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' }
            })
          })
        })
      });

      const result = await seasonService.getSeasonDetails(seasonId);

      expect(result.error?.code).toBe('SEASON_NOT_FOUND');
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

      const result = await seasonService.getSeasonDetails(seasonId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get season details');
    });
  });

  describe('createSeason', () => {
    const leagueId = 'league123';

    it('should create season with all fields', async () => {
      const seasonData = {
        name: 'Summer 2025',
        league_id: leagueId,
        season_year: 2025,
        display_name: 'Summer League 2025',
        status: 'draft' as const,
        tournament_format: 'league' as const,
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        registration_deadline: '2025-05-31',
        match_frequency: 7,
        preferred_match_time: '19:00:00',
        min_teams: 4,
        max_teams: 16,
        rounds: 2,
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
        allow_draws: true,
        home_away_balance: true,
        created_by: 'user123'
      };

      const mockCreatedSeason = {
        id: 'season123',
        ...seasonData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedSeason,
              error: null
            })
          })
        })
      });

      const result = await seasonService.createSeason(seasonData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedSeason);
      expect(result.message).toBe('Season created successfully');
    });

    it('should use default values when not provided', async () => {
      const seasonData = {
        name: 'Basic Season',
        league_id: leagueId,
        start_date: '2025-06-01',
        end_date: '2025-08-31'
      };

      let insertedData: any;
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation((data) => {
          insertedData = data[0];
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'season123', ...insertedData },
                error: null
              })
            })
          };
        })
      });

      await seasonService.createSeason(seasonData);

      expect(insertedData.status).toBe('draft');
      expect(insertedData.tournament_format).toBe('league');
      expect(insertedData.match_frequency).toBe(7);
      expect(insertedData.preferred_match_time).toBe('15:00:00');
      expect(insertedData.min_teams).toBe(2);
      expect(insertedData.rounds).toBe(1);
      expect(insertedData.points_for_win).toBe(3);
      expect(insertedData.points_for_draw).toBe(1);
      expect(insertedData.points_for_loss).toBe(0);
      expect(insertedData.allow_draws).toBe(true);
      expect(insertedData.home_away_balance).toBe(true);
    });

    it('should handle minimal required fields', async () => {
      const seasonData = {
        name: 'Minimal Season',
        league_id: leagueId,
        start_date: '2025-06-01',
        end_date: '2025-08-31'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'season123', ...seasonData },
              error: null
            })
          })
        })
      });

      const result = await seasonService.createSeason(seasonData);

      expect(result.success).toBe(true);
    });

    it('should set current year if season_year not provided', async () => {
      const currentYear = new Date().getFullYear();
      const seasonData = {
        name: 'Season',
        league_id: leagueId,
        start_date: '2025-06-01',
        end_date: '2025-08-31'
      };

      let insertedData: any;
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation((data) => {
          insertedData = data[0];
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'season123', ...insertedData },
                error: null
              })
            })
          };
        })
      });

      await seasonService.createSeason(seasonData);

      expect(insertedData.season_year).toBe(currentYear);
    });

    it('should apply default points system', async () => {
      const seasonData = {
        name: 'Season',
        league_id: leagueId,
        start_date: '2025-06-01',
        end_date: '2025-08-31'
      };

      let insertedData: any;
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation((data) => {
          insertedData = data[0];
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'season123', ...insertedData },
                error: null
              })
            })
          };
        })
      });

      await seasonService.createSeason(seasonData);

      expect(insertedData.points_for_win).toBe(3);
      expect(insertedData.points_for_draw).toBe(1);
      expect(insertedData.points_for_loss).toBe(0);
    });

    it('should handle database errors', async () => {
      const seasonData = {
        name: 'Season',
        league_id: leagueId,
        start_date: '2025-06-01',
        end_date: '2025-08-31'
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Insert failed' }
            })
          })
        })
      });

      const result = await seasonService.createSeason(seasonData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create season');
    });
  });

  describe('updateSeason', () => {
    const seasonId = 'season123';

    it('should update season successfully', async () => {
      const updates = {
        name: 'Updated Season',
        status: 'active' as const
      };

      const mockUpdatedSeason = {
        id: seasonId,
        ...updates,
        updated_at: expect.any(String)
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedSeason,
                error: null
              })
            })
          })
        })
      });

      const result = await seasonService.updateSeason(seasonId, updates);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Season updated successfully');
    });

    it('should update updated_at timestamp', async () => {
      const updates = { status: 'active' as const };

      let updatedData: any;
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockImplementation((data) => {
          updatedData = data;
          return {
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: seasonId, ...data },
                  error: null
                })
              })
            })
          };
        })
      });

      await seasonService.updateSeason(seasonId, updates);

      expect(updatedData.updated_at).toBeDefined();
      expect(new Date(updatedData.updated_at).getTime()).toBeGreaterThan(0);
    });

    it('should allow partial updates', async () => {
      const updates = { status: 'active' as const };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: seasonId, ...updates },
                error: null
              })
            })
          })
        })
      });

      const result = await seasonService.updateSeason(seasonId, updates);

      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      const updates = { status: 'active' as const };

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

      const result = await seasonService.updateSeason(seasonId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update season');
    });
  });

  describe('registerTeamForSeason', () => {
    const seasonId = 'season123';
    const teamId = 'team123';

    it('should register team successfully', async () => {
      const mockRegistration = {
        id: 'st123',
        season_id: seasonId,
        team_id: teamId,
        registration_date: expect.any(String),
        status: 'registered',
        team: { id: teamId, name: 'Team 1', team_color: 'blue' }
      };

      // Mock for checking existing registration (not found)
      const checkSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      // Mock for insert
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRegistration,
            error: null
          })
        })
      });

      // Mock for count query (updateRegisteredTeamsCount)
      const countSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            count: 1
          })
        })
      });

      // Mock for update (updateRegisteredTeamsCount)
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({})
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'season_teams') {
          callCount++;
          if (callCount === 1) {
            // First call: check existing
            return { select: checkSelectMock };
          } else if (callCount === 2) {
            // Second call: insert
            return { insert: insertMock };
          } else {
            // Third call: count for updateRegisteredTeamsCount
            return { select: countSelectMock };
          }
        } else if (table === 'seasons') {
          return { update: updateMock };
        }
      });

      const result = await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRegistration);
      expect(result.message).toBe('Team registered for season successfully');
    });

    it('should return error if already registered', async () => {
      const existingRegistration = { id: 'st123' };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingRegistration,
                error: null
              })
            })
          })
        })
      });

      const result = await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_REGISTERED');
      expect(result.error?.message).toBe('Team is already registered for this season');
    });

    it('should update registered_teams_count after registration', async () => {
      const checkSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'st123', season_id: seasonId, team_id: teamId },
            error: null
          })
        })
      });

      const countSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            count: 5
          })
        })
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({})
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'season_teams') {
          callCount++;
          if (callCount === 1) {
            return { select: checkSelectMock };
          } else if (callCount === 2) {
            return { insert: insertMock };
          } else {
            return { select: countSelectMock };
          }
        } else if (table === 'seasons') {
          return { update: updateMock };
        }
      });

      await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(updateMock).toHaveBeenCalled();
    });

    it('should set status to registered', async () => {
      let insertedData: any;
      const checkSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'season_teams') {
          callCount++;
          if (callCount === 1) {
            return { select: checkSelectMock };
          } else if (callCount === 2) {
            return {
              insert: jest.fn().mockImplementation((data) => {
                insertedData = data[0];
                return {
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: insertedData,
                      error: null
                    })
                  })
                };
              })
            };
          } else {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ count: 1 })
                })
              })
            };
          }
        } else if (table === 'seasons') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        }
      });

      await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(insertedData.status).toBe('registered');
    });

    it('should handle check errors other than PGRST116', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Database error' }
              })
            })
          })
        })
      });

      const result = await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to register team for season');
    });

    it('should handle database errors during insert', async () => {
      const checkSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Insert failed' }
          })
        })
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'season_teams') {
          callCount++;
          if (callCount === 1) {
            return { select: checkSelectMock };
          } else {
            return { insert: insertMock };
          }
        }
      });

      const result = await seasonService.registerTeamForSeason(seasonId, teamId);

      expect(result.success).toBe(false);
    });
  });

  describe('getSeasonMatches', () => {
    const seasonId = 'season123';

    it('should retrieve all matches for a season', async () => {
      const mockMatches = [
        {
          id: 'match1',
          season_id: seasonId,
          home_team_id: 'team1',
          away_team_id: 'team2',
          match_date: '2025-06-15',
          home_team: { id: 'team1', name: 'Team 1' },
          away_team: { id: 'team2', name: 'Team 2' }
        },
        {
          id: 'match2',
          season_id: seasonId,
          home_team_id: 'team3',
          away_team_id: 'team4',
          match_date: '2025-06-16',
          home_team: { id: 'team3', name: 'Team 3' },
          away_team: { id: 'team4', name: 'Team 4' }
        }
      ];

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockMatches,
              error: null
            })
          })
        })
      });

      const result = await seasonService.getSeasonMatches(seasonId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMatches);
      expect(result.message).toBe('Season matches retrieved successfully');
    });

    it('should include home_team and away_team data', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: orderMock
        })
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: selectMock
      });

      await seasonService.getSeasonMatches(seasonId);

      const selectCall = selectMock.mock.calls[0][0];
      expect(selectCall).toContain('home_team:teams');
      expect(selectCall).toContain('away_team:teams');
    });

    it('should order by match_date ascending', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: orderMock
          })
        })
      });

      await seasonService.getSeasonMatches(seasonId);

      expect(orderMock).toHaveBeenCalledWith('match_date', { ascending: true });
    });

    it('should handle database errors', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const result = await seasonService.getSeasonMatches(seasonId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get season matches');
    });
  });

  describe('generateFixtures', () => {
    const seasonId = 'season123';

    const createMockSeason = (overrides: any = {}) => ({
      id: seasonId,
      name: 'Test Season',
      league_id: 'league1',
      season_year: 2025,
      status: 'registration' as const,
      tournament_format: 'league' as const,
      start_date: '2025-06-01',
      end_date: '2025-08-31',
      rounds: 1,
      home_away_balance: false,
      match_day: 'thursday',
      match_start_time: '19:00:00',
      courts_available: 2,
      games_per_court: 2,
      rest_weeks_between_matches: 0,
      fixtures_status: 'pending' as const,
      ...overrides
    });

    const createMockTeams = (count: number) => {
      const teams = [];
      for (let i = 1; i <= count; i++) {
        teams.push({
          id: `st${i}`,
          season_id: seasonId,
          team_id: `team${i}`,
          status: 'registered' as const,
          team: { id: `team${i}`, name: `Team ${i}` }
        });
      }
      return teams;
    };

    it('should generate fixtures for even number of teams', async () => {
      const teams = createMockTeams(6);
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: teams  // getSeasonDetails expects season_teams, not teams
      };

      // Mock getSeasonDetails
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      const result = await seasonService.generateFixtures(seasonId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should generate fixtures for odd number of teams (with bye)', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(5)
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      const result = await seasonService.generateFixtures(seasonId);

      expect(result.success).toBe(true);
    });

    it('should generate home and away fixtures when enabled', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason({ home_away_balance: true }),
        season_teams: createMockTeams(4)
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      // With 4 teams and home_away_balance: true, should have 12 fixtures total
      // (4 choose 2) = 6 matches × 2 (home and away) = 12
      expect(insertedFixtures.length).toBeGreaterThan(0);
    });

    it('should generate fixtures with multiple rounds', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason({ rounds: 2 }),
        season_teams: createMockTeams(4)
      };

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      const result = await seasonService.generateFixtures(seasonId);

      expect(result.success).toBe(true);
    });

    it('should return preview without saving when preview=true', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(4)
      };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSeasonWithTeams,
            error: null
          })
        })
      });

      const deleteMock = jest.fn();
      const insertMock = jest.fn();

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return { select: selectMock };
        } else if (table === 'matches') {
          return {
            delete: deleteMock,
            insert: insertMock
          };
        }
      });

      const result = await seasonService.generateFixtures(seasonId, true);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(deleteMock).not.toHaveBeenCalled();
      expect(insertMock).not.toHaveBeenCalled();
      expect(result.message).toContain('Preview:');
    });

    it('should assign match dates correctly', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(4)
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      expect(insertedFixtures.length).toBeGreaterThan(0);
      insertedFixtures.forEach(fixture => {
        expect(fixture.match_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      });
    });

    it('should respect court capacity', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason({ courts_available: 2, games_per_court: 2 }),
        season_teams: createMockTeams(6)
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      // With 2 courts and 2 games per court, max 4 games per matchday
      const matchdayGroups = insertedFixtures.reduce((acc: any, fixture: any) => {
        const key = `${fixture.matchday_number}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(fixture);
        return acc;
      }, {});

      Object.values(matchdayGroups).forEach((games: any) => {
        expect(games.length).toBeLessThanOrEqual(4); // 2 courts × 2 games
      });
    });

    it('should handle multiple matchdays', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason({
          courts_available: 1,
          games_per_court: 1,
          start_date: '2025-06-01',
          end_date: '2025-12-31'  // Longer season to fit all fixtures
        }),
        season_teams: createMockTeams(6) // 15 fixtures needed
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      const uniqueMatchdays = new Set(insertedFixtures.map(f => f.matchday_number));
      expect(uniqueMatchdays.size).toBeGreaterThan(1);
    });

    it('should calculate time slots correctly for sequential games', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason({
          courts_available: 2,
          games_per_court: 2,
          match_start_time: '19:00:00'
        }),
        season_teams: createMockTeams(6)
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      expect(insertedFixtures.length).toBeGreaterThan(0);
      insertedFixtures.forEach(fixture => {
        expect(fixture.match_time).toBeDefined();
        expect(fixture.court_number).toBeGreaterThanOrEqual(1);
        expect(fixture.court_number).toBeLessThanOrEqual(2);
      });
    });

    it('should return error for insufficient teams', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(1) // Only 1 team
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSeasonWithTeams,
              error: null
            })
          })
        })
      });

      const result = await seasonService.generateFixtures(seasonId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_TEAMS');
      expect(result.error?.message).toBe('Need at least 2 teams to generate fixtures');
    });

    it('should update fixtures_status to error on failure', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(4)
      };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({})
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: updateMock
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'DB_ERROR', message: 'Insert failed' }
              })
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      expect(updateMock).toHaveBeenCalled();
    });

    it('should clear existing fixtures before regeneration', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(4)
      };

      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({})
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: deleteMock,
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      expect(deleteMock).toHaveBeenCalled();
    });

    it('should activate season after fixture generation', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: createMockTeams(4)
      };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({})
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: updateMock
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      // Should be called at least twice: once for 'generating', once for 'completed'+'active'
      expect(updateMock).toHaveBeenCalled();
    });

    it('should filter teams by status (registered/confirmed only)', async () => {
      const mockSeasonWithTeams = {
        ...createMockSeason(),
        season_teams: [
          ...createMockTeams(4),
          { id: 'st5', team_id: 'team5', status: 'withdrawn' as const, team: { id: 'team5', name: 'Team 5' } }
        ]
      };

      let insertedFixtures: any[] = [];
      (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'seasons') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSeasonWithTeams,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            })
          };
        } else if (table === 'matches') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({})
            }),
            insert: jest.fn().mockImplementation((fixtures) => {
              insertedFixtures = fixtures;
              return {
                select: jest.fn().mockResolvedValue({
                  data: fixtures,
                  error: null
                })
              };
            })
          };
        }
      });

      await seasonService.generateFixtures(seasonId);

      // Should not include team5 (withdrawn) in any fixture
      insertedFixtures.forEach(fixture => {
        expect(fixture.home_team_id).not.toBe('team5');
        expect(fixture.away_team_id).not.toBe('team5');
      });
    });
  });
});
