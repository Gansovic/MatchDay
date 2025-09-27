import { supabase } from '../lib/supabase';

// Mobile-optimized team creation types
export interface CreateTeamRequest {
  name: string;
  league_id: string;
  description?: string;
  team_color?: string;
  max_players: number;
  min_players: number;
}

export interface TeamCreationResponse {
  success: boolean;
  team?: {
    id: string;
    name: string;
    team_color: string;
    league_id: string;
    max_players: number;
    captain_id: string;
    created_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// Team detail types
export interface TeamMember {
  id: string;
  displayName: string;
  position?: string;
  jerseyNumber?: number;
  joinedAt: string;
  isCaptain: boolean;
  stats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
  };
}

export interface TeamMatch {
  id: string;
  opponent: string;
  isHome: boolean;
  date: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'completed';
}

export interface TeamDetails {
  id: string;
  name: string;
  teamColor: string;
  description?: string;
  maxPlayers: number;
  minPlayers: number;
  isRecruiting: boolean;
  createdAt: string;
  captain: {
    id: string;
    displayName: string;
  };
  league: {
    id: string;
    name: string;
    sportType: string;
    leagueType: string;
  };
  members: TeamMember[];
  recentMatches: TeamMatch[];
  upcomingMatches: TeamMatch[];
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
    winPercentage: number;
  };
}

export class TeamService {
  private static instance: TeamService;

  static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  // Validate team creation data
  private validateTeamData(data: CreateTeamRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // Team name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Team name is required' });
    } else if (data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Team name must be at least 2 characters long' });
    } else if (data.name.trim().length > 50) {
      errors.push({ field: 'name', message: 'Team name must be less than 50 characters' });
    }

    // League validation
    if (!data.league_id || data.league_id.trim().length === 0) {
      errors.push({ field: 'league_id', message: 'League selection is required' });
    }

    // Max players validation
    if (data.max_players < 5 || data.max_players > 30) {
      errors.push({ field: 'max_players', message: 'Maximum players must be between 5 and 30' });
    }

    // Min players validation
    if (data.min_players < 3 || data.min_players > 25) {
      errors.push({ field: 'min_players', message: 'Minimum players must be between 3 and 25' });
    }

    // Min vs Max validation
    if (data.min_players >= data.max_players) {
      errors.push({ field: 'min_players', message: 'Minimum must be less than maximum players' });
    }

    // Team color validation (hex color)
    if (data.team_color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.team_color)) {
      errors.push({ field: 'team_color', message: 'Team color must be a valid hex color' });
    }

    return errors;
  }

  // Create a new team
  async createTeam(
    userId: string,
    teamData: CreateTeamRequest
  ): Promise<TeamCreationResponse> {
    try {
      // Validate input data
      const validationErrors = this.validateTeamData(teamData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationErrors.map(e => e.message).join(', ')
          }
        };
      }

      // Check if the league exists and is active
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, is_active')
        .eq('id', teamData.league_id)
        .eq('is_active', true)
        .single();

      if (leagueError) {
        console.error('League check error:', leagueError);
        return {
          success: false,
          error: {
            code: 'LEAGUE_NOT_FOUND',
            message: 'Selected league not found or is not active'
          }
        };
      }

      // Check if team name is unique within the league
      const { data: existingTeam, error: nameCheckError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', teamData.league_id)
        .eq('name', teamData.name.trim())
        .single();

      // If no error, it means a team with this name exists
      if (!nameCheckError) {
        return {
          success: false,
          error: {
            code: 'TEAM_NAME_EXISTS',
            message: 'A team with this name already exists in the selected league'
          }
        };
      }

      // If error is not "not found", then there's a real error
      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        console.error('Name check error:', nameCheckError);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check team name availability'
          }
        };
      }

      // Create the team (initially without captain to avoid FK constraint issues)
      const teamInsert = {
        league_id: teamData.league_id,
        name: teamData.name.trim(),
        team_color: teamData.team_color || '#2563eb',
        max_players: teamData.max_players || 15,
        min_players: teamData.min_players || 7,
        team_bio: teamData.description?.trim() || null,
        captain_id: null, // Initially null
        is_recruiting: true,
        is_active: true
      };

      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert(teamInsert)
        .select()
        .single();

      if (createError) {
        console.error('Team creation error:', createError);
        return {
          success: false,
          error: {
            code: 'CREATION_ERROR',
            message: 'Failed to create team. Please try again.'
          }
        };
      }

      try {
        // Add the creator as a team member
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: newTeam.id,
            user_id: userId,
            position: 'midfielder',
            jersey_number: 1,
            is_active: true
          });

        if (memberError) {
          throw memberError;
        }

        // Update the team to set the captain
        const { error: updateError } = await supabase
          .from('teams')
          .update({ captain_id: userId })
          .eq('id', newTeam.id);

        if (updateError) {
          throw updateError;
        }

        // Return success with the created team data
        return {
          success: true,
          team: {
            id: newTeam.id,
            name: newTeam.name,
            team_color: newTeam.team_color,
            league_id: newTeam.league_id,
            max_players: newTeam.max_players,
            captain_id: userId,
            created_at: newTeam.created_at
          }
        };

      } catch (setupError) {
        // If team member or captain assignment fails, clean up the team
        console.error('Team setup error:', setupError);
        await supabase.from('teams').delete().eq('id', newTeam.id);

        return {
          success: false,
          error: {
            code: 'SETUP_ERROR',
            message: 'Failed to set up team properly. Please try again.'
          }
        };
      }

    } catch (error) {
      console.error('Unexpected error in createTeam:', error);
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred. Please try again.'
        }
      };
    }
  }

  // Get available leagues for team creation
  async getAvailableLeaguesForTeamCreation() {
    try {
      const { data: leagues, error } = await supabase
        .from('leagues')
        .select('id, name, sport_type, league_type, description')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name');

      if (error) {
        console.error('Error fetching leagues:', error);
        return [];
      }

      return leagues || [];
    } catch (error) {
      console.error('Error in getAvailableLeaguesForTeamCreation:', error);
      return [];
    }
  }

  // Get detailed team information
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    try {
      console.log('Fetching team details for ID:', teamId);

      // Get basic team information with more robust error handling
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_color,
          team_bio,
          max_players,
          min_players,
          is_recruiting,
          created_at,
          captain_id,
          league_id
        `)
        .eq('id', teamId)
        .eq('is_active', true)
        .single();

      if (teamError) {
        console.error('Error fetching team:', teamError);
        if (teamError.code === 'PGRST116') {
          console.error('Team not found with ID:', teamId);
          return null;
        }
        throw teamError;
      }

      if (!team) {
        console.error('No team data returned for ID:', teamId);
        return null;
      }

      // Get league information separately with fallback
      let league = null;
      if (team.league_id) {
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select('id, name, sport_type, league_type')
          .eq('id', team.league_id)
          .single();

        if (leagueError) {
          console.warn('Could not fetch league data:', leagueError);
          // Provide fallback league data
          league = {
            id: team.league_id,
            name: 'Unknown League',
            sport_type: 'football',
            league_type: 'casual'
          };
        } else {
          league = leagueData;
        }
      } else {
        // Fallback for teams without league
        league = {
          id: 'no-league',
          name: 'Independent Team',
          sport_type: 'football',
          league_type: 'casual'
        };
      }

      // Get captain information
      const { data: captain } = await supabase
        .from('users')
        .select('id, display_name, email')
        .eq('id', team.captain_id)
        .single();

      // Get team members
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          user_id,
          position,
          jersey_number,
          joined_at,
          users!inner(
            id,
            display_name,
            email
          )
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      // Get team member stats
      const memberStats = await Promise.all(
        (members || []).map(async (member) => {
          const { data: stats } = await supabase
            .from('player_stats')
            .select('goals, assists, games_played')
            .eq('user_id', member.user_id)
            .eq('team_id', teamId);

          const aggregatedStats = stats?.reduce(
            (acc, stat) => ({
              gamesPlayed: acc.gamesPlayed + (stat.games_played || 0),
              goals: acc.goals + (stat.goals || 0),
              assists: acc.assists + (stat.assists || 0),
            }),
            { gamesPlayed: 0, goals: 0, assists: 0 }
          ) || { gamesPlayed: 0, goals: 0, assists: 0 };

          // If games_played is 0, use stats record count
          if (aggregatedStats.gamesPlayed === 0 && stats && stats.length > 0) {
            aggregatedStats.gamesPlayed = stats.length;
          }

          return {
            id: member.user_id,
            displayName: (member.users as any)?.display_name || (member.users as any)?.email || 'Unknown',
            position: member.position,
            jerseyNumber: member.jersey_number,
            joinedAt: member.joined_at,
            isCaptain: member.user_id === team.captain_id,
            stats: aggregatedStats,
          };
        })
      );

      // Get recent matches
      const { data: recentMatches } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          home_team_id,
          away_team_id,
          home_team:home_team_id!inner(name),
          away_team:away_team_id!inner(name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('match_date', { ascending: false })
        .limit(5);

      // Get upcoming matches
      const { data: upcomingMatches } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_team_id,
          away_team_id,
          home_team:home_team_id!inner(name),
          away_team:away_team_id!inner(name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(3);

      // Transform matches data
      const transformedRecentMatches: TeamMatch[] = (recentMatches || []).map(match => {
        const isHome = match.home_team_id === teamId;
        const opponent = isHome
          ? (match.away_team as any)?.name || 'TBD'
          : (match.home_team as any)?.name || 'TBD';

        return {
          id: match.id,
          opponent,
          isHome,
          date: match.match_date,
          homeScore: match.home_score,
          awayScore: match.away_score,
          status: 'completed' as const,
        };
      });

      const transformedUpcomingMatches: TeamMatch[] = (upcomingMatches || []).map(match => {
        const isHome = match.home_team_id === teamId;
        const opponent = isHome
          ? (match.away_team as any)?.name || 'TBD'
          : (match.home_team as any)?.name || 'TBD';

        return {
          id: match.id,
          opponent,
          isHome,
          date: match.match_date,
          status: 'upcoming' as const,
        };
      });

      // Calculate team stats
      const wins = transformedRecentMatches.filter(match => {
        const teamScore = match.isHome ? match.homeScore : match.awayScore;
        const opponentScore = match.isHome ? match.awayScore : match.homeScore;
        return (teamScore || 0) > (opponentScore || 0);
      }).length;

      const losses = transformedRecentMatches.filter(match => {
        const teamScore = match.isHome ? match.homeScore : match.awayScore;
        const opponentScore = match.isHome ? match.awayScore : match.homeScore;
        return (teamScore || 0) < (opponentScore || 0);
      }).length;

      const draws = transformedRecentMatches.filter(match => {
        const teamScore = match.isHome ? match.homeScore : match.awayScore;
        const opponentScore = match.isHome ? match.awayScore : match.homeScore;
        return (teamScore || 0) === (opponentScore || 0);
      }).length;

      const goalsFor = transformedRecentMatches.reduce((total, match) => {
        const teamScore = match.isHome ? match.homeScore : match.awayScore;
        return total + (teamScore || 0);
      }, 0);

      const goalsAgainst = transformedRecentMatches.reduce((total, match) => {
        const opponentScore = match.isHome ? match.awayScore : match.homeScore;
        return total + (opponentScore || 0);
      }, 0);

      const totalGames = wins + losses + draws;
      const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        id: team.id,
        name: team.name,
        teamColor: team.team_color,
        description: team.team_bio,
        maxPlayers: team.max_players,
        minPlayers: team.min_players,
        isRecruiting: team.is_recruiting,
        createdAt: team.created_at,
        captain: {
          id: team.captain_id,
          displayName: captain?.display_name || captain?.email || 'Unknown Captain',
        },
        league: {
          id: league.id,
          name: league.name,
          sportType: league.sport_type,
          leagueType: league.league_type,
        },
        members: memberStats,
        recentMatches: transformedRecentMatches,
        upcomingMatches: transformedUpcomingMatches,
        stats: {
          totalGames,
          wins,
          losses,
          draws,
          goalsFor,
          goalsAgainst,
          winPercentage,
        },
      };

    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }
}