/**
 * Leagues Discovery Page
 * 
 * Professional interface for discovering and joining leagues plus viewing standings.
 * Shows league management and real-time standings for leagues users are in.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LeagueManagement, type League, type UserTeam } from '@/components/leagues/league-management';
import { LeagueStandings } from '@/components/leagues/league-standings';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { Trophy, Users, BarChart3, Loader2 } from 'lucide-react';

export default function LeaguesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'standings'>('discover');
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserLeagues();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserLeagues = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        setUserLeagues([]);
        return;
      }

      // Use LeagueService to get user's league memberships
      const { supabase } = await import('@/lib/supabase/client');
      const { LeagueService } = await import('@matchday/services');
      
      const leagueService = LeagueService.getInstance(supabase);
      
      const response = await leagueService.getPlayerLeagueMemberships(user.id);
      
      if (response.success && response.data) {
        // Transform the data to match our League interface
        const userLeagues: League[] = response.data.map(membership => ({
          id: membership.id,
          name: membership.name,
          description: membership.description,
          sport_type: membership.sport_type,
          league_type: membership.league_type as 'recreational' | 'competitive' | 'semi-pro',
          location: membership.location,
          season_start: membership.season_start,
          season_end: membership.season_end,
          max_teams: membership.max_teams,
          entry_fee: membership.entry_fee,
          is_active: membership.is_active,
          is_public: membership.is_public,
          created_at: membership.created_at,
          teamCount: membership.teamCount,
          availableSpots: membership.availableSpots
        }));
        
        setUserLeagues(userLeagues);
      } else {
        // If there's an error but the user is authenticated, show empty state
        console.warn('Failed to load user leagues:', response.error);
        setUserLeagues([]);
      }
    } catch (error) {
      console.error('Failed to load user leagues:', error);
      setUserLeagues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'discover', label: 'Discover Leagues', icon: Users, count: null },
    { id: 'standings', label: 'My League Standings', icon: Trophy, count: userLeagues.length }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to discover and join leagues.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'discover' && (
          <LeagueManagement 
            userId={user?.id}
            onTeamJoinedLeague={(teamId, leagueId) => {
              console.log('Team joined league:', { teamId, leagueId });
              loadUserLeagues(); // Refresh user leagues
            }}
            onTeamLeftLeague={(teamId, leagueId) => {
              console.log('Team left league:', { teamId, leagueId });
              loadUserLeagues(); // Refresh user leagues
            }}
          />
        )}

        {activeTab === 'standings' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              </div>
            ) : userLeagues.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No League Standings
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join a league with your team to see standings and track your performance.
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Discover Leagues
                </button>
              </div>
            ) : (
              userLeagues.map((league) => (
                <LeagueStandings
                  key={league.id}
                  leagueId={league.id}
                  leagueName={league.name}
                  promotionSpots={2}
                  relegationSpots={2}
                  playoffSpots={4}
                  className="mb-6"
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}