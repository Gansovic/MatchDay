'use client';

import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamStanding {
  position: number;
  team_id: string;
  team_name: string;
  team_color?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

interface StandingsTableProps {
  standings: TeamStanding[];
  highlightTeamIds?: string[];
}

export default function StandingsTable({ standings, highlightTeamIds = [] }: StandingsTableProps) {
  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 dark:text-yellow-400';
    if (position <= 3) return 'text-blue-600 dark:text-blue-400';
    if (position >= standings.length - 2) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getFormBadge = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'D':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'L':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  if (standings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Standings Available
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Standings will be calculated once matches have been played
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            League Standings
          </h3>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Team
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                P
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                W
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                D
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                L
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GF
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GA
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GD
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pts
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Form
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {standings.map((team, index) => {
              const isHighlighted = highlightTeamIds.includes(team.team_id);
              const prevPosition = index > 0 ? standings[index - 1].position : 0;

              return (
                <tr
                  key={team.team_id}
                  className={`${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } transition-colors`}
                >
                  {/* Position */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getPositionColor(team.position)}`}>
                        {team.position}
                      </span>
                      {team.position === 1 && (
                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                  </td>

                  {/* Team */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: team.team_color || '#374151' }}
                      >
                        <span className="text-white text-sm font-bold">
                          {team.team_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        isHighlighted
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {team.team_name}
                      </span>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.played}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.won}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.drawn}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.lost}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.goals_for}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {team.goals_against}
                  </td>
                  <td className={`px-4 py-4 text-center text-sm font-medium ${
                    team.goal_difference > 0
                      ? 'text-green-600 dark:text-green-400'
                      : team.goal_difference < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                    {team.points}
                  </td>

                  {/* Form */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {team.form && team.form.length > 0 ? (
                      <div className="flex gap-1">
                        {team.form.slice(-5).map((result, idx) => (
                          <span
                            key={idx}
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${getFormBadge(result)}`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <span><strong>P:</strong> Played</span>
          <span><strong>W:</strong> Won</span>
          <span><strong>D:</strong> Drawn</span>
          <span><strong>L:</strong> Lost</span>
          <span><strong>GF:</strong> Goals For</span>
          <span><strong>GA:</strong> Goals Against</span>
          <span><strong>GD:</strong> Goal Difference</span>
          <span><strong>Pts:</strong> Points</span>
        </div>
      </div>
    </div>
  );
}
