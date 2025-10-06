/**
 * Player Dashboard Component
 * 
 * Central hub for player experience - designed to make amateur players feel professional
 * through comprehensive stats, achievements, and cross-league comparisons.
 * 
 * @example
 * ```typescript
 * <PlayerDashboard userId={userId} />
 * ```
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AchievementShowcase } from '@/components/features/achievement-showcase';
import { GlobalLeaderboard } from '@/components/features/global-leaderboard';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { StatsDisplay } from '@/components/ui/stats-display';
import { MatchCard } from '@/components/features/match-card';
import { PlayerService } from '@matchday/services';
import { MatchService } from '@matchday/services';
import { NumberFormatters } from '@/lib/utils/formatters';

interface PlayerDashboardProps {
  userId: string;
  className?: string;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  userId,
  className = ''
}) => {
  const { data: playerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['player-profile', userId],
    queryFn: () => PlayerService.getInstance().getPlayerProfile(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ['player-aggregated-stats', userId],
    queryFn: () => PlayerService.getInstance().getAggregatedStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: upcomingMatches } = useQuery({
    queryKey: ['player-upcoming-matches', userId],
    queryFn: () => MatchService.getInstance().getPlayerUpcomingMatches(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: recentMatches } = useQuery({
    queryKey: ['player-recent-matches', userId],
    queryFn: () => MatchService.getInstance().getPlayerRecentMatches(userId, 5),
    staleTime: 5 * 60 * 1000,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  if (!playerProfile || !playerStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load player dashboard
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {playerProfile.avatar_url ? (
              <img
                src={playerProfile.avatar_url}
                alt={playerProfile.display_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              playerProfile.display_name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{playerProfile.display_name}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <span>🏆 {playerStats.leagues_played} League{playerStats.leagues_played !== 1 ? 's' : ''}</span>
              <span>⚽ {playerStats.total_goals} Goals</span>
              <span>🅰️ {playerStats.total_assists} Assists</span>
              <span>🎯 {playerStats.avg_goals_per_game} Goals/Game</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">#{playerStats.global_rank || 'Unranked'}</div>
            <div className="text-white/90">Global Rank</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProfessionalCard
          title="Total Games"
          variant="player"
          stats={[
            { 
              label: 'Played', 
              value: NumberFormatters.formatNumber(playerStats.total_games), 
              highlight: true 
            }
          ]}
        />
        <ProfessionalCard
          title="Goal Contributions"
          variant="player"
          stats={[
            { 
              label: 'Goals + Assists', 
              value: NumberFormatters.formatNumber(playerStats.total_goals + playerStats.total_assists), 
              highlight: true 
            }
          ]}
        />
        <ProfessionalCard
          title="Performance Rating"
          variant="player"
          stats={[
            { 
              label: 'Rating', 
              value: NumberFormatters.formatRating(playerStats.performance_rating || 0), 
              highlight: true 
            }
          ]}
        />
        <ProfessionalCard
          title="Achievement Points"
          variant="player"
          stats={[
            { 
              label: 'Points', 
              value: NumberFormatters.formatPoints(playerStats.achievement_points || 0), 
              highlight: true 
            }
          ]}
        />
      </div>

      {/* Upcoming Matches */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upcoming Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.slice(0, 4).map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                variant="upcoming"
                showLeague={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {recentMatches && recentMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                variant="result"
                showLeague={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Split Layout: Achievements & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Achievements
          </h2>
          <AchievementShowcase userId={userId} compact={true} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Global Rankings
          </h2>
          <div className="space-y-4">
            <GlobalLeaderboard
              category="goals"
              timeframe="current_season"
              currentUserId={userId}
              limit={10}
            />
          </div>
        </div>
      </div>

      {/* Cross-League Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Cross-League Performance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playerStats.league_stats?.map((leagueStat) => (
            <div
              key={leagueStat.league_id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {leagueStat.league_name}
              </h3>
              <StatsDisplay
                stats={[
                  { label: 'Games', value: leagueStat.games_played },
                  { label: 'Goals', value: leagueStat.goals },
                  { label: 'Assists', value: leagueStat.assists },
                  { label: 'Avg/Game', value: (leagueStat.goals / Math.max(leagueStat.games_played, 1)).toFixed(2) }
                ]}
                variant="compact"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};