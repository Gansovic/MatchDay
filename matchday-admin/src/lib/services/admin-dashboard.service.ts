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
import type { ServiceResponse } from '@/lib/types/database.types';

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
      // Get admin profile info
      const { data: adminProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('display_name, role')
        .eq('id', adminUserId)
        .single();

      if (profileError) {
        console.warn('Admin profile not found, using default values');
      }

      // Get admin user email from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
          displayName: adminProfile?.display_name || null,
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
   * Get team count for a specific league using junction table
   */
  private async getLeagueTeamCount(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('team_leagues')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (error) throw error;
      return { data: count || 0, error: null, success: true };
    } catch (error) {
      return { data: 0, error: null, success: false };
    }
  }

  /**
   * Get player count for a specific league
   */
  private async getLeaguePlayerCount(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      // Get all teams in the league using junction table (for multi-league support)
      const { data: teamLeagues, error: teamsError } = await supabase
        .from('team_leagues')
        .select('team_id')
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;
      
      if (!teamLeagues || teamLeagues.length === 0) {
        return { data: 0, error: null, success: true };
      }

      const teamIds = teamLeagues.map(tl => tl.team_id);

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

      // Get team join requests for teams in admin's leagues
      const { data: joinRequests, error } = await supabase
        .from('team_join_requests')
        .select(`
          id,
          status,
          created_at,
          user_id,
          team:teams!inner(
            name,
            league:leagues!inner(name)
          ),
          user_profile:user_profiles!inner(display_name)
        `)
        .eq('status', 'pending')
        .in('team.league_id', leagueIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Could not fetch join requests:', error);
        return { data: [], error: null, success: true };
      }

      const pendingRequests: PendingRequest[] = (joinRequests || []).map(request => ({
        id: request.id,
        type: 'team_join' as const,
        teamName: request.team?.name || 'Unknown Team',
        leagueName: request.team?.league?.name || 'Unknown League',
        requestedBy: request.user_profile?.display_name || 'Unknown User',
        createdAt: request.created_at,
        status: 'pending' as const
      }));

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

      // Get recent team joins in admin's leagues via junction table
      const { data: recentTeamJoins, error: teamsError } = await supabase
        .from('team_leagues')
        .select(`
          team_id,
          league_id,
          joined_at,
          teams!inner(id, name),
          leagues!inner(id, name)
        `)
        .in('league_id', leagueIds)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [];

      if (recentTeamJoins && !teamsError) {
        // Use a Map to deduplicate entries based on team-league combination
        const activityMap = new Map<string, RecentActivity>();
        
        recentTeamJoins.forEach(join => {
          // Create a unique key using both team_id and league_id with timestamp for uniqueness
          const uniqueKey = `team-join-${join.team_id}-${join.league_id}-${new Date(join.joined_at).getTime()}`;
          
          // Only add if we haven't seen this team-league combination recently
          if (!activityMap.has(uniqueKey)) {
            activityMap.set(uniqueKey, {
              id: uniqueKey,
              type: 'team_joined',
              description: `Team "${(join.teams as any).name}" joined ${(join.leagues as any).name}`,
              timestamp: join.joined_at,
              relatedEntity: {
                type: 'team',
                id: (join.teams as any).id,
                name: (join.teams as any).name
              }
            });
          }
        });
        
        activities.push(...activityMap.values());
      }

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        data: activities.slice(0, 10), // Limit to 10 most recent
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

      // Get count of pending team league requests directly
      const { count, error } = await supabase
        .from('team_league_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('league_id', leagueIds);

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

      // Get teams that joined leagues this month via junction table
      const { count: thisMonthCount, error: thisMonthError } = await supabase
        .from('team_leagues')
        .select('*', { count: 'exact', head: true })
        .in('league_id', leagueIds)
        .eq('is_active', true)
        .gte('joined_at', thisMonth.toISOString());

      // Get teams that joined leagues last month via junction table
      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from('team_leagues')
        .select('*', { count: 'exact', head: true })
        .in('league_id', leagueIds)
        .eq('is_active', true)
        .gte('joined_at', lastMonth.toISOString())
        .lt('joined_at', thisMonth.toISOString());

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