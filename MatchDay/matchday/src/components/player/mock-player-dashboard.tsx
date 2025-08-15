/**
 * Mock Player Dashboard Component
 * 
 * Professional dashboard experience using mock data to demonstrate
 * how amateur players feel like professionals on the platform.
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '@/lib/services/mock-data.service';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { StatsDisplay } from '@/components/ui/stats-display';
import { NumberFormatters } from '@/lib/utils/formatters';

interface MockPlayerDashboardProps {
  userId: string;
  className?: string;
}

const MockMatchCard: React.FC<{ match: any; variant: 'upcoming' | 'result' }> = ({ match, variant }) => {
  const isWin = variant === 'result' && match.player_team === 'home' 
    ? match.home_score > match.away_score 
    : match.away_score > match.home_score;
  
  const resultClass = variant === 'result' 
    ? isWin ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    : 'border-blue-200 bg-blue-50';

  return (
    <div className={`border-2 ${resultClass} rounded-lg p-4`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">{match.league_name}</span>
        <span className="text-xs text-gray-500">
          {new Date(match.match_date).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="font-bold text-gray-900">{match.home_team}</div>
          {variant === 'result' && (
            <div className="text-2xl font-bold text-blue-600">{match.home_score}</div>
          )}
        </div>
        
        <div className="text-center">
          <div className="text-gray-400 text-sm">vs</div>
          {variant === 'upcoming' && (
            <div className="text-xs text-gray-500">
              {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        
        <div className="text-center">
          <div className="font-bold text-gray-900">{match.away_team}</div>
          {variant === 'result' && (
            <div className="text-2xl font-bold text-blue-600">{match.away_score}</div>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <span>📍 {match.venue}</span>
      </div>
    </div>
  );
};

const MockAchievementCard: React.FC<{ achievement: any }> = ({ achievement }) => (
  <div className={`p-4 rounded-lg border-2 ${achievement.earned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
    <div className="flex items-center space-x-3">
      <div className="text-2xl">{achievement.icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
        <p className="text-sm text-gray-600">{achievement.description}</p>
        {achievement.progress && (
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(achievement.progress / achievement.max_progress) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {achievement.progress}/{achievement.max_progress}
            </div>
          </div>
        )}
      </div>
      {achievement.earned && (
        <div className="text-green-600 font-bold">✓</div>
      )}
    </div>
  </div>
);

const MockLeaderboardCard: React.FC<{ leaders: any[] }> = ({ leaders }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
      Global Goals Leaderboard
    </h3>
    <div className="space-y-3">
      {leaders.map((leader) => (
        <div 
          key={leader.rank} 
          className={`flex items-center justify-between p-3 rounded-lg ${
            leader.is_current_user ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              leader.rank <= 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-700'
            }`}>
              {leader.rank}
            </div>
            <span className={`font-medium ${leader.is_current_user ? 'text-blue-700' : 'text-gray-900'}`}>
              {leader.player_name}
            </span>
          </div>
          <span className="font-bold text-gray-900">{leader.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export const MockPlayerDashboard: React.FC<MockPlayerDashboardProps> = ({
  userId,
  className = ''
}) => {
  const mockDataService = MockDataService.getInstance();

  const { data: playerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['mock-player-profile', userId],
    queryFn: () => mockDataService.getPlayerProfile(userId),
    staleTime: 10 * 60 * 1000,
  });

  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ['mock-player-stats', userId],
    queryFn: () => mockDataService.getPlayerStats(userId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingMatches } = useQuery({
    queryKey: ['mock-upcoming-matches', userId],
    queryFn: () => mockDataService.getUpcomingMatches(userId),
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentMatches } = useQuery({
    queryKey: ['mock-recent-matches', userId],
    queryFn: () => mockDataService.getRecentMatches(userId, 3),
    staleTime: 5 * 60 * 1000,
  });

  const { data: achievements } = useQuery({
    queryKey: ['mock-achievements', userId],
    queryFn: () => mockDataService.getAchievements(userId),
    staleTime: 10 * 60 * 1000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['mock-leaderboard'],
    queryFn: () => mockDataService.getGlobalLeaderboard('goals', 6),
    staleTime: 10 * 60 * 1000,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
            {playerProfile.display_name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{playerProfile.display_name}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <span>🏆 {playerStats.leagues_played} League{playerStats.leagues_played !== 1 ? 's' : ''}</span>
              <span>⚽ {playerStats.total_goals} Goals</span>
              <span>🅰️ {playerStats.total_assists} Assists</span>
              <span>🎯 {playerStats.avg_goals_per_game} Goals/Game</span>
            </div>
            <p className="text-white/80 mt-2">{playerProfile.bio}</p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">#{playerStats.global_rank}</div>
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

      {/* Upcoming & Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Matches */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upcoming Matches
          </h2>
          {upcomingMatches && upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.slice(0, 3).map((match) => (
                <MockMatchCard
                  key={match.id}
                  match={match}
                  variant="upcoming"
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No upcoming matches</p>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Results
          </h2>
          {recentMatches && recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <MockMatchCard
                  key={match.id}
                  match={match}
                  variant="result"
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No recent matches</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Achievements
          </h2>
          {achievements && achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.slice(0, 4).map((achievement) => (
                <MockAchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No achievements yet</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Global Rankings
          </h2>
          {leaderboard ? (
            <MockLeaderboardCard leaders={leaderboard} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">Leaderboard unavailable</p>
            </div>
          )}
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
                  { label: 'Rank', value: `#${leagueStat.rank_in_league}` }
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