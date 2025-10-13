/**
 * LeagueQuickView Component
 *
 * Inline expandable view showing league details:
 * - Season information
 * - Mini standings (top 3)
 * - Upcoming fixtures
 * - Quick join form
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Users,
  Loader2,
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';

interface Season {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  max_teams?: number;
  registered_teams_count?: number;
}

interface StandingTeam {
  id: string;
  name: string;
  team_color?: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
}

interface Match {
  id: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  status: string;
}

interface LeagueQuickViewProps {
  leagueId: string;
  leagueName: string;
  onJoinClick?: (leagueId: string, seasonId: string, teamId: string) => void;
  userTeams?: {
    id: string;
    name: string;
    is_captain: boolean;
    league_id?: string;
  }[];
}

export const LeagueQuickView: React.FC<LeagueQuickViewProps> = ({
  leagueId,
  leagueName,
  onJoinClick,
  userTeams = []
}) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [topTeams, setTopTeams] = useState<StandingTeam[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Filter eligible teams (captain, not in league)
  const eligibleTeams = userTeams.filter(team => team.is_captain && !team.league_id);

  useEffect(() => {
    loadQuickViewData();
  }, [leagueId]);

  const loadQuickViewData = async () => {
    setIsLoading(true);
    try {
      // Load seasons
      const seasonsRes = await fetch(`/api/leagues/${leagueId}/seasons`);
      const seasonsData = await seasonsRes.json();

      if (seasonsData.success && seasonsData.data) {
        const openSeasons = seasonsData.data.filter((s: Season) =>
          s.status === 'registration' || s.status === 'draft'
        );
        setSeasons(openSeasons);

        // Auto-select first open season
        if (openSeasons.length > 0) {
          setSelectedSeason(openSeasons[0].id);
        }
      }

      // Load top 3 teams from standings
      const teamsRes = await fetch(`/api/leagues/${leagueId}/teams`);
      const teamsData = await teamsRes.json();

      if (teamsData.success && teamsData.data) {
        // Simplified - in real app would calculate from matches
        const teams = teamsData.data.slice(0, 3).map((team: any, index: number) => ({
          id: team.id,
          name: team.name,
          team_color: team.team_color,
          position: index + 1,
          points: 0, // Would come from standings calculation
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0
        }));
        setTopTeams(teams);
      }

      // Load upcoming matches (next 3)
      const matchesRes = await fetch(`/api/leagues/${leagueId}/matches`);
      const matchesData = await matchesRes.json();

      if (matchesData.success && matchesData.data) {
        const upcoming = matchesData.data
          .filter((m: Match) => m.status === 'scheduled')
          .sort((a: Match, b: Match) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
          .slice(0, 3);
        setUpcomingMatches(upcoming);
      }
    } catch (error) {
      console.error('Error loading quick view data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickJoin = () => {
    if (!selectedSeason || !selectedTeam) return;
    onJoinClick?.(leagueId, selectedSeason, selectedTeam);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seasons Section */}
      {seasons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Current Season
          </h4>
          <div className="space-y-2">
            {seasons.map(season => (
              <div key={season.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{season.name}</span>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    {season.status}
                  </span>
                </div>
                {season.start_date && season.end_date && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(season.start_date)} - {formatDate(season.end_date)}
                  </p>
                )}
                {season.max_teams && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {season.registered_teams_count || 0} / {season.max_teams} teams enrolled
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Teams Section */}
      {topTeams.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Current Standings (Top 3)
          </h4>
          <div className="space-y-2">
            {topTeams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">
                    #{team.position}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: team.team_color || '#6B7280' }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {team.points} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    {team.played} played
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches Section */}
      {upcomingMatches.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Upcoming Matches
          </h4>
          <div className="space-y-2">
            {upcomingMatches.map(match => (
              <div key={match.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{match.home_team_name}</span>
                  <span className="text-gray-500 mx-2">vs</span>
                  <span className="text-gray-700 dark:text-gray-300">{match.away_team_name}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(match.match_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Join Form */}
      {eligibleTeams.length > 0 && seasons.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Quick Join
          </h4>

          <div className="space-y-3">
            {/* Season Selector (if multiple) */}
            {seasons.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Select Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Team Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Select Your Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose a team...</option>
                {eligibleTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Join Button */}
            <button
              onClick={handleQuickJoin}
              disabled={!selectedSeason || !selectedTeam}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Request to Join Season
            </button>
          </div>
        </div>
      )}

      {eligibleTeams.length === 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            You need to be a captain of a team to join this league.
          </p>
        </div>
      )}
    </div>
  );
};
