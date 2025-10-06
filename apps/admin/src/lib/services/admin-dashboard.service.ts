/**
 * Admin Dashboard Service for MatchDay
 * 
 * Handles admin-specific dashboard data fetching including:
 * - Admin's assigned leagues statistics
 * - Team counts and player counts
 * - Recent activity and pending requests
 * - Dashboard metrics specific to admin permissions
 */

import { supabase } from '@/lib/supabase/client';
import type { ServiceResponse } from '@matchday/database';

export interface AdminDashboardStats {
  totalLeagues: number;
  totalTeams: number;
  totalPlayers: number;
  pendingRequests: number;
  activeMatches: number;
  monthlyGrowth: number;
}

export interface AdminLeague {
  id: string;
  name: string;
  description: string | null;
  sport_type: string;
  league_type: string;
  location: string | null;
  teamCount: number;
  playerCount: number;
  isActive: boolean;
  created_at: string;
}

export interface PendingRequest {
  id: string;
  type: 'team_join' | 'team_creation';
  teamName: string;
  leagueName: string;
  requestedBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface RecentActivity {
  id: string;
  type: 'team_joined' | 'match_scheduled' | 'league_created' | 'player_registered';
  description: string;
  timestamp: string;
  relatedEntity?: {
    type: 'team' | 'league' | 'match' | 'player';
    id: string;
    name: string;
  };
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  leagues: AdminLeague[];
  pendingRequests: PendingRequest[];
  recentActivity: RecentActivity[];
  adminInfo: {
    displayName: string | null;
    email: string;
    role: string;
  };
}

export class AdminDashboardService {
  private static instance: AdminDashboardService;
  
  static getInstance(): AdminDashboardService {
    if (!AdminDashboardService.instance) {
      AdminDashboardService.instance = new AdminDashboardService();
    }
    return AdminDashboardService.instance;
  }

  /**
   * Get comprehensive dashboard data for the admin user
   */
  async getDashboardData(adminUserId: string): Promise<ServiceResponse<AdminDashboardData>> {
    try {
      console.log('[AdminDashboardService] Getting dashboard data for user:', adminUserId);
      
      // Get admin profile info
      const { data: adminProfile, error: profileError } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', adminUserId)
        .single();

      if (profileError) {
        console.warn('[AdminDashboardService] Admin profile not found, using default values:', {
          error: profileError,
          errorMessage: profileError?.message || 'No message',
          errorCode: profileError?.code || 'No code',
          isEmpty: !profileError || Object.keys(profileError).length === 0
        });
      }

      // Get admin user email from auth
      console.log('[AdminDashboard] Getting current user from auth...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[AdminDashboard] Auth user error:', userError);
      } else {
        console.log('[AdminDashboard] Auth user retrieved:', { hasUser: !!user, email: user?.email });
      }
      
      const adminEmail = user?.email || 'admin@matchday.com';

      // Get admin's assigned leagues
      const leagues = await this.getAdminLeagues(adminUserId);
      if (!leagues.success || !leagues.data) {
        throw new Error('Failed to fetch admin leagues');
      }

      // Calculate overall statistics
      const stats = await this.calculateDashboardStats(leagues.data);
      if (!stats.success || !stats.data) {
        throw new Error('Failed to calculate dashboard stats');
      }

      // Get pending requests for admin's leagues
      const pendingRequests = await this.getPendingRequests(leagues.data.map(l => l.id));
      
      // Get recent activity for admin's leagues
      const recentActivity = await this.getRecentActivity(leagues.data.map(l => l.id));

      const dashboardData: AdminDashboardData = {
        stats: stats.data,
        leagues: leagues.data,
        pendingRequests: pendingRequests.data || [],
        recentActivity: recentActivity.data || [],
        adminInfo: {
          displayName: adminProfile?.full_name || null,
          email: adminEmail,
          role: adminProfile?.role || 'admin'
        }
      };

      return {
        data: dashboardData,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'DASHBOARD_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get leagues assigned to or managed by the admin
   */
  async getAdminLeagues(adminUserId: string): Promise<ServiceResponse<AdminLeague[]>> {
    try {
      // For this demo, we'll get specific leagues that the admin@matchday.com manages
      // In a real implementation, this would be based on league_admins table or similar
      let query = supabase
        .from('leagues')
        .select(`
          id,
          name,
          description,
          sport_type,
          league_type,
          location,
          is_active,
          created_at
        `);

      // Get leagues created by the admin
      query = query.eq('created_by', adminUserId);

      const { data: leagues, error } = await query.eq('is_active', true);

      if (error) throw error;

      // Process leagues to add team and player counts using junction table
      const adminLeagues: AdminLeague[] = await Promise.all(
        (leagues || []).map(async (league) => {
          // Get team count using junction table for multi-league support
          const teamCount = await this.getLeagueTeamCount(league.id);
          
          // Get player count for this league
          const playerCount = await this.getLeaguePlayerCount(league.id);

          return {
            id: league.id,
            name: league.name,
            description: league.description,
            sport_type: league.sport_type,
            league_type: league.league_type,
            location: league.location,
            teamCount: teamCount.data || 0,
            playerCount: playerCount.data || 0,
            isActive: league.is_active || false,
            created_at: league.created_at
          };
        })
      );

      return {
        data: adminLeagues,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'LEAGUES_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch admin leagues',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Calculate dashboard statistics from admin's leagues
   */
  async calculateDashboardStats(leagues: AdminLeague[]): Promise<ServiceResponse<AdminDashboardStats>> {
    try {
      const totalLeagues = leagues.length;
      const totalTeams = leagues.reduce((sum, league) => sum + league.teamCount, 0);
      const totalPlayers = leagues.reduce((sum, league) => sum + league.playerCount, 0);

      // Get pending requests count
      const leagueIds = leagues.map(l => l.id);
      const pendingRequestsCount = await this.getPendingRequestsCount(leagueIds);

      // Get active matches count
      const activeMatchesCount = await this.getActiveMatchesCount(leagueIds);

      // Calculate monthly growth (simplified - would need historical data)
      const monthlyGrowth = await this.calculateMonthlyGrowth(leagueIds);

      const stats: AdminDashboardStats = {
        totalLeagues,
        totalTeams,
        totalPlayers,
        pendingRequests: pendingRequestsCount.data || 0,
        activeMatches: activeMatchesCount.data || 0,
        monthlyGrowth: monthlyGrowth.data || 0
      };

      return {
        data: stats,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'STATS_CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate dashboard stats',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get team count for a specific league using direct relationship
   */
  private async getLeagueTeamCount(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .eq('is_archived', false);

      if (error) throw error;
      return { data: count || 0, error: null, success: true };
    } catch (error) {
      return { data: 0, error: null, success: false };
    }
  }

  /**
   * Get player count for a specific league using direct relationship
   */
  private async getLeaguePlayerCount(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      // Get all teams in the league using direct relationship
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('is_archived', false);

      if (teamsError) throw teamsError;
      
      if (!teams || teams.length === 0) {
        return { data: 0, error: null, success: true };
      }

      const teamIds = teams.map(t => t.id);

      // Get count of active team members for those teams
      const { count, error } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('team_id', teamIds);

      if (error) throw error;
      return { data: count || 0, error: null, success: true };
    } catch (error) {
      return { data: 0, error: null, success: false };
    }
  }

  /**
   * Get pending requests for admin's leagues
   */
  async getPendingRequests(leagueIds: string[]): Promise<ServiceResponse<PendingRequest[]>> {
    try {
      if (leagueIds.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Step 1: Get teams in admin's leagues
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, league_id')
        .in('league_id', leagueIds)
        .eq('is_archived', false);

      if (teamsError || !teams || teams.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Step 2: Get pending join requests for these teams
      const teamIds = teams.map(t => t.id);
      const { data: joinRequests, error: requestsError } = await supabase
        .from('team_join_requests')
        .select(`
          id,
          team_id,
          status,
          created_at,
          user_id
        `)
        .in('team_id', teamIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) {
        console.warn('Could not fetch join requests:', requestsError);
        return { data: [], error: null, success: true };
      }

      if (!joinRequests || joinRequests.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Step 3: Get league and user data
      const { data: leagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name')
        .in('id', leagueIds);

      const userIds = [...new Set(joinRequests.map(r => r.user_id))];
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Create lookup maps
      const teamsMap = teams.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {} as Record<string, any>);

      const leaguesMap = (leagues || []).reduce((acc, league) => {
        acc[league.id] = league;
        return acc;
      }, {} as Record<string, any>);

      const usersMap = (userProfiles || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      const pendingRequests: PendingRequest[] = joinRequests.map(request => {
        const team = teamsMap[request.team_id];
        const league = leaguesMap[team?.league_id];
        const user = usersMap[request.user_id];

        return {
          id: request.id,
          type: 'team_join' as const,
          teamName: team?.name || 'Unknown Team',
          leagueName: league?.name || 'Unknown League',
          requestedBy: user?.display_name || 'Unknown User',
          createdAt: request.created_at,
          status: 'pending' as const
        };
      });

      return {
        data: pendingRequests,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: [],
        error: null,
        success: true
      };
    }
  }

  /**
   * Get recent activity for admin's leagues
   */
  async getRecentActivity(leagueIds: string[]): Promise<ServiceResponse<RecentActivity[]>> {
    try {
      if (leagueIds.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Get recent teams created in admin's leagues using direct relationship
      const { data: recentTeams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          league_id,
          created_at,
          leagues!inner(id, name)
        `)
        .in('league_id', leagueIds)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const activities: RecentActivity[] = [];

      if (recentTeams && !teamsError) {
        recentTeams.forEach(team => {
          // Create a unique ID using the team ID and creation timestamp
          const uniqueId = `team-created-${team.id}`;
          
          activities.push({
            id: uniqueId,
            type: 'team_joined',
            description: `Team "${team.name}" joined ${(team.leagues as any).name}`,
            timestamp: team.created_at,
            relatedEntity: {
              type: 'team',
              id: team.id,
              name: team.name
            }
          });
        });
      }

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        data: activities.slice(0, 10), // Limit to 10 most recent after deduplication
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: [],
        error: null,
        success: true
      };
    }
  }

  /**
   * Get count of pending requests
   */
  private async getPendingRequestsCount(leagueIds: string[]): Promise<ServiceResponse<number>> {
    try {
      if (leagueIds.length === 0) {
        return { data: 0, error: null, success: true };
      }

      // Step 1: Get teams in admin's leagues
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .in('league_id', leagueIds)
        .eq('is_archived', false);

      if (teamsError || !teams || teams.length === 0) {
        return { data: 0, error: null, success: true };
      }

      // Step 2: Get count of pending requests for these teams
      const teamIds = teams.map(t => t.id);
      const { count, error } = await supabase
        .from('team_join_requests')
        .select('*', { count: 'exact', head: true })
        .in('team_id', teamIds)
        .eq('status', 'pending');

      if (error) {
        console.warn('Could not fetch pending requests count:', error);
        return { data: 0, error: null, success: true };
      }

      return { data: count || 0, error: null, success: true };

    } catch (error) {
      return { data: 0, error: null, success: true };
    }
  }

  /**
   * Get count of active matches
   */
  private async getActiveMatchesCount(leagueIds: string[]): Promise<ServiceResponse<number>> {
    try {
      if (leagueIds.length === 0) {
        return { data: 0, error: null, success: true };
      }

      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('league_id', leagueIds)
        .gte('match_date', new Date().toISOString())
        .eq('status', 'scheduled');

      if (error) {
        console.warn('Could not fetch active matches count:', error);
        return { data: 0, error: null, success: true };
      }

      return { data: count || 0, error: null, success: true };

    } catch (error) {
      return { data: 0, error: null, success: true };
    }
  }

  /**
   * Calculate monthly growth
   */
  private async calculateMonthlyGrowth(leagueIds: string[]): Promise<ServiceResponse<number>> {
    try {
      if (leagueIds.length === 0) {
        return { data: 0, error: null, success: true };
      }

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get teams created this month using direct relationship
      const { count: thisMonthCount, error: thisMonthError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .in('league_id', leagueIds)
        .eq('is_archived', false)
        .gte('created_at', thisMonth.toISOString());

      // Get teams created last month using direct relationship
      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .in('league_id', leagueIds)
        .eq('is_archived', false)
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', thisMonth.toISOString());

      if (thisMonthError || lastMonthError) {
        return { data: 0, error: null, success: true };
      }

      const thisMonth_Count = thisMonthCount || 0;
      const lastMonth_Count = lastMonthCount || 0;

      let growth = 0;
      if (lastMonth_Count > 0) {
        growth = Math.round(((thisMonth_Count - lastMonth_Count) / lastMonth_Count) * 100);
      } else if (thisMonth_Count > 0) {
        growth = 100; // 100% growth if we had 0 last month and some this month
      }

      return { data: Math.max(-100, Math.min(100, growth)), error: null, success: true };

    } catch (error) {
      return { data: 0, error: null, success: true };
    }
  }
}