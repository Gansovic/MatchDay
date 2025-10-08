/**
 * Real-time Leagues Hook - Admin App
 * 
 * Provides real-time updates for league data using Supabase subscriptions.
 * Optimized for admin operations with enhanced team request monitoring.
 * 
 * @example
 * ```typescript
 * const { leagues, isConnected } = useRealtimeLeagues();
 * const { league, requests } = useRealtimeLeagueDetail(leagueId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface RealtimeLeagueUpdate {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location?: string;
  max_teams?: number;
  entry_fee?: number;
  is_active: boolean;
  is_public: boolean;
  auto_approve_teams?: boolean;
  registration_deadline?: string;
  updated_at: string;
}

export interface RealtimeTeamJoinRequest {
  id: string;
  team_id: string;
  league_id: string;
  requested_by: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
  team?: {
    name: string;
    team_color?: string;
  };
}

/**
 * Hook for real-time leagues list with admin-specific features
 */
export function useRealtimeLeagues(adminId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const queryClient = useQueryClient();

  // Get admin leagues (both public and private leagues created by this admin)
  const { data: leagues = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-leagues', adminId],
    queryFn: async () => {
      const response = await fetch('/api/admin/leagues');
      if (!response.ok) {
        throw new Error(`Failed to fetch admin leagues: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load admin leagues');
      }
      return result.data || [];
    },
    enabled: !!adminId,
    refetchInterval: isConnected ? false : 60000,
    staleTime: 30000,
  });

  // Get pending requests count
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests', adminId],
    queryFn: async () => {
      if (!adminId) return [];
      const response = await fetch('/api/league-requests');
      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!adminId,
    refetchInterval: isConnected ? false : 30000,
    staleTime: 15000,
    onSuccess: (data) => {
      setPendingRequestsCount(data?.length || 0);
    }
  });

  const isVisible = usePageVisibility();

  // Real-time subscription effect with page visibility optimization
  useEffect(() => {
    if (!adminId) return;
    
    let channel: any;
    
    const setupAdminSubscription = async () => {
      try {
        console.log('🔄 Setting up admin real-time leagues subscription');
        
        channel = supabase
          .channel('admin-leagues')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leagues'
            },
            (payload) => {
              console.log('🏆 League update received:', {
                event: payload.eventType,
                leagueId: payload.new?.id || payload.old?.id,
                leagueName: payload.new?.name || payload.old?.name
              });
              
              setLastUpdate(new Date().toISOString());
              
              // Invalidate admin leagues queries
              queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
              
              // Also invalidate specific league
              const leagueId = payload.new?.id || payload.old?.id;
              if (leagueId) {
                queryClient.invalidateQueries({ 
                  queryKey: ['league-detail', leagueId] 
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'team_join_requests'
            },
            (payload) => {
              console.log('📋 Team request update received:', {
                event: payload.eventType,
                requestId: payload.new?.id || payload.old?.id,
                status: payload.new?.status || payload.old?.status,
                leagueId: payload.new?.league_id || payload.old?.league_id
              });
              
              setLastUpdate(new Date().toISOString());
              
              // Invalidate requests and league data
              queryClient.invalidateQueries({ 
                queryKey: ['pending-requests', adminId] 
              });
              queryClient.invalidateQueries({ 
                queryKey: ['admin-leagues', adminId] 
              });
              
              // Invalidate specific league detail if we have league_id
              const leagueId = payload.new?.league_id || payload.old?.league_id;
              if (leagueId) {
                queryClient.invalidateQueries({ 
                  queryKey: ['league-detail', leagueId] 
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'season_teams'
            },
            (payload) => {
              console.log('👥 Season team update received:', {
                event: payload.eventType,
                teamId: payload.new?.team_id || payload.old?.team_id,
                seasonId: payload.new?.season_id || payload.old?.season_id
              });
              
              setLastUpdate(new Date().toISOString());
              
              // Team registrations affect league stats
              queryClient.invalidateQueries({ 
                queryKey: ['admin-leagues', adminId] 
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('✅ Admin connected to real-time leagues updates');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log('❌ Admin disconnected from real-time leagues updates');
            }
          });
      } catch (error) {
        console.error('Failed to setup admin subscription:', error);
        setIsConnected(false);
      }
    };

    // Only setup subscription when page is visible
    if (isVisible) {
      setupAdminSubscription();
    } else {
      console.log('📱 Admin page not visible, skipping subscription setup');
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
        console.log('🔌 Admin unsubscribed from leagues updates');
      }
    };
  }, [adminId, queryClient, isVisible]);

  const forceRefresh = useCallback(() => {
    console.log('🔄 Admin force refreshing leagues data');
    queryClient.invalidateQueries({ queryKey: ['admin-leagues', adminId] });
    queryClient.invalidateQueries({ queryKey: ['pending-requests', adminId] });
  }, [adminId, queryClient]);

  return {
    leagues,
    pendingRequests,
    pendingRequestsCount,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    refetch,
    forceRefresh
  };
}

/**
 * Hook for real-time updates on a specific league with admin features
 */
export function useRealtimeLeagueDetail(leagueId: string | null, adminId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<RealtimeTeamJoinRequest[]>([]);
  const queryClient = useQueryClient();

  // Get league detail data (using API endpoint that supports name resolution)
  const { data: leagueData, isLoading: leagueLoading } = useQuery({
    queryKey: ['league-detail', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;
      
      // Use the API endpoint which supports both UUID and name resolution
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`League not found: ${leagueId}`);
          return null;
        }
        throw new Error(`Failed to fetch league: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to load league:', result.error);
        return null;
      }
      
      // Transform API response to match LeagueDetailData structure
      const leagueData = result.data;
      
      // Get pending requests for this league
      const requestsResponse = await fetch('/api/league-requests');
      let pendingRequests = [];
      if (requestsResponse.ok) {
        const requestsResult = await requestsResponse.json();
        if (requestsResult.success && requestsResult.data) {
          pendingRequests = requestsResult.data.filter((req: any) => 
            req.league_id === leagueData.id && req.status === 'pending'
          );
        }
      }
      
      // Get seasons for this league
      const seasonsResponse = await fetch(`/api/leagues/${leagueData.id}/seasons`);
      let seasons = [];
      if (seasonsResponse.ok) {
        const seasonsResult = await seasonsResponse.json();
        if (seasonsResult.success && seasonsResult.data) {
          seasons = seasonsResult.data;
        }
      }

      // Transform teams data to match the expected structure
      const teams = (leagueData.teams || []).map((team: any) => ({
        team_id: team.id,
        team_name: team.name,
        team_color: team.team_color || '#374151',
        team_logo_url: null,
        joined_at: team.created_at || new Date().toISOString(),
        is_active: true,
        member_count: team.currentPlayers || team.members?.length || 0
      }));
      
      return {
        league: leagueData,
        teams,
        seasons,
        stats: {
          totalTeams: leagueData.teamCount || teams.length,
          totalPlayers: leagueData.playerCount || 0,
          totalMatches: 0,
          completedMatches: 0,
          avgPlayersPerTeam: leagueData.averagePlayersPerTeam || 0
        },
        pendingRequests,
        recentActivity: [],
        standings: undefined
      };
    },
    enabled: !!leagueId,
    refetchInterval: isConnected ? false : 30000,
    staleTime: 15000,
  });

  const isVisible = usePageVisibility();

  // Real-time subscription for specific league with page visibility optimization
  useEffect(() => {
    if (!leagueId) return;

    let channel: any;

    const setupLeagueDetailSubscription = async () => {
      try {
        console.log(`🔄 Setting up admin real-time subscription for league ${leagueId}`);
        
        channel = supabase
          .channel(`admin-league-${leagueId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leagues',
              filter: `id=eq.${leagueId}`
            },
            (payload) => {
              console.log(`🏆 Admin league ${leagueId} update:`, {
                event: payload.eventType,
                changes: payload.new ? Object.keys(payload.new) : []
              });
              
              setLastUpdate(new Date().toISOString());
              
              queryClient.invalidateQueries({ 
                queryKey: ['league-detail', leagueId] 
              });
              queryClient.invalidateQueries({ 
                queryKey: ['admin-leagues', adminId] 
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'team_join_requests',
              filter: `league_id=eq.${leagueId}`
            },
            (payload) => {
              console.log(`📋 Team request update for league ${leagueId}:`, {
                event: payload.eventType,
                requestId: payload.new?.id || payload.old?.id,
                status: payload.new?.status
              });
              
              setLastUpdate(new Date().toISOString());
              
              queryClient.invalidateQueries({ 
                queryKey: ['league-detail', leagueId] 
              });
              queryClient.invalidateQueries({ 
                queryKey: ['pending-requests', adminId] 
              });
              
              // Add to recent requests for visual notification
              if (payload.new && payload.eventType === 'INSERT') {
                const newRequest: RealtimeTeamJoinRequest = {
                  id: payload.new.id,
                  team_id: payload.new.team_id,
                  league_id: payload.new.league_id,
                  requested_by: payload.new.requested_by,
                  message: payload.new.message,
                  status: payload.new.status,
                  created_at: payload.new.created_at,
                  updated_at: payload.new.updated_at
                };
                
                setRecentRequests(prev => [newRequest, ...prev.slice(0, 4)]);
                
                // Auto-remove after 10 seconds for admin notifications
                setTimeout(() => {
                  setRecentRequests(prev => prev.filter(r => r.id !== newRequest.id));
                }, 10000);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'season_teams'
            },
            (payload) => {
              // Filter for teams in seasons of this league
              const seasonId = payload.new?.season_id || payload.old?.season_id;
              if (seasonId) {
                console.log(`👥 Season team update for league ${leagueId}:`, {
                  event: payload.eventType,
                  teamId: payload.new?.team_id || payload.old?.team_id,
                  seasonId
                });
                
                setLastUpdate(new Date().toISOString());
                
                queryClient.invalidateQueries({ 
                  queryKey: ['league-detail', leagueId] 
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log(`✅ Admin connected to league ${leagueId} updates`);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log(`❌ Admin disconnected from league ${leagueId} updates`);
            }
          });
      } catch (error) {
        console.error('Failed to setup admin league subscription:', error);
        setIsConnected(false);
      }
    };

    // Only setup subscription when page is visible
    if (isVisible) {
      setupLeagueDetailSubscription();
    } else {
      console.log(`📱 Admin page not visible, skipping league ${leagueId} subscription setup`);
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
        console.log(`🔌 Admin unsubscribed from league ${leagueId} updates`);
      }
    };
  }, [leagueId, adminId, queryClient, isVisible]);

  const forceRefresh = useCallback(() => {
    if (leagueId) {
      console.log(`🔄 Admin force refreshing league ${leagueId} data`);
      queryClient.invalidateQueries({ queryKey: ['league-detail', leagueId] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', adminId] });
    }
  }, [leagueId, adminId, queryClient]);

  const clearRecentRequests = useCallback(() => {
    setRecentRequests([]);
  }, []);

  return {
    leagueData,
    recentRequests,
    isLoading: leagueLoading,
    isConnected,
    lastUpdate,
    forceRefresh,
    clearRecentRequests
  };
}

/**
 * Page visibility hook to optimize admin subscriptions
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      // Log visibility changes for admin debugging
      console.log(`👁️ Admin page visibility changed: ${visible ? 'visible' : 'hidden'}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}