import { supabase } from './supabase';
import type { League, Season } from '@matchday/shared-types';

export const leagueService = {
  getLeagues: async (): Promise<League[]> => {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getSeasons: async (leagueId: string): Promise<Season[]> => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};