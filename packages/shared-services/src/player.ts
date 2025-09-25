import { supabase } from './supabase';
import type { Player, PlayerStats } from '@matchday/shared-types';

export const playerService = {
  getPlayers: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getPlayerStats: async (playerId: string, seasonId?: string): Promise<PlayerStats[]> => {
    let query = supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
};