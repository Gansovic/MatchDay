import { supabase } from '../lib/supabase';

// Mobile-optimized league types
export interface League {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: string;
  entry_fee?: number;
  location?: string;
  max_teams: number;
  current_teams_count: number;
  available_spots: number;
  is_recruiting: boolean;
  created_at: string;
}

export interface LeagueWithTeams {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: string;
  entry_fee?: number;
  location?: string;
  available_spots: number;
  is_recruiting: boolean;
  teams: Array<{
    id: string;
    name: string;
    team_color?: string;
    current_players: number;
    max_players: number;
    available_spots: number;
    is_recruiting: boolean;
  }>;
}

export class LeagueService {
  private static instance: LeagueService;

  static getInstance(): LeagueService {
    if (!LeagueService.instance) {
      LeagueService.instance = new LeagueService();
    }
    return LeagueService.instance;
  }

  // Get all available leagues for discovery
  async getAvailableLeagues(): Promise<League[]> {
    try {
      // First try the mobile-optimized view, fallback to direct table query
      let leagues, error;

      try {
        // Try the mobile view first (if migration has been applied)
        const result = await supabase
          .from('leagues_mobile_view')
          .select('*');

        if (result.error) throw result.error;

        // Transform mobile view data to match our interface
        return (result.data || []).map(league => ({
          id: league.id,
          name: league.name,
          description: league.description,
          sport_type: league.sport_type || 'football',
          league_type: league.league_type || 'casual',
          entry_fee: 0, // Mobile view doesn't include this yet
          location: undefined, // Mobile view doesn't include this yet
          max_teams: league.max_teams,
          current_teams_count: league.current_teams_count,
          available_spots: league.available_spots,
          is_recruiting: league.is_recruiting,
          created_at: league.created_at,
        }));
      } catch (viewError) {
        // Fallback to direct table query with manual team counting
        const result = await supabase
          .from('leagues')
          .select(`
            id,
            name,
            description,
            sport_type,
            league_type,
            max_teams,
            created_at,
            teams(id)
          `)
          .eq('is_active', true);

        leagues = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Transform the data to include team counts
      const leaguesWithCounts = (leagues || []).map(league => {
        const currentTeamsCount = (league.teams as any[])?.length || 0;
        const availableSpots = Math.max(0, league.max_teams - currentTeamsCount);
        const isRecruiting = availableSpots > 0;

        return {
          id: league.id,
          name: league.name,
          description: league.description,
          sport_type: league.sport_type || 'football',
          league_type: league.league_type || 'casual',
          entry_fee: 0, // Not in current schema
          location: undefined, // Not in current schema
          max_teams: league.max_teams,
          current_teams_count: currentTeamsCount,
          available_spots: availableSpots,
          is_recruiting: isRecruiting,
          created_at: league.created_at,
        };
      });

      return leaguesWithCounts;
    } catch (error) {
      console.error('Error fetching available leagues:', error);
      return [];
    }
  }

  // Get detailed league information with teams
  async getLeagueDetails(leagueId: string): Promise<LeagueWithTeams | null> {
    try {
      // Get league information
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .eq('is_active', true)
        .single();

      if (leagueError || !league) {
        console.error('Error fetching league:', leagueError);
        return null;
      }

      // Get teams in this league with player counts
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_color,
          max_players,
          team_members!inner(id)
        `)
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
      }

      // Transform teams data to include player counts
      const teamsWithCounts = (teams || []).map(team => {
        const currentPlayers = (team.team_members as any[])?.length || 0;
        const availableSpots = Math.max(0, team.max_players - currentPlayers);

        return {
          id: team.id,
          name: team.name,
          team_color: team.team_color,
          current_players: currentPlayers,
          max_players: team.max_players,
          available_spots: availableSpots,
          is_recruiting: availableSpots > 0,
        };
      });

      const totalAvailableSpots = teamsWithCounts.reduce(
        (sum, team) => sum + team.available_spots,
        0
      );

      return {
        id: league.id,
        name: league.name,
        description: league.description,
        sport_type: league.sport_type,
        league_type: league.league_type,
        entry_fee: league.entry_fee,
        location: league.location,
        available_spots: totalAvailableSpots,
        is_recruiting: totalAvailableSpots > 0,
        teams: teamsWithCounts,
      };
    } catch (error) {
      console.error('Error fetching league details:', error);
      return null;
    }
  }

  // Filter leagues by sport type
  async getLeaguesBySport(sportType: string): Promise<League[]> {
    try {
      const allLeagues = await this.getAvailableLeagues();
      return allLeagues.filter(
        league => league.sport_type.toLowerCase() === sportType.toLowerCase()
      );
    } catch (error) {
      console.error('Error filtering leagues by sport:', error);
      return [];
    }
  }

  // Filter leagues by type (competitive, casual, etc.)
  async getLeaguesByType(leagueType: string): Promise<League[]> {
    try {
      const allLeagues = await this.getAvailableLeagues();
      return allLeagues.filter(
        league => league.league_type.toLowerCase() === leagueType.toLowerCase()
      );
    } catch (error) {
      console.error('Error filtering leagues by type:', error);
      return [];
    }
  }

  // Get recruiting leagues (leagues with available spots)
  async getRecruitingLeagues(): Promise<League[]> {
    try {
      const allLeagues = await this.getAvailableLeagues();
      return allLeagues.filter(league => league.is_recruiting);
    } catch (error) {
      console.error('Error fetching recruiting leagues:', error);
      return [];
    }
  }

  // Get a single league by ID (for mobile league details screen)
  async getLeagueById(leagueId: string): Promise<League | null> {
    try {
      const { data: league, error } = await supabase
        .from('leagues')
        .select(`
          id,
          name,
          description,
          sport_type,
          league_type,
          entry_fee,
          location,
          max_teams,
          created_at,
          teams(id)
        `)
        .eq('id', leagueId)
        .eq('is_active', true)
        .single();

      if (error || !league) {
        console.error('Error fetching league by ID:', error);
        return null;
      }

      // Calculate team counts and available spots
      const currentTeamsCount = (league.teams as any[])?.length || 0;
      const availableSpots = Math.max(0, league.max_teams - currentTeamsCount);
      const isRecruiting = availableSpots > 0;

      return {
        id: league.id,
        name: league.name,
        description: league.description,
        sport_type: league.sport_type || 'football',
        league_type: league.league_type || 'casual',
        entry_fee: league.entry_fee || 0,
        location: league.location,
        max_teams: league.max_teams,
        current_teams_count: currentTeamsCount,
        available_spots: availableSpots,
        is_recruiting: isRecruiting,
        created_at: league.created_at,
      };
    } catch (error) {
      console.error('Error fetching league by ID:', error);
      return null;
    }
  }
}