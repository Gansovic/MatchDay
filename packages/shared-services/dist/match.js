import { supabase } from './supabase';
export const matchService = {
    getMatches: async (seasonId) => {
        let query = supabase
            .from('matches')
            .select('*')
            .order('scheduled_at', { ascending: true });
        if (seasonId) {
            query = query.eq('season_id', seasonId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data || [];
    }
};
