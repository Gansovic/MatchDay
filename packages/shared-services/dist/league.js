import { supabase } from './supabase';
export const leagueService = {
    getLeagues: async () => {
        const { data, error } = await supabase
            .from('leagues')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    },
    getSeasons: async (leagueId) => {
        const { data, error } = await supabase
            .from('seasons')
            .select('*')
            .eq('league_id', leagueId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
};
