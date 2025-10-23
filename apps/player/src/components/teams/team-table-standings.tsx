/**
 * Team Table Standings Component
 *
 * Displays league standings with:
 * - Current league table with team highlighted
 * - Position, points, form
 * - Visual indicators for promotion/relegation zones
 * - Card-based design
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Loader2,
  AlertCircle,
  Award,
  Target
} from 'lucide-react';

interface Standing {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  isCurrentTeam?: boolean;
}

interface LeagueInfo {
  id: string;
  name: string;
  season: number;
  totalTeams: number;
}

interface TableData {
  league: LeagueInfo;
  standings: Standing[];
  lastUpdated: string;
}

interface TeamTableStandingsProps {
  teamId: string;
  teamName?: string;
}

export const TeamTableStandings: React.FC<TeamTableStandingsProps> = ({
  teamId,
  teamName = 'Team'
}) => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTableData();
  }, [teamId]);

  const loadTableData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}/table`);

      if (!response.ok) {
        throw new Error('Failed to load league table');
      }

      const data = await response.json();
      setTableData(data.data);
      console.log('✅ Team Table Standings - Loaded table data:', data.data);
    } catch (err) {
      console.error('❌ Team Table Standings - Error loading table:', err);
      setError('Failed to load league table');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionColor = (position: number, totalTeams: number): string => {
    if (position <= 3) {
      return 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500';
    } else if (position >= totalTeams - 2) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
    } else if (position <= Math.ceil(totalTeams / 2)) {
      return 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500';
    }
    return '';
  };

  const getPositionIcon = (position: number, totalTeams: number) => {
    if (position <= 3) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (position >= totalTeams - 2) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getFormBadgeColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading league table...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tableData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No League Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'This team is not currently participating in a league.'}
          </p>
          <button
            onClick={loadTableData}
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
      {/* League Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{tableData.league.name}</h2>
              <p className="text-blue-100">Season {tableData.league.season}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{tableData.standings.length}</div>
            <div className="text-sm text-blue-100">Teams</div>
          </div>
        </div>
      </div>

      {/* League Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              League Standings
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Top 3</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Bottom 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/20 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Team</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">GD</div>
          <div className="col-span-1 text-center">Pts</div>
          <div className="col-span-1">Form</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tableData.standings.map((standing, index) => (
            <div
              key={standing.teamId}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20 ${
                standing.isCurrentTeam
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 font-semibold'
                  : getPositionColor(standing.position, tableData.league.totalTeams)
              }`}
            >
              {/* Position */}
              <div className="col-span-1">
                <div className="flex items-center gap-2">
                  {getPositionIcon(standing.position, tableData.league.totalTeams)}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {standing.position}
                  </span>
                </div>
              </div>

              {/* Team Name */}
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {standing.teamName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-gray-900 dark:text-white truncate">
                    {standing.teamName}
                    {standing.isCurrentTeam && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Stats - Hidden on mobile */}
              <div className="hidden md:block col-span-1 text-center text-gray-600 dark:text-gray-400">
                {standing.played}
              </div>
              <div className="hidden md:block col-span-1 text-center text-gray-600 dark:text-gray-400">
                {standing.wins}
              </div>
              <div className="hidden md:block col-span-1 text-center text-gray-600 dark:text-gray-400">
                {standing.draws}
              </div>
              <div className="hidden md:block col-span-1 text-center text-gray-600 dark:text-gray-400">
                {standing.losses}
              </div>
              <div className="hidden md:block col-span-1 text-center">
                <span className={`font-medium ${
                  standing.goalDifference > 0
                    ? 'text-green-600 dark:text-green-400'
                    : standing.goalDifference < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                </span>
              </div>

              {/* Points - Always visible */}
              <div className="col-span-1 text-center">
                <span className="font-bold text-gray-900 dark:text-white">
                  {standing.points}
                </span>
              </div>

              {/* Form */}
              <div className="col-span-6 md:col-span-1">
                <div className="flex gap-1">
                  {standing.form.slice(0, 5).map((result, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-xs font-bold ${getFormBadgeColor(result)}`}
                      title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap gap-4">
              <div><span className="font-semibold">P:</span> Played</div>
              <div><span className="font-semibold">W:</span> Won</div>
              <div><span className="font-semibold">D:</span> Draw</div>
              <div><span className="font-semibold">L:</span> Lost</div>
              <div><span className="font-semibold">GD:</span> Goal Difference</div>
              <div><span className="font-semibold">Pts:</span> Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tableData.standings.filter(s => s.isCurrentTeam).map(standing => (
          <React.Fragment key={standing.teamId}>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Position</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                #{standing.position}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                of {tableData.league.totalTeams} teams
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Points</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {standing.points}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {standing.played} matches played
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Goal Diff</h4>
              </div>
              <div className={`text-3xl font-bold ${
                standing.goalDifference > 0
                  ? 'text-green-600 dark:text-green-400'
                  : standing.goalDifference < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {standing.goalsFor} scored, {standing.goalsAgainst} conceded
              </p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
