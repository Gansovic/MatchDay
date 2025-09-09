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
  Shield,
  Star,
  Award,
  MapPin,
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

  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'summary'>('standings');
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
  const totalGoals = completedMatches.reduce((total, match) => 
    total + (match.homeScore || 0) + (match.awayScore || 0), 0);

  const availableTabs = ['standings', 'matches', 'stats', 'summary'];

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
        return (
          <div className="space-y-8">
            {/* Season Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {completedMatches.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {totalGoals}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Goals Scored</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Goals/Match</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Season Complete</div>
              </div>
            </div>

            {/* Season Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Season Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Completed Matches</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{completedMatches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Goals</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalGoals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Average Goals per Match</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Season Status</span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Highest Scoring Match</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {completedMatches.length > 0 
                        ? Math.max(...completedMatches.map(m => (m.homeScore || 0) + (m.awayScore || 0))) + ' goals'
                        : 'No data'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Match Data</span>
                    <span className="font-semibold text-gray-900 dark:text-white">Available in Archive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
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

            {/* Season Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Season Highlights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Matches Played</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{completedMatches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Goals Scored</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalGoals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Average Goals per Match</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Season Status</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Season Records
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Highest Scoring Match</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {completedMatches.length > 0 ? 'Available in match archive' : 'No matches completed'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Most Goals in a Match</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {completedMatches.length > 0 
                        ? Math.max(...completedMatches.map(m => (m.homeScore || 0) + (m.awayScore || 0))) + ' goals'
                        : 'No data'
                      }
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Season Duration</div>
                    <div className="font-semibold text-gray-900 dark:text-white">Full Season</div>
                  </div>
                </div>
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