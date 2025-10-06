/**
 * Real-time Matches Hook
 * 
 * Provides real-time updates for live match data using Supabase subscriptions.
 * Follows LEVER principles by managing reactive state updates automatically.
 * 
 * @example
 * ```typescript
 * const { liveMatches, isConnected } = useRealtimeMatches();
 * const { match, events } = useRealtimeMatch(matchId);
 * ```
 * 
 * This hook should be used for ALL real-time match data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MatchService } from '../services/match.service';

export interface RealtimeMatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  eventType: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution';
  eventTime: number;
  description?: string;
  playerName?: string;
  teamName?: string;
  timestamp: string;
}

export interface RealtimeMatchUpdate {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  lastUpdated: string;
}

/**
 * Hook for getting all live matches with real-time updates
 */
export function useRealtimeMatches() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  
  // Get initial live matches
  const { data: liveMatches = [], isLoading, error } = useQuery({
    queryKey: ['live-matches'],
    queryFn: () => MatchService.getInstance().getLiveMatches(),
    refetchInterval: 30000, // Fallback polling every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  useEffect(() => {
    let channel: any;
    
    const setupRealtimeSubscription = async () => {
      try {
        // Import Supabase client dynamically to avoid SSR issues
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        channel = supabase
          .channel('live-matches')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: 'status=eq.in_progress'
            },
            (payload) => {
              console.log('Live match update:', payload);
              
              // Invalidate and refetch live matches
              queryClient.invalidateQueries({ queryKey: ['live-matches'] });
              
              // Also invalidate specific match if we have the ID
              if (payload.new?.id) {
                queryClient.invalidateQueries({ 
                  queryKey: ['match', payload.new.id] 
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'match_events'
            },
            (payload) => {
              console.log('New match event:', payload);
              
              // Invalidate related match data
              if (payload.new?.match_id) {
                queryClient.invalidateQueries({ 
                  queryKey: ['match', payload.new.match_id] 
                });
                queryClient.invalidateQueries({ 
                  queryKey: ['match-events', payload.new.match_id] 
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('Connected to live match updates');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log('Disconnected from live match updates');
            }
          });
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [queryClient]);

  return {
    liveMatches,
    isLoading,
    error,
    isConnected,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['live-matches'] })
  };
}

/**
 * Hook for real-time updates on a specific match
 */
export function useRealtimeMatch(matchId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [recentEvents, setRecentEvents] = useState<RealtimeMatchEvent[]>([]);
  const queryClient = useQueryClient();

  // Get match details
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchId ? MatchService.getInstance().getMatchById(matchId) : null,
    enabled: !!matchId,
    refetchInterval: match?.status === 'in_progress' ? 15000 : false,
    staleTime: 5000,
  });

  // Get match events
  const { data: matchStats } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => matchId ? MatchService.getInstance().getMatchStatistics(matchId) : null,
    enabled: !!matchId,
    refetchInterval: match?.status === 'in_progress' ? 10000 : false,
    staleTime: 3000,
  });

  const addRecentEvent = useCallback((event: RealtimeMatchEvent) => {
    setRecentEvents(prev => {
      // Keep only the last 10 events and ensure no duplicates
      const filtered = prev.filter(e => e.id !== event.id);
      return [event, ...filtered].slice(0, 10);
    });

    // Auto-remove the event after 30 seconds
    setTimeout(() => {
      setRecentEvents(prev => prev.filter(e => e.id !== event.id));
    }, 30000);
  }, []);

  useEffect(() => {
    if (!matchId) return;

    let channel: any;

    const setupMatchSubscription = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        channel = supabase
          .channel(`match-${matchId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: `id=eq.${matchId}`
            },
            (payload) => {
              console.log('Match update:', payload);
              
              queryClient.invalidateQueries({ queryKey: ['match', matchId] });
              
              // If this is a score update, create a visual event
              if (payload.eventType === 'UPDATE' && payload.new) {
                const oldScore = payload.old;
                const newScore = payload.new;
                
                if (oldScore.home_score !== newScore.home_score || 
                    oldScore.away_score !== newScore.away_score) {
                  // Score changed - this will be handled by match events
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'match_events',
              filter: `match_id=eq.${matchId}`
            },
            (payload) => {
              console.log('New match event:', payload);
              
              // Invalidate match events query
              queryClient.invalidateQueries({ 
                queryKey: ['match-events', matchId] 
              });
              
              // Add to recent events for visual notification
              if (payload.new) {
                const event: RealtimeMatchEvent = {
                  id: payload.new.id,
                  matchId: payload.new.match_id,
                  teamId: payload.new.team_id,
                  playerId: payload.new.player_id,
                  eventType: payload.new.event_type,
                  eventTime: payload.new.event_time || 0,
                  description: payload.new.description,
                  timestamp: new Date().toISOString()
                };
                
                addRecentEvent(event);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log(`Connected to match ${matchId} updates`);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log(`Disconnected from match ${matchId} updates`);
            }
          });
      } catch (error) {
        console.error('Failed to setup match subscription:', error);
        setIsConnected(false);
      }
    };

    setupMatchSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [matchId, queryClient, addRecentEvent]);

  return {
    match,
    matchStats,
    recentEvents,
    isLoading: matchLoading,
    isConnected,
    clearRecentEvents: () => setRecentEvents([]),
    refetch: () => {
      if (matchId) {
        queryClient.invalidateQueries({ queryKey: ['match', matchId] });
        queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
      }
    }
  };
}

/**
 * Hook for real-time team notifications (for team-specific updates)
 */
export function useRealtimeTeamUpdates(teamId: string | null) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'match_started' | 'goal_scored' | 'match_ended';
    message: string;
    timestamp: string;
  }>>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;

    let channel: any;

    const setupTeamSubscription = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        channel = supabase
          .channel(`team-${teamId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: `or(home_team_id.eq.${teamId},away_team_id.eq.${teamId})`
            },
            (payload) => {
              // Handle team match updates
              if (payload.new) {
                queryClient.invalidateQueries({ 
                  queryKey: ['team-matches', teamId] 
                });
                
                // Create notification for status changes
                if (payload.old?.status !== payload.new.status) {
                  const notification = {
                    id: `${payload.new.id}-${Date.now()}`,
                    type: payload.new.status === 'in_progress' ? 'match_started' : 'match_ended',
                    message: payload.new.status === 'in_progress' 
                      ? 'Your match has started!' 
                      : 'Your match has ended!',
                    timestamp: new Date().toISOString()
                  };
                  
                  setNotifications(prev => [notification, ...prev.slice(0, 9)]);
                }
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Failed to setup team subscription:', error);
      }
    };

    setupTeamSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [teamId, queryClient]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification
  };
}