/**
 * Dashboard Page for MatchDay
 * 
 * Protected route that shows user dashboard after authentication.
 * Demonstrates the auth system working correctly.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { 
  Trophy, 
  Users, 
  Target,
  Activity,
  Star,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  useUserStats, 
  useUserTeams, 
  useRecentActivity, 
  useUserPerformance 
} from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase/client';
// import { MyJoinRequests } from '@/components/seasons/MyJoinRequests';

interface UserProfile {
  display_name?: string;
  preferred_position?: string;
  location?: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
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
  
  // Fetch dashboard data
  const { stats, teamStats, multiTeamContext, loading: statsLoading } = useUserStats(user?.id || null);
  const { teams, loading: teamsLoading } = useUserTeams(user?.id || null);
  const { activity, loading: activityLoading } = useRecentActivity(user?.id || null, 5);
  const { performance } = useUserPerformance(user?.id || null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 card-hover">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome back, {userProfile?.display_name || 'Player'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ready to compete like a professional? Your league awaits.
              </p>
              {userProfile?.preferred_position && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Position: {userProfile.preferred_position}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Matches Played</p>
                {statsLoading ? (
                  <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.matchesPlayed || 0}
                  </p>
                )}
              </div>
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Teams Joined</p>
                {statsLoading ? (
                  <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.teamsJoined || 0}
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Goals Scored</p>
                {statsLoading ? (
                  <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.goalsScored || 0}
                  </p>
                )}
              </div>
              <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Win Rate</p>
                {statsLoading ? (
                  <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.winRate ? `${stats.winRate}%` : '-'}
                  </p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        {performance && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 card-hover">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {performance.overallRating}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {stats?.assists || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Assists</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {stats?.leaguesParticipated || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Leagues</div>
              </div>
            </div>
            {performance.strengths.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {performance.strengths.slice(0, 3).map((strength, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Performance Breakdown - Show if user has multiple teams */}
        {multiTeamContext?.hasMultipleTeams && teamStats.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 card-hover">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 card-hover">
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

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Team Stats Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Team Statistics Overview</h4>
                <div className="space-y-3">
                  {teamStats.map((team) => (
                    <div key={team.team_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: team.team_color || '#6B7280' }}
                          ></div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {team.team_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {team.league_name}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-green-600 dark:text-green-400 font-bold">{team.wins}W</div>
                          <div className="text-gray-500">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-600 dark:text-yellow-400 font-bold">{team.draws}D</div>
                          <div className="text-gray-500">Draws</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-600 dark:text-red-400 font-bold">{team.losses}L</div>
                          <div className="text-gray-500">Losses</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Insights */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance Insights</h4>
                <div className="space-y-4">
                  {/* Best performing team highlight */}
                  {multiTeamContext.bestPerformingTeam && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                          Top Performing Team
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">
                        {multiTeamContext.bestPerformingTeam.team_name}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {multiTeamContext.bestPerformingTeam.win_rate.toFixed(1)}% win rate • {multiTeamContext.bestPerformingTeam.wins}W-{multiTeamContext.bestPerformingTeam.draws}D-{multiTeamContext.bestPerformingTeam.losses}L
                      </div>
                    </div>
                  )}

                  {/* Team comparison metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {teamStats.reduce((sum, team) => sum + team.games_played, 0)}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Total Games</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        {teamStats.reduce((sum, team) => sum + team.team_points, 0)}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Total Points</div>
                    </div>
                  </div>

                  {/* Performance trends */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Average Team Performance
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Win Rate: {(teamStats.reduce((sum, team) => sum + team.win_rate, 0) / teamStats.length).toFixed(1)}%</span>
                      <span>Avg Points: {(teamStats.reduce((sum, team) => sum + team.team_points, 0) / teamStats.length).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Season Join Requests */}
        <div className="mb-8">
          {/* <MyJoinRequests /> */}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Recent Activity
              </h3>
              {activityLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {item.type === 'team_joined' && <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        {item.type === 'match' && <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />}
                        {item.type === 'goal_scored' && <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        {item.type === 'league_joined' && <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString()}
                          {item.metadata?.teamName && (
                            <>
                              <span>•</span>
                              <span>{item.metadata.teamName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No recent activity yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Join a team or league to start seeing your activity here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Team Memberships */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                My Teams
              </h3>
              {teamsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : teams.length > 0 ? (
                <div className="space-y-4">
                  {teams.map((membership) => {
                    // Find corresponding team stats
                    const teamStat = teamStats.find(ts => ts.team_id === membership.team.id);
                    
                    return (
                      <div key={membership.team.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {membership.team.name}
                              {membership.role === 'captain' && (
                                <UserCheck className="w-4 h-4 text-yellow-500" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {membership.team.league?.name || 'No League'}
                            </p>
                            {membership.position && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {membership.position}
                                {membership.jerseyNumber && ` #${membership.jerseyNumber}`}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Enhanced stats display with team performance */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {membership.stats ? (
                            <>
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <div className="font-semibold text-blue-600 dark:text-blue-400">{membership.stats.goals}</div>
                                <div className="text-gray-600 dark:text-gray-400">Goals</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="font-semibold text-green-600 dark:text-green-400">{membership.stats.assists}</div>
                                <div className="text-gray-600 dark:text-gray-400">Assists</div>
                              </div>
                              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <div className="font-semibold text-purple-600 dark:text-purple-400">{membership.stats.matches}</div>
                                <div className="text-gray-600 dark:text-gray-400">Matches</div>
                              </div>
                            </>
                          ) : teamStat ? (
                            <>
                              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                <div className="font-semibold text-orange-600 dark:text-orange-400">{teamStat.win_rate.toFixed(0)}%</div>
                                <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="font-semibold text-green-600 dark:text-green-400">{teamStat.wins}</div>
                                <div className="text-gray-600 dark:text-gray-400">Wins</div>
                              </div>
                              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <div className="font-semibold text-purple-600 dark:text-purple-400">{teamStat.games_played}</div>
                                <div className="text-gray-600 dark:text-gray-400">Games</div>
                              </div>
                            </>
                          ) : (
                            <div className="col-span-3 text-center text-gray-500 dark:text-gray-400 py-2">
                              No stats available
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => router.push('/teams')}
                    className="w-full mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                  >
                    View All Teams
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No teams yet</p>
                  <button
                    onClick={() => router.push('/teams')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Find Teams
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className={`grid grid-cols-1 gap-8 ${(teams.length === 0 && activity.length === 0) ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl mx-auto'}`}>
          {/* Get Started - Only show for new users */}
          {teams.length === 0 && activity.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Get Started
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Complete Your Profile</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add your position, bio, and photo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Browse Leagues</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find leagues in your area</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Join a Team</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Start competing professionally</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Display Name</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {userProfile?.display_name || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Position</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {userProfile?.preferred_position || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 dark:text-gray-400">Location</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {userProfile?.location || 'Not set'}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/profile')}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}