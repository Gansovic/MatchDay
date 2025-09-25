import { supabase } from './supabase';
import type { Match } from '@matchday/shared-types';

export const matchService = {
  getMatches: async (seasonId?: string): Promise<Match[]> => {
    let query = supabase
      .from('matches')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
};