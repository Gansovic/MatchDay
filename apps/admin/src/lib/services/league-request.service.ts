/**
 * League Request Service
 * 
 * Handles team league join requests for admin users.
 * Provides functionality to approve, reject, and manage team requests to join leagues.
 */

import { supabase } from '@/lib/supabase/client';
import { ServiceResponse, ServiceError } from '@matchday/database';

export interface TeamLeagueRequest {
  id: string;
  team_id: string;
  league_id: string;
  requested_by: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_message: string | null;
  created_at: string;
  expires_at: string;
}

export interface TeamLeagueRequestWithDetails extends TeamLeagueRequest {
  team: {
    id: string;
    name: string;
    team_color: string | null;
    team_bio: string | null;
    captain_id: string;
  };
  league: {
    id: string;
    name: string;
    description: string | null;
    sport_type: string;
    league_type: string;
  };
  requested_by_user: {
    email: string;
    display_name: string | null;
    full_name: string | null;
  };
}

export interface ApproveRequestData {
  requestId: string;
  adminId: string;
  responseMessage?: string;
}

export interface RejectRequestData {
  requestId: string;
  adminId: string;
  responseMessage?: string;
}

export interface CreateTeamRequestData {
  teamId: string;
  leagueId: string;
  requestedBy: string;
  message?: string;
}

export class LeagueRequestService {
  private static instance: LeagueRequestService;
  
  public static getInstance(): LeagueRequestService {
    if (!LeagueRequestService.instance) {
      LeagueRequestService.instance = new LeagueRequestService();
    }
    return LeagueRequestService.instance;
  }

  /**
   * Get all pending team join requests for leagues managed by the admin
   */
  async getPendingRequests(adminId: string): Promise<ServiceResponse<TeamLeagueRequestWithDetails[]>> {
    try {
      // First, get the leagues this admin owns
      const { data: adminLeagues, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, created_by')
        .eq('created_by', adminId);
      
      if (leagueError) {
        return {
          data: null,
          error: {
            code: 'FETCH_ADMIN_LEAGUES_ERROR',
            message: leagueError.message,
            details: leagueError,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }
      
      // If admin has no leagues, return empty array
      if (!adminLeagues || adminLeagues.length === 0) {
        return {
          data: [],
          error: null,
          success: true
        };
      }
      
      // Extract league IDs for the filter
      const adminLeagueIds = adminLeagues.map(league => league.id);
      
      const { data: requests, error } = await supabase
        .from('team_join_requests')
        .select(`
          id,
          team_id,
          league_id,
          requested_by,
          message,
          status,
          reviewed_by,
          reviewed_at,
          review_message,
          created_at,
          expires_at,
          teams:team_id (
            id,
            name,
            team_color,
            team_bio,
            captain_id
          ),
          leagues:league_id (
            id,
            name,
            description,
            sport_type,
            league_type
          )
        `)
        .eq('status', 'pending')
        .in('league_id', adminLeagueIds)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          data: null,
          error: {
            code: 'FETCH_REQUESTS_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Get user profile data for each request
      const userIds = [...new Set((requests || []).map(r => r.requested_by))];
      
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, full_name')
        .in('id', userIds);
      
      // Create lookup map for profiles
      const profileMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
      
      // Transform the data to match our expected interface
      const transformedRequests: TeamLeagueRequestWithDetails[] = (requests || []).map(request => {
        const profile = profileMap.get(request.requested_by);
        return {
          id: request.id,
          team_id: request.team_id,
          league_id: request.league_id,
          requested_by: request.requested_by,
          message: request.message,
          status: request.status as 'pending' | 'approved' | 'rejected' | 'withdrawn',
          reviewed_by: request.reviewed_by,
          reviewed_at: request.reviewed_at,
          review_message: request.review_message,
          created_at: request.created_at,
          expires_at: request.expires_at,
          team: request.teams as any,
          league: request.leagues as any,
          requested_by_user: {
            email: profile?.display_name || 'Unknown User', // Use display name as fallback
            display_name: profile?.display_name || null,
            full_name: profile?.full_name || null
          }
        };
      });

      return {
        data: transformedRequests,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Approve a team join request
   */
  async approveRequest({ requestId, adminId, responseMessage }: ApproveRequestData): Promise<ServiceResponse<TeamLeagueRequest>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return {
          data: null,
          error: {
            code: 'NO_SESSION',
            message: 'No valid session found',
            details: null,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const response = await fetch(`/api/league-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          responseMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: {
            code: 'API_ERROR',
            message: errorData.error || `API request failed with status ${response.status}`,
            details: errorData,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const result = await response.json();

      return {
        data: result.data as TeamLeagueRequest,
        error: null,
        success: true,
        message: result.message || 'Request approved successfully'
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Reject a team join request
   */
  async rejectRequest({ requestId, adminId, responseMessage }: RejectRequestData): Promise<ServiceResponse<TeamLeagueRequest>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return {
          data: null,
          error: {
            code: 'NO_SESSION',
            message: 'No valid session found',
            details: null,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const response = await fetch(`/api/league-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          responseMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: {
            code: 'API_ERROR',
            message: errorData.error || `API request failed with status ${response.status}`,
            details: errorData,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const result = await response.json();

      return {
        data: result.data as TeamLeagueRequest,
        error: null,
        success: true,
        message: result.message || 'Request rejected successfully'
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get detailed information about a specific request
   */
  async getRequestDetails(requestId: string): Promise<ServiceResponse<TeamLeagueRequestWithDetails>> {
    try {
      const { data: request, error } = await supabase
        .from('team_join_requests')
        .select(`
          id,
          team_id,
          league_id,
          requested_by,
          message,
          status,
          reviewed_by,
          reviewed_at,
          review_message,
          created_at,
          expires_at,
          teams:team_id (
            id,
            name,
            team_color,
            team_bio,
            captain_id
          ),
          leagues:league_id (
            id,
            name,
            description,
            sport_type,
            league_type
          ),
          user_profiles:requested_by (
            display_name,
            full_name
          ),
          auth_users:requested_by (
            email
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
            details: error,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Transform the data to match our expected interface
      const transformedRequest: TeamLeagueRequestWithDetails = {
        id: request.id,
        team_id: request.team_id,
        league_id: request.league_id,
        requested_by: request.requested_by,
        message: request.message,
        status: request.status as 'pending' | 'approved' | 'rejected' | 'withdrawn',
        reviewed_by: request.reviewed_by,
        reviewed_at: request.reviewed_at,
        review_message: request.review_message,
        created_at: request.created_at,
        expires_at: request.expires_at,
        team: request.teams as any,
        league: request.leagues as any,
        requested_by_user: {
          email: (request as any).auth_users?.email || '',
          display_name: (request as any).user_profiles?.display_name,
          full_name: (request as any).user_profiles?.full_name
        }
      };

      return {
        data: transformedRequest,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get request statistics for an admin
   */
  async getRequestStats(adminId: string): Promise<ServiceResponse<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>> {
    try {
      const { data: stats, error } = await supabase
        .from('team_join_requests')
        .select('status')
        .in('league_id', 
          supabase
            .from('leagues')
            .select('id')
            .eq('created_by', adminId)
        );

      if (error) {
        return {
          data: null,
          error: {
            code: 'FETCH_STATS_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const summary = (stats || []).reduce((acc, request) => {
        acc.total++;
        acc[request.status as keyof typeof acc]++;
        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      });

      return {
        data: summary,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Create and potentially auto-approve a team league join request
   * Supports Copa Facil-style instant joining for leagues with auto-approval
   */
  async createTeamRequest(data: CreateTeamRequestData): Promise<ServiceResponse<TeamLeagueRequest>> {
    try {
      // Check if league has auto-approval enabled
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('auto_approve_teams, is_public, registration_deadline, max_teams')
        .eq('id', data.leagueId)
        .eq('is_active', true)
        .single();

      if (leagueError) {
        return {
          data: null,
          error: {
            code: 'LEAGUE_NOT_FOUND',
            message: 'League not found or inactive',
            details: leagueError,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Verify league accepts registrations
      if (!league.is_public) {
        return {
          data: null,
          error: {
            code: 'LEAGUE_NOT_PUBLIC',
            message: 'League is not accepting public registrations',
            details: null,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Check registration deadline
      if (league.registration_deadline && new Date(league.registration_deadline) < new Date()) {
        return {
          data: null,
          error: {
            code: 'REGISTRATION_DEADLINE_PASSED',
            message: 'Registration deadline has passed',
            details: null,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Check max teams limit
      if (league.max_teams) {
        const { count: teamCount } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', data.leagueId);

        if (teamCount && teamCount >= league.max_teams) {
          return {
            data: null,
            error: {
              code: 'LEAGUE_AT_CAPACITY',
              message: 'League has reached maximum team capacity',
              details: null,
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
      }

      // Check if team already has pending/approved request
      const { data: existingRequest } = await supabase
        .from('team_join_requests')
        .select('id, status')
        .eq('team_id', data.teamId)
        .eq('league_id', data.leagueId)
        .in('status', ['pending', 'approved'])
        .single();

      if (existingRequest) {
        return {
          data: null,
          error: {
            code: 'REQUEST_EXISTS',
            message: `Team already has a ${existingRequest.status} request for this league`,
            details: null,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Create request
      const requestData = {
        team_id: data.teamId,
        league_id: data.leagueId,
        requested_by: data.requestedBy,
        message: data.message || null,
        status: league.auto_approve_teams ? 'approved' : 'pending',
        reviewed_by: league.auto_approve_teams ? 'system' : null,
        reviewed_at: league.auto_approve_teams ? new Date().toISOString() : null,
        review_message: league.auto_approve_teams ? 'Automatically approved' : null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const { data: newRequest, error: createError } = await supabase
        .from('team_join_requests')
        .insert(requestData)
        .select()
        .single();

      if (createError) throw createError;

      // If auto-approved, update team's league_id directly
      if (league.auto_approve_teams) {
        const { error: teamUpdateError } = await supabase
          .from('teams')
          .update({ league_id: data.leagueId })
          .eq('id', data.teamId);

        if (teamUpdateError) {
          console.error('Failed to update team league_id after auto-approval:', teamUpdateError);
          // Don't fail the request, just log the error
        }
      }

      return {
        data: newRequest,
        error: null,
        success: true,
        message: league.auto_approve_teams 
          ? 'Team request automatically approved and team joined league!' 
          : 'Team join request submitted successfully'
      };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get auto-approval settings for a league
   */
  async getLeagueAutoApprovalSettings(leagueId: string): Promise<ServiceResponse<{
    autoApprove: boolean;
    isPublic: boolean;
    registrationDeadline?: string;
    maxTeams?: number;
    currentTeams: number;
    acceptingRegistrations: boolean;
  }>> {
    try {
      const { data: league, error } = await supabase
        .from('leagues')
        .select(`
          auto_approve_teams,
          is_public,
          registration_deadline,
          max_teams,
          teams (id)
        `)
        .eq('id', leagueId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const currentTeams = league.teams?.length || 0;
      const now = new Date().toISOString();
      const deadlinePassed = league.registration_deadline && league.registration_deadline < now;
      const atCapacity = league.max_teams && currentTeams >= league.max_teams;
      const acceptingRegistrations = league.is_public && !deadlinePassed && !atCapacity;

      return {
        data: {
          autoApprove: league.auto_approve_teams || false,
          isPublic: league.is_public || false,
          registrationDeadline: league.registration_deadline,
          maxTeams: league.max_teams,
          currentTeams,
          acceptingRegistrations
        },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }
}