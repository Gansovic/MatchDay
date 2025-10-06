/**
 * Team Matches Overview Component
 * 
 * Comprehensive team matches display including:
 * - Recent match results with scores
 * - Upcoming fixtures
 * - Match statistics and form
 * - Home/away performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Home,
  Plane,
  Trophy,
  Target,
  BarChart3,
  ChevronRight,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react';

interface Match {
  id: string;
  match_number?: number;
  date: string;
  status: string;
  isHome: boolean;
  opponent: {
    id: string;
    name: string;
    logo_url: string | null;
    color: string | null;
  };
  scores: {
    team: number;
    opponent: number;
  } | null;
  result: 'win' | 'loss' | 'draw' | null;
  venue: string | null;
  matchDay: number | null;
  league: {
    id: string;
    name: string;
  };
}

interface MatchStatistics {
  total: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
  homeRecord: {
    played: number;
    wins: number;
    percentage: number;
  };
  awayRecord: {
    played: number;
    wins: number;
    percentage: number;
  };
  form: ('W' | 'D' | 'L')[];
}

interface MatchData {
  recent: Match[];
  upcoming: Match[];
  statistics: MatchStatistics;
}

interface TeamMatchesOverviewProps {
  teamId: string;
  teamName?: string;
}

export const TeamMatchesOverview: React.FC<TeamMatchesOverviewProps> = ({ 
  teamId, 
  teamName = 'Team' 
}) => {
  const router = useRouter();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'upcoming' | 'stats'>('recent');

  useEffect(() => {
    loadMatchData();
  }, [teamId]);

  const loadMatchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teams/${teamId}/matches?limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load team matches');
      }
      
      const data = await response.json();
      setMatchData(data.data);
      console.log('✅ Team Matches Overview - Loaded match data:', data.data);
    } catch (err) {
      console.error('❌ Team Matches Overview - Error loading matches:', err);
      setError('Failed to load team matches');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getResultBadge = (result: 'win' | 'loss' | 'draw') => {
    switch (result) {
      case 'win': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'loss': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'draw': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getFormBadgeColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'D': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'L': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const handleMatchClick = (match: Match) => {
    // Use match_number for simplified URL if available, otherwise use UUID
    const matchIdentifier = match.match_number ? match.match_number.toString() : match.id;
    router.push(`/matches/${matchIdentifier}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center min-h-32">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading team matches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Matches
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Team matches are not available at this time.'}
          </p>
          <button 
            onClick={loadMatchData}
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
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recent'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Recent Results ({matchData.recent.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fixtures ({matchData.upcoming.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'recent' && (
            <div className="space-y-4">
              {matchData.recent.length > 0 ? (
                <>
                  {matchData.recent.map((match) => {
                    const dateInfo = formatDate(match.date);
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => handleMatchClick(match)}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {/* Result Badge */}
                          {match.result && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getResultBadge(match.result)}`}>
                              {match.result.toUpperCase()}
                            </div>
                          )}
                          
                          {/* Match Info */}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              vs {match.opponent.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <span>{dateInfo.date}</span>
                              {match.isHome ? (
                                <span className="flex items-center gap-1">
                                  <Home className="w-3 h-3" />
                                  Home
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Plane className="w-3 h-3" />
                                  Away
                                </span>
                              )}
                              {match.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score and Navigation */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {match.scores && (
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {match.scores.team} - {match.scores.opponent}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {match.league?.name || 'Friendly Match'}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No recent matches found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {matchData.upcoming.length > 0 ? (
                <>
                  {matchData.upcoming.map((match) => {
                    const dateInfo = formatDate(match.date);
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => handleMatchClick(match)}
                        className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {/* Status Badge */}
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {match.status.toUpperCase()}
                          </div>
                          
                          {/* Match Info */}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              vs {match.opponent.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {dateInfo.date} at {dateInfo.time}
                              </span>
                              {match.isHome ? (
                                <span className="flex items-center gap-1">
                                  <Home className="w-3 h-3" />
                                  Home
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Plane className="w-3 h-3" />
                                  Away
                                </span>
                              )}
                              {match.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* League Info and Navigation */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {match.league?.name || 'Friendly Match'}
                            </div>
                            {match.matchDay && (
                              <div className="text-xs text-gray-500">
                                Matchday {match.matchDay}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No upcoming matches scheduled</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {matchData.statistics.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total Matches
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {matchData.statistics.wins}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Wins
                  </div>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {matchData.statistics.draws}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Draws
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {matchData.statistics.losses}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Losses
                  </div>
                </div>
              </div>

              {/* Home/Away Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Home Record</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {matchData.statistics.homeRecord.wins}/{matchData.statistics.homeRecord.played}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {matchData.statistics.homeRecord.percentage}% win rate
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Away Record</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {matchData.statistics.awayRecord.wins}/{matchData.statistics.awayRecord.played}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {matchData.statistics.awayRecord.percentage}% win rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Form */}
              {matchData.statistics.form.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Form</h4>
                  <div className="flex justify-center gap-2">
                    {matchData.statistics.form.map((result, index) => (
                      <span
                        key={index}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getFormBadgeColor(result)}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Last {matchData.statistics.form.length} matches (oldest to newest)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};