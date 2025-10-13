/**
 * Unified Dashboard Page (Playtomic-Style Profile)
 *
 * Combines player profile, stats, matches, and performance analytics.
 * Similar to Playtomic's player profile interface.
 * All data from database, no mock data.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { Loader2, Star, TrendingUp, Users, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Import new Playtomic-style components
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { PlayerStatsBar } from '@/components/dashboard/PlayerStatsBar';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { MatchHistoryFeed } from '@/components/dashboard/MatchHistoryFeed';

// Import hooks
import {
  useUserStats,
  useUserTeams,
  useUserPerformance,
  useUserMatches,
  usePlayerLevel,
  usePerformanceData
} from '@/hooks/useDashboardData';

// Import CreateMatchModal
import { CreateMatchModal } from '@/components/matches/CreateMatchModal';

interface UserProfile {
  display_name?: string;
  preferred_position?: string;
  location?: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isTeamCaptain, setIsTeamCaptain] = useState(false);

  // Fetch user profile
  useEffect(() => {
    if (user?.id) {
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('users')
          .select('display_name, preferred_position, location, avatar_url')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserProfile(data);
        }
      };

      fetchUserProfile();
    }
  }, [user?.id]);

  // Fetch all dashboard data using hooks
  const { stats, teamStats, multiTeamContext, loading: statsLoading } = useUserStats(user?.id || null);
  const { teams, loading: teamsLoading } = useUserTeams(user?.id || null);
  const { performance } = useUserPerformance(user?.id || null);
  const { matches, loading: matchesLoading } = useUserMatches(user?.id || null);

  // Calculate player level/rating
  const { playerLevel, reliabilityPercentage } = usePlayerLevel(stats, teamStats);

  // Generate performance data for chart
  const { performanceData, loading: perfDataLoading } = usePerformanceData(matches, stats);

  // Calculate recent form from matches
  const recentForm = React.useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const completedMatches = matches
      .filter(m => m.status === 'completed' && m.homeScore !== undefined && m.awayScore !== undefined)
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 5);

    return completedMatches.map(match => {
      // Simplified - determine win/loss/draw
      if (match.homeScore > match.awayScore) return 'W';
      if (match.homeScore < match.awayScore) return 'L';
      return 'D';
    }) as ('W' | 'D' | 'L')[];
  }, [matches]);

  // Check if user is a team captain
  useEffect(() => {
    if (teams && teams.length > 0) {
      const isCaptain = teams.some(t => t.role === 'captain');
      setIsTeamCaptain(isCaptain);
    }
  }, [teams]);

  // Transform teams for CreateMatchModal
  const userTeamsForModal = teams.map(t => ({
    id: t.team.id,
    name: t.team.name,
    team_color: '#3B82F6', // Default color
    league_id: t.team.league?.id,
    league_name: t.team.league?.name
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <ProfileHeader
          displayName={userProfile?.display_name || user.email?.split('@')[0] || 'Player'}
          email={user.email || ''}
          preferredPosition={userProfile?.preferred_position}
          location={userProfile?.location}
          avatarUrl={userProfile?.avatar_url}
          playerLevel={playerLevel}
          reliabilityPercentage={reliabilityPercentage}
        />

        {/* Player Stats Bar */}
        <PlayerStatsBar
          matchesPlayed={stats?.matchesPlayed || 0}
          winRate={stats?.winRate || 0}
          goalsScored={stats?.goalsScored || 0}
          teamsJoined={stats?.teamsJoined || 0}
          recentForm={recentForm}
          isLoading={statsLoading}
        />

        {/* Performance Chart */}
        <PerformanceChart
          data={performanceData}
          isLoading={perfDataLoading}
        />

        {/* Match History Feed */}
        <MatchHistoryFeed
          matches={matches}
          isLoading={matchesLoading}
          currentUserId={user.id}
          isTeamCaptain={isTeamCaptain}
          onCreateMatch={() => setShowCreateModal(true)}
        />

        {/* Team Performance Breakdown - Show if user has multiple teams */}
        {multiTeamContext?.hasMultipleTeams && teamStats.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              Team Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamStats.map((team) => (
                <div key={team.team_id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.team_color || '#6B7280' }}
                    ></div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {team.team_name}
                    </h4>
                  </div>
                  {team.league_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {team.league_name}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {team.win_rate.toFixed(1)}%
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {team.games_played}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Games</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {team.wins}W-{team.draws}D-{team.losses}L
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Record</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <div className="font-semibold text-orange-600 dark:text-orange-400">
                        {team.team_position || 'Player'}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Position</div>
                    </div>
                  </div>
                  {multiTeamContext.bestPerformingTeam?.team_id === team.team_id && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <Star className="w-3 h-3" />
                      Top Performer
                    </div>
                  )}
                </div>
              ))}
            </div>
            {multiTeamContext.bestPerformingTeam && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Trophy className="w-4 h-4" />
                  <span className="font-medium">Best Performance: </span>
                  <span>{multiTeamContext.bestPerformingTeam.team_name}</span>
                  <span className="text-sm">({multiTeamContext.bestPerformingTeam.win_rate.toFixed(1)}% win rate)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Comparison Analytics - Show if user has multiple teams */}
        {multiTeamContext?.hasMultipleTeams && teamStats.length > 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Team Comparison Analytics
            </h3>

            {/* Win Rate Comparison Chart */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Win Rate Comparison</h4>
              <div className="space-y-4">
                {teamStats
                  .sort((a, b) => b.win_rate - a.win_rate)
                  .map((team, index) => (
                    <div key={team.team_id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-32">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.team_color || '#6B7280' }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {team.team_name}
                        </span>
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(team.win_rate, 5)}%`,
                            backgroundColor: index === 0 ? '#10B981' : team.team_color || '#6B7280'
                          }}
                        ></div>
                        <span className="absolute right-2 top-0 h-full flex items-center text-xs font-bold text-gray-800 dark:text-gray-200">
                          {team.win_rate.toFixed(1)}%
                        </span>
                      </div>
                      {index === 0 && (
                        <Trophy className="w-4 h-4 text-yellow-500" title="Best Performing Team" />
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Create Match Modal */}
        <CreateMatchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userTeams={userTeamsForModal}
          availableTeams={[]}
          onMatchCreated={() => {
            setShowCreateModal(false);
            window.location.reload(); // Reload to refresh matches
          }}
        />
      </main>
    </div>
  );
}
