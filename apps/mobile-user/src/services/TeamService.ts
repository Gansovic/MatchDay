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
}