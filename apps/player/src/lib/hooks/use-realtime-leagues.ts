/**
 * Real-time Leagues Hook
 * 
 * Provides real-time updates for league data using Supabase subscriptions.
 * Ensures leagues are always synchronized across all components and apps.
 * 
 * @example
 * ```typescript
 * const { leagues, isConnected } = useRealtimeLeagues();
 * const { league, teams, requests } = useRealtimeLeagueDetail(leagueId);
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
}

/**
 * Hook for real-time leagues list with automatic synchronization
 */
export function useRealtimeLeagues(filters?: {
  sportType?: string;
  leagueType?: string;
  isActive?: boolean;
  isPublic?: boolean;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Build API URL with filters
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('includeStats', 'true');
    
    if (filters?.sportType && filters.sportType !== 'all') {
      params.set('sportType', filters.sportType);
    }
    if (filters?.leagueType && filters.leagueType !== 'all') {
      params.set('leagueType', filters.leagueType);
    }
    if (filters?.isActive !== undefined) {
      params.set('isActive', filters.isActive.toString());
    }
    if (filters?.isPublic !== undefined) {
      params.set('isPublic', filters.isPublic.toString());
    }

    return `/api/leagues?${params.toString()}`;
  }, [filters]);

  // Get initial leagues data
  const { data: leagues = [], isLoading, error, refetch } = useQuery({
    queryKey: ['leagues', filters],
    queryFn: async () => {
      const response = await fetch(buildApiUrl());
      if (!response.ok) {
        throw new Error(`Failed to fetch leagues: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load leagues');
      }
      return result.data || [];
    },
    refetchInterval: isConnected ? false : 60000, // Fallback polling when not connected
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const isVisible = usePageVisibility();

  // Real-time subscription effect with page visibility optimization
  useEffect(() => {
    let channel: any;
    
    const setupLeaguesSubscription = async () => {
      try {
        console.log('🔄 Setting up real-time leagues subscription');
        
        channel = supabase
          .channel('leagues-updates')
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
              
              // Invalidate leagues query to trigger refetch
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
              
              // Also invalidate specific league if we have the ID
              const leagueId = payload.new?.id || payload.old?.id;
              if (leagueId) {
                queryClient.invalidateQueries({ 
                  queryKey: ['league', leagueId] 
                });
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
              table: 'seasons'
            },
            (payload) => {
              console.log('📅 Season update received:', {
                event: payload.eventType,
                seasonId: payload.new?.id || payload.old?.id,
                leagueId: payload.new?.league_id || payload.old?.league_id
              });
              
              setLastUpdate(new Date().toISOString());
              
              // Invalidate leagues query since season changes affect league stats
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
              
              // Invalidate specific league if we have league_id
              const leagueId = payload.new?.league_id || payload.old?.league_id;
              if (leagueId) {
                queryClient.invalidateQueries({ 
                  queryKey: ['league', leagueId] 
                });
                queryClient.invalidateQueries({ 
                  queryKey: ['league-seasons', leagueId] 
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
              
              // Invalidate leagues query since team registrations affect league stats
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
              queryClient.invalidateQueries({ queryKey: ['user', 'teams'] });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('✅ Connected to real-time leagues updates');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log('❌ Disconnected from real-time leagues updates');
            }
          });
      } catch (error) {
        console.error('Failed to setup leagues subscription:', error);
        setIsConnected(false);
      }
    };

    // Only setup subscription when page is visible
    if (isVisible) {
      setupLeaguesSubscription();
    } else {
      console.log('📱 Page not visible, skipping subscription setup');
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
        console.log('🔌 Unsubscribed from leagues updates');
      }
    };
  }, [queryClient, isVisible]);

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing leagues data');
    queryClient.invalidateQueries({ queryKey: ['leagues'] });
  }, [queryClient]);

  return {
    leagues,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    refetch,
    forceRefresh
  };
}

/**
 * Hook for real-time updates on a specific league with detailed data
 */
export function useRealtimeLeagueDetail(leagueId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get league details
  const { data: league, isLoading: leagueLoading } = useQuery({
    queryKey: ['league', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch league');
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!leagueId,
    refetchInterval: isConnected ? false : 30000,
    staleTime: 15000,
  });

  // Get league seasons
  const { data: seasons } = useQuery({
    queryKey: ['league-seasons', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      const response = await fetch(`/api/leagues/${leagueId}/seasons`);
      if (!response.ok) throw new Error('Failed to fetch seasons');
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!leagueId,
    refetchInterval: isConnected ? false : 60000,
    staleTime: 30000,
  });

  const isVisible = usePageVisibility();

  // Real-time subscription for specific league with page visibility optimization
  useEffect(() => {
    if (!leagueId) return;

    let channel: any;

    const setupLeagueSubscription = async () => {
      try {
        console.log(`🔄 Setting up real-time subscription for league ${leagueId}`);
        
        channel = supabase
          .channel(`league-${leagueId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leagues',
              filter: `id=eq.${leagueId}`
            },
            (payload) => {
              console.log(`🏆 League ${leagueId} update:`, {
                event: payload.eventType,
                changes: payload.new ? Object.keys(payload.new) : []
              });
              
              setLastUpdate(new Date().toISOString());
              
              // Invalidate specific league queries
              queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'seasons',
              filter: `league_id=eq.${leagueId}`
            },
            (payload) => {
              console.log(`📅 Season update for league ${leagueId}:`, {
                event: payload.eventType,
                seasonId: payload.new?.id || payload.old?.id
              });
              
              setLastUpdate(new Date().toISOString());
              
              queryClient.invalidateQueries({ 
                queryKey: ['league-seasons', leagueId] 
              });
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log(`✅ Connected to league ${leagueId} updates`);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log(`❌ Disconnected from league ${leagueId} updates`);
            }
          });
      } catch (error) {
        console.error('Failed to setup league subscription:', error);
        setIsConnected(false);
      }
    };

    // Only setup subscription when page is visible
    if (isVisible) {
      setupLeagueSubscription();
    } else {
      console.log(`📱 Page not visible, skipping league ${leagueId} subscription setup`);
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
        console.log(`🔌 Unsubscribed from league ${leagueId} updates`);
      }
    };
  }, [leagueId, queryClient, isVisible]);

  const forceRefresh = useCallback(() => {
    if (leagueId) {
      console.log(`🔄 Force refreshing league ${leagueId} data`);
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
      queryClient.invalidateQueries({ queryKey: ['league-seasons', leagueId] });
    }
  }, [leagueId, queryClient]);

  return {
    league,
    seasons,
    isLoading: leagueLoading,
    isConnected,
    lastUpdate,
    forceRefresh
  };
}

/**
 * Hook for real-time team join requests updates
 */
export function useRealtimeTeamRequests(leagueId?: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [recentRequests, setRecentRequests] = useState<RealtimeTeamJoinRequest[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: any;

    const setupRequestsSubscription = async () => {
      try {
        console.log('🔄 Setting up real-time team requests subscription');
        
        const channelName = leagueId ? `requests-league-${leagueId}` : 'requests-global';
        
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'team_join_requests',
              ...(leagueId ? { filter: `league_id=eq.${leagueId}` } : {})
            },
            (payload) => {
              console.log('📋 Team request update:', {
                event: payload.eventType,
                requestId: payload.new?.id || payload.old?.id,
                status: payload.new?.status || payload.old?.status,
                leagueId: payload.new?.league_id || payload.old?.league_id
              });
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['team-requests'] });
              queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
              queryClient.invalidateQueries({ queryKey: ['leagues'] });
              
              // Add to recent requests for notifications
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
                
                setRecentRequests(prev => [newRequest, ...prev.slice(0, 9)]);
                
                // Auto-remove after 30 seconds
                setTimeout(() => {
                  setRecentRequests(prev => prev.filter(r => r.id !== newRequest.id));
                }, 30000);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('✅ Connected to team requests updates');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log('❌ Disconnected from team requests updates');
            }
          });
      } catch (error) {
        console.error('Failed to setup requests subscription:', error);
        setIsConnected(false);
      }
    };

    setupRequestsSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
        console.log('🔌 Unsubscribed from team requests updates');
      }
    };
  }, [leagueId, queryClient]);

  const clearRecentRequests = useCallback(() => {
    setRecentRequests([]);
  }, []);

  return {
    isConnected,
    recentRequests,
    clearRecentRequests
  };
}

/**
 * Page visibility hook to optimize subscriptions
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}