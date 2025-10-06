/**
 * Team Stats Overview Component
 * 
 * Comprehensive team statistics display including:
 * - Win/loss/draw records
 * - Goal statistics and form
 * - League position and trends
 * - Performance metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Shield,
  Activity,
  Calendar,
  Award,
  Users,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winPercentage: number;
  leaguePosition: number | null;
  totalTeamsInLeague: number | null;
  form: ('W' | 'D' | 'L')[];
  averageGoalsPerGame: number;
  averageConcededPerGame: number;
  recentMatches: Array<{
    id: string;
    date: string;
    opponent: string;
    isHome: boolean;
    score: { team: number; opponent: number };
    result: 'win' | 'loss' | 'draw';
    venue: string;
  }>;
  upcomingMatches: Array<{
    id: string;
    date: string;
    opponent: string;
    isHome: boolean;
    venue: string;
  }>;
}

interface TeamStatsOverviewProps {
  teamId: string;
  teamName?: string;
}

export const TeamStatsOverview: React.FC<TeamStatsOverviewProps> = ({ 
  teamId, 
  teamName = 'Team' 
}) => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamStats();
  }, [teamId]);

  const loadTeamStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teams/${teamId}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to load team statistics');
      }
      
      const data = await response.json();
      setStats(data.data);
      console.log('✅ Team Stats Overview - Loaded statistics:', data.data);
    } catch (err) {
      console.error('❌ Team Stats Overview - Error loading stats:', err);
      setError('Failed to load team statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormBadgeColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'D': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'L': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center min-h-32">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading team statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Statistics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Team statistics are not available at this time.'}
          </p>
          <button 
            onClick={loadTeamStats}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-500">Wins</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.wins}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.totalMatches > 0 ? `${stats.winPercentage}% win rate` : 'No matches yet'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Goals</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.goalsFor}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.averageGoalsPerGame.toFixed(1)} per game
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500">Defense</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.goalsAgainst}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.averageConcededPerGame.toFixed(1)} conceded
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">Position</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.leaguePosition || '-'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.totalTeamsInLeague ? `of ${stats.totalTeamsInLeague} teams` : 'No league'}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
          </div>

          <div className="space-y-4">
            {/* Record */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Record</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.wins}W - {stats.draws}D - {stats.losses}L
              </span>
            </div>

            {/* Points */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Points</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.points}
              </span>
            </div>

            {/* Goal Difference */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Goal Difference</span>
              <span className={`font-medium ${
                stats.goalDifference > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : stats.goalDifference < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
              </span>
            </div>

            {/* Form */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 dark:text-gray-400">Recent Form</span>
              <div className="flex gap-1">
                {stats.form.length > 0 ? stats.form.map((result, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-xs font-medium ${getFormBadgeColor(result)}`}
                  >
                    {result}
                  </span>
                )) : (
                  <span className="text-gray-500 text-sm">No recent matches</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* League Standing */}
        {stats.leaguePosition && stats.totalTeamsInLeague && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">League Position</h3>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                #{stats.leaguePosition}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                out of {stats.totalTeamsInLeague} teams
              </div>
            </div>

            {/* Progress bar showing position */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Bottom</span>
                <span>Top</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ 
                    width: `${((stats.totalTeamsInLeague - stats.leaguePosition + 1) / stats.totalTeamsInLeague) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Position context */}
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                stats.leaguePosition <= 3 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : stats.leaguePosition <= Math.ceil(stats.totalTeamsInLeague / 2)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  : stats.leaguePosition >= stats.totalTeamsInLeague - 2
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              }`}>
                {stats.leaguePosition <= 3 && (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Top 3 Position
                  </>
                )}
                {stats.leaguePosition > 3 && stats.leaguePosition <= Math.ceil(stats.totalTeamsInLeague / 2) && (
                  <>
                    <Activity className="w-4 h-4" />
                    Mid Table
                  </>
                )}
                {stats.leaguePosition > Math.ceil(stats.totalTeamsInLeague / 2) && stats.leaguePosition < stats.totalTeamsInLeague - 2 && (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    Lower Half
                  </>
                )}
                {stats.leaguePosition >= stats.totalTeamsInLeague - 2 && (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    Relegation Zone
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* If no league position, show general stats */}
        {(!stats.leaguePosition || !stats.totalTeamsInLeague) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Season Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.totalMatches}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total Matches
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.winPercentage}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Win Rate
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.averageGoalsPerGame.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Goals/Game
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.averageConcededPerGame.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Conceded/Game
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};