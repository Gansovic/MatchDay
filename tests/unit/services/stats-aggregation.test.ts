/**
 * Stats Aggregation Tests
 *
 * Tests for automated stats aggregation after match completion
 */

import { StatsService } from '@/lib/services/stats.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null })
  }))
} as any;

describe('StatsService - Cross-League Aggregation', () => {
  let statsService: StatsService;

  beforeEach(() => {
    jest.clearAllMocks();
    statsService = StatsService.getInstance(mockSupabase);
  });

  describe('updatePlayerCrossLeagueStats', () => {
    it('should aggregate player stats correctly', async () => {
      // Mock player stats data
      const mockPlayerStats = [
        {
          match_id: 'match-1',
          goals: 2,
          assists: 1,
          minutes_played: 90,
          team_id: 'team-1',
          teams: { league_id: 'league-1' },
          matches: { id: 'match-1' }
        },
        {
          match_id: 'match-2',
          goals: 1,
          assists: 2,
          minutes_played: 90,
          team_id: 'team-1',
          teams: { league_id: 'league-1' },
          matches: { id: 'match-2' }
        },
        {
          match_id: 'match-3',
          goals: 3,
          assists: 0,
          minutes_played: 90,
          team_id: 'team-2',
          teams: { league_id: 'league-2' },
          matches: { id: 'match-3' }
        }
      ];

      // Mock the query chain
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const gteMock = jest.fn().mockReturnThis();
      const ltMock = jest.fn().mockResolvedValue({ data: mockPlayerStats, error: null });

      const fromMock = jest.fn(() => ({
        select: selectMock,
        eq: eqMock,
        gte: gteMock,
        lt: ltMock,
        upsert: jest.fn().mockResolvedValue({ error: null })
      }));

      mockSupabase.from = fromMock;
      statsService = StatsService.getInstance(mockSupabase);

      const result = await statsService.updatePlayerCrossLeagueStats('player-1', '2025');

      expect(result.success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith('player_stats');

      // Verify aggregation was called
      expect(fromMock).toHaveBeenCalledWith('player_cross_league_stats');
    });

    it('should handle no stats gracefully', async () => {
      const fromMock = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null })
      }));

      mockSupabase.from = fromMock;
      statsService = StatsService.getInstance(mockSupabase);

      const result = await statsService.updatePlayerCrossLeagueStats('player-1');

      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      const fromMock = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }));

      mockSupabase.from = fromMock;
      statsService = StatsService.getInstance(mockSupabase);

      const result = await statsService.updatePlayerCrossLeagueStats('player-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CROSS_LEAGUE_UPDATE_ERROR');
    });
  });
});
