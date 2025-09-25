import { supabase } from '../lib/supabase';

// Mobile-optimized types
export interface PlayerStats {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  averageGoalsPerGame: number;
  performanceRating: number;
  achievementPoints: number;
  globalRank?: number;
  leaguesPlayed: number;
}

export interface PlayerProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  result: 'win' | 'loss' | 'draw';
  playerGoals: number;
  playerAssists: number;
}

export interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  location?: string;
  leagueName: string;
}

export interface TeamMembership {
  teamId: string;
  teamName: string;
  teamColor?: string;
  position?: string;
  jerseyNumber?: number;
  joinedAt: string;
  isActive: boolean;
  league: {
    id: string;
    name: string;
    sportType: string;
    leagueType: string;
  };
  stats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    goalsPerGame: number;
  };
  nextMatch?: {
    id: string;
    opponent: string;
    isHome: boolean;
    date: string;
  };
}

export class PlayerService {
  private static instance: PlayerService;

  static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  // Get player profile information
  async getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          email: data.email,
          displayName: data.display_name || data.email,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching player profile:', error);
      return null;
    }
  }

  // Get aggregated player statistics
  async getPlayerStats(userId: string): Promise<PlayerStats> {
    try {
      // Get basic team membership count and games played
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(
            league_id,
            leagues!inner(name)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        throw membershipError;
      }

      // Get player statistics from correct table
      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId);

      if (statsError) {
        console.error('Error fetching player stats:', statsError);
        throw statsError;
      }

      // Debug log to see what data we're getting
      console.log('PlayerStats data:', JSON.stringify(playerStats, null, 2));
      console.log('Memberships data:', JSON.stringify(memberships, null, 2));

      // Calculate stats - if games_played column doesn't exist or is 0, count unique matches
      let totalGames = playerStats?.reduce((sum, stat) => sum + (stat.games_played || 0), 0) || 0;

      // If games_played is 0 but we have stats records, count the records as matches played
      if (totalGames === 0 && playerStats && playerStats.length > 0) {
        totalGames = playerStats.length; // Each record represents one match
      }

      const totalGoals = playerStats?.reduce((sum, stat) => sum + (stat.goals || 0), 0) || 0;
      const totalAssists = playerStats?.reduce((sum, stat) => sum + (stat.assists || 0), 0) || 0;

      // Calculate unique leagues from both memberships and player stats
      const membershipLeagues = new Set(memberships?.map(m => (m.teams as any).league_id) || []);
      const statsLeagues = new Set(playerStats?.map(stat => stat.league_id).filter(Boolean) || []);
      const allLeagues = new Set([...membershipLeagues, ...statsLeagues]);
      const leaguesPlayed = allLeagues.size;

      console.log('Calculated stats:', {
        totalGames,
        totalGoals,
        totalAssists,
        leaguesPlayed,
        membershipLeagues: membershipLeagues.size,
        statsLeagues: statsLeagues.size
      });

      return {
        totalGames,
        totalGoals,
        totalAssists,
        averageGoalsPerGame: totalGames > 0 ? Math.round((totalGoals / totalGames) * 100) / 100 : 0,
        performanceRating: this.calculatePerformanceRating(totalGames, totalGoals, totalAssists),
        achievementPoints: (totalGoals * 10) + (totalAssists * 5) + (totalGames * 2),
        globalRank: undefined, // Would need more complex ranking logic
        leaguesPlayed,
      };
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return {
        totalGames: 0,
        totalGoals: 0,
        totalAssists: 0,
        averageGoalsPerGame: 0,
        performanceRating: 0,
        achievementPoints: 0,
        leaguesPlayed: 0,
      };
    }
  }

  // Get recent matches for the player
  async getRecentMatches(userId: string, limit: number = 5): Promise<RecentMatch[]> {
    try {
      // Get matches through team memberships
      const { data: userTeams, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (teamError) throw teamError;
      if (!userTeams || userTeams.length === 0) return [];

      const teamIds = userTeams.map(t => t.team_id);

      // Get recent matches for user's teams
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          home_team:home_team_id!inner(name),
          away_team:away_team_id!inner(name)
        `)
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('match_date', { ascending: false })
        .limit(limit);

      if (matchError) throw matchError;

      // Get player stats for these matches
      const matchIds = (matches || []).map(m => m.id);
      const { data: playerStats } = matchIds.length > 0 ? await supabase
        .from('player_stats')
        .select('match_id, goals, assists')
        .eq('user_id', userId)
        .in('match_id', matchIds) : { data: [] };

      return (matches || []).map(match => {
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;
        const stat = playerStats?.find(s => s.match_id === match.id);

        // Determine if user's team won (simplified logic)
        const userTeamIsHome = teamIds.includes((match.home_team as any).id);
        const result: 'win' | 'loss' | 'draw' =
          homeScore === awayScore ? 'draw' :
          (userTeamIsHome && homeScore > awayScore) || (!userTeamIsHome && awayScore > homeScore) ? 'win' : 'loss';

        return {
          id: match.id,
          homeTeam: (match.home_team as any)?.name || 'Home Team',
          awayTeam: (match.away_team as any)?.name || 'Away Team',
          homeScore,
          awayScore,
          date: match.match_date,
          result,
          playerGoals: stat?.goals || 0,
          playerAssists: stat?.assists || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      return [];
    }
  }

  // Get upcoming matches for the player
  async getUpcomingMatches(userId: string, limit: number = 3): Promise<UpcomingMatch[]> {
    try {
      // Get user's teams
      const { data: userTeams, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (teamError) throw teamError;
      if (!userTeams || userTeams.length === 0) return [];

      const teamIds = userTeams.map(t => t.team_id);

      // Get upcoming matches for user's teams
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_team:home_team_id!inner(name, leagues!inner(name)),
          away_team:away_team_id!inner(name)
        `)
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(match => ({
        id: match.id,
        homeTeam: (match.home_team as any)?.name || 'Home Team',
        awayTeam: (match.away_team as any)?.name || 'Away Team',
        date: match.match_date,
        location: undefined,
        leagueName: (match.home_team as any)?.leagues?.name || 'League',
      }));
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }
  }

  // Get detailed team memberships for the player
  async getTeamMemberships(userId: string): Promise<TeamMembership[]> {
    try {
      const { data: memberships, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      if (!memberships || memberships.length === 0) {
        return [];
      }

      // For each membership, get team and league information separately
      const teamMemberships: (TeamMembership | null)[] = await Promise.all(
        memberships.map(async (membership) => {
          // Get team information
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('id, name, team_color, league_id, max_players')
            .eq('id', membership.team_id)
            .single();

          if (teamError || !teamData) {
            return null;
          }

          // Get league information (handle null league_id)
          let leagueData = null;

          if (teamData.league_id) {
            const result = await supabase
              .from('leagues')
              .select('id, name, sport_type, league_type')
              .eq('id', teamData.league_id)
              .single();
            leagueData = result.data;
          }

          const team = teamData;
          const league = leagueData || {
            id: 'unknown',
            name: 'Independent Team',
            sport_type: 'football',
            league_type: 'casual'
          };

          // Get player stats for this specific team
          const { data: teamStats } = await supabase
            .from('player_stats')
            .select('goals, assists, games_played')
            .eq('user_id', userId)
            .eq('team_id', membership.team_id);

          // Calculate stats for this team
          const stats = teamStats?.reduce(
            (acc, stat) => ({
              gamesPlayed: acc.gamesPlayed + (stat.games_played || 0),
              goals: acc.goals + (stat.goals || 0),
              assists: acc.assists + (stat.assists || 0),
            }),
            { gamesPlayed: 0, goals: 0, assists: 0 }
          ) || { gamesPlayed: 0, goals: 0, assists: 0 };

          // If games_played is 0, use the number of stat records
          if (stats.gamesPlayed === 0 && teamStats && teamStats.length > 0) {
            stats.gamesPlayed = teamStats.length;
          }

          // Get next match for this team
          const { data: nextMatch } = await supabase
            .from('matches')
            .select(`
              id,
              match_date,
              home_team_id,
              away_team_id,
              home_team:home_team_id!inner(name),
              away_team:away_team_id!inner(name)
            `)
            .or(`home_team_id.eq.${membership.team_id},away_team_id.eq.${membership.team_id}`)
            .gte('match_date', new Date().toISOString())
            .order('match_date', { ascending: true })
            .limit(1)
            .single();

          let nextMatchInfo;
          if (nextMatch) {
            const isHome = nextMatch.home_team_id === membership.team_id;
            const opponent = isHome
              ? (nextMatch.away_team as any)?.name || 'TBD'
              : (nextMatch.home_team as any)?.name || 'TBD';

            nextMatchInfo = {
              id: nextMatch.id,
              opponent,
              isHome,
              date: nextMatch.match_date,
            };
          }

          return {
            teamId: team.id,
            teamName: team.name,
            teamColor: team.team_color,
            position: membership.position,
            jerseyNumber: membership.jersey_number,
            joinedAt: membership.joined_at,
            isActive: membership.is_active,
            league: {
              id: league.id,
              name: league.name,
              sportType: league.sport_type,
              leagueType: league.league_type,
            },
            stats: {
              gamesPlayed: stats.gamesPlayed,
              goals: stats.goals,
              assists: stats.assists,
              goalsPerGame: stats.gamesPlayed > 0
                ? Math.round((stats.goals / stats.gamesPlayed) * 100) / 100
                : 0,
            },
            nextMatch: nextMatchInfo,
          };
        })
      );

      // Filter out any null results (teams/leagues that weren't found)
      const validTeamMemberships = teamMemberships.filter(tm => tm !== null) as TeamMembership[];

      return validTeamMemberships;
    } catch (error) {
      console.error('Error fetching team memberships:', error);
      return [];
    }
  }

  private calculatePerformanceRating(games: number, goals: number, assists: number): number {
    if (games === 0) return 0;

    const goalsPerGame = goals / games;
    const assistsPerGame = assists / games;
    const baseRating = (goalsPerGame * 30) + (assistsPerGame * 20) + 50;

    return Math.min(100, Math.max(0, Math.round(baseRating)));
  }
}