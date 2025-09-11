/**
 * Completed Season Dashboard
 * 
 * Shows historical data for completed seasons:
 * - Final standings with season champion
 * - Match results archive
 * - Season statistics and awards
 * - Season summary and highlights
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Trophy,
  Calendar,
  Target,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import SeasonDashboardLayout from '@/components/leagues/dashboards/SeasonDashboardLayout';
import { LeagueStandings, Match, Team } from '@/components/leagues/league-standings';

interface LeagueMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  status: 'completed' | 'upcoming';
  round?: number;
}


interface LoadingStates {
  matches: boolean;
  teams: boolean;
}

interface ErrorStates {
  matches: string | null;
  teams: string | null;
}

export default function CompletedSeasonDashboard() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'info'>('standings');
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [standingsMatches, setStandingsMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    matches: true,
    teams: true
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    matches: null,
    teams: null
  });

  // Fetch season matches
  const fetchSeasonMatches = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, matches: true }));
      setErrors(prev => ({ ...prev, matches: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const matchesUrl = `${baseUrl}/api/leagues/${leagueId}/matches?seasonId=${seasonId}`;
      
      const response = await fetch(matchesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch matches');
      }
      
      // Transform matches to expected format for display
      const transformedMatches: LeagueMatch[] = (apiResult.data || []).map((match: any) => ({
        id: match.id,
        homeTeam: match.home_team_name || 'Unknown Team',
        awayTeam: match.away_team_name || 'Unknown Team',
        date: match.match_date,
        venue: match.venue || 'TBD',
        homeScore: match.home_score ?? undefined,
        awayScore: match.away_score ?? undefined,
        status: match.status === 'completed' ? 'completed' : 'upcoming',
        round: match.match_day || undefined
      }));

      // Transform matches to format expected by LeagueStandings component
      const standingsFormatMatches: Match[] = (apiResult.data || []).map((match: any) => ({
        id: match.id,
        league_id: leagueId,
        season_id: seasonId,
        home_team_id: match.home_team_id,
        home_team_name: match.home_team_name || 'Unknown Team',
        away_team_id: match.away_team_id,
        away_team_name: match.away_team_name || 'Unknown Team',
        home_score: match.home_score ?? undefined,
        away_score: match.away_score ?? undefined,
        status: match.status === 'completed' ? 'completed' : match.status,
        match_date: match.match_date,
        venue: match.venue || 'TBD',
        created_at: match.created_at,
        updated_at: match.updated_at
      }));
      
      setMatches(transformedMatches);
      setStandingsMatches(standingsFormatMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setErrors(prev => ({ ...prev, matches: 'Failed to load matches' }));
    } finally {
      setLoading(prev => ({ ...prev, matches: false }));
    }
  }, [leagueId, seasonId]);

  // Fetch season teams
  const fetchSeasonTeams = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, teams: true }));
      setErrors(prev => ({ ...prev, teams: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const teamsUrl = `${baseUrl}/api/leagues/${leagueId}/teams`;
      
      const response = await fetch(teamsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Teams API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch teams');
      }
      
      // Transform teams to format expected by LeagueStandings component
      const standingsFormatTeams: Team[] = (apiResult.data || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        team_color: team.team_color,
        league_id: leagueId
      }));
      
      setTeams(standingsFormatTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setErrors(prev => ({ ...prev, teams: 'Failed to load teams' }));
    } finally {
      setLoading(prev => ({ ...prev, teams: false }));
    }
  }, [leagueId]);

  // Initial data load
  useEffect(() => {
    fetchSeasonMatches();
    fetchSeasonTeams();
  }, [fetchSeasonMatches, fetchSeasonTeams]);

  // Helper function to format date consistently
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  // Derived data
  const completedMatches = matches.filter(m => m.status === 'completed');

  const availableTabs = ['standings', 'matches', 'stats', 'info'];

  const renderContent = () => {
    switch (activeTab) {
      case 'standings':
        return (
          <div>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Season Complete</h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Final standings and championship results
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <LeagueStandings 
              leagueId={leagueId}
              currentSeasonId={seasonId}
              matches={standingsMatches}
              teams={teams}
              promotionSpots={3}
              relegationSpots={2}
              showFinalRankings={true}
            />
          </div>
        );

      case 'matches':
        return (
          <div className="space-y-8">
            {loading.matches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading match results...</span>
              </div>
            ) : errors.matches ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">{errors.matches}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Match Results Archive
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {completedMatches.length} matches completed
                    </span>
                    <button className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {completedMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No completed matches available</p>
                    </div>
                  ) : (
                    completedMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center gap-4">
                          {match.round && (
                            <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              R{match.round}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {match.homeTeam} vs {match.awayTeam}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                              <span>{formatDate(match.date)}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {match.venue}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {match.homeScore !== undefined && match.awayScore !== undefined ? (
                            <>
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {match.homeScore} - {match.awayScore}
                              </div>
                              <div className="text-xs text-gray-500">Final</div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">No Score</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'stats':
        const totalMatches = completedMatches.length;
        const totalGoals = completedMatches.reduce((sum, match) => 
          sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0
        );
        const averageGoalsPerGame = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0.0';
        const totalTeams = teams.length;
        const matchesWithGoals = completedMatches.filter(m => 
          (m.homeScore ?? 0) > 0 || (m.awayScore ?? 0) > 0
        ).length;
        const cleanSheets = completedMatches.filter(m => 
          (m.homeScore ?? 0) === 0 || (m.awayScore ?? 0) === 0
        ).length;
        
        return (
          <div className="space-y-8">
            {/* Season Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMatches}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Completed</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTeams}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Participated</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalGoals}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">{averageGoalsPerGame} per match</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{cleanSheets}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Clean Sheets</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Shutout victories</div>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Match Results Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Match Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Matches Played</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalMatches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Matches with Goals</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{matchesWithGoals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Average Goals per Match</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{averageGoalsPerGame}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Clean Sheets</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{cleanSheets}</span>
                  </div>
                </div>
              </div>

              {/* Season Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Season Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Teams</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalTeams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Goals</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalGoals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Season Complete Message */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
              <Trophy className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Season Statistics Complete
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                All matches have been played and final statistics have been calculated. 
                View the standings tab for final team rankings and the matches tab for complete results.
              </p>
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="space-y-8">
            {/* Season Champion Banner */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-8 text-center">
              <Trophy className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                Season Champions
              </h2>
              <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                Congratulations to the winners of this completed season!
              </p>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                View the final standings to see complete results
              </div>
            </div>


            {/* Archive Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Season Archive
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This season has been completed and archived. You can still view all historical data, standings, and statistics.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Season Data
                </button>
                <button 
                  onClick={() => setActiveTab('standings')}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  View Final Standings
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  View Season Stats
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SeasonDashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      availableTabs={availableTabs}
      title="Season Complete - Historical View"
    >
      {renderContent()}
    </SeasonDashboardLayout>
  );
}