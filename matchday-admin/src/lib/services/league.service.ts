import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface League {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  location?: string;
  season_start: string;
  season_end: string;
  max_teams: number;
  min_teams: number;
  entry_fee: number;
  prize_pool: number;
  rules: any;
  settings: any;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'archived';
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface CreateLeagueInput {
  name: string;
  description: string;
  sport_type: string;
  location?: string;
  season_start: string;
  season_end: string;
  max_teams?: number;
  min_teams?: number;
  entry_fee?: number;
  prize_pool?: number;
  rules?: any;
  settings?: any;
  status?: string;
  created_by?: string;
}

export class LeagueService {
  static async getLeagues(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await fetch(`/api/leagues?${new URLSearchParams(filters as any)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leagues');
    }
    return response.json();
  }

  static async getLeague(id: string) {
    const response = await fetch(`/api/leagues/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch league');
    }
    return response.json();
  }

  static async createLeague(data: CreateLeagueInput) {
    const response = await fetch('/api/leagues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create league');
    }
    return response.json();
  }

  static async updateLeague(id: string, data: Partial<League>) {
    const response = await fetch(`/api/leagues/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update league');
    }
    return response.json();
  }

  static async deleteLeague(id: string) {
    const response = await fetch(`/api/leagues/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete league');
    }
    return response.json();
  }

  static async getLeagueTeams(leagueId: string) {
    const { data, error } = await supabase
      .from('league_teams')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('league_id', leagueId);

    if (error) throw error;
    return data;
  }

  static async addTeamToLeague(leagueId: string, teamId: string) {
    const { data, error } = await supabase
      .from('league_teams')
      .insert({
        league_id: leagueId,
        team_id: teamId,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeTeamFromLeague(leagueId: string, teamId: string) {
    const { error } = await supabase
      .from('league_teams')
      .delete()
      .eq('league_id', leagueId)
      .eq('team_id', teamId);

    if (error) throw error;
    return { success: true };
  }
}