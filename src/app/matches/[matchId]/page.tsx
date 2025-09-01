/**
 * Individual Match Page
 * 
 * Dynamic page that shows different states based on match status:
 * - Scheduled: Pre-match state with player selection
 * - Live: Live scoring interface
 * - Completed: Post-match results and statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MatchData {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    color: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    color: string;
    score: number;
  };
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  matchDate: string;
  venue: string;
  duration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MatchParticipants {
  homeTeam: {
    id: string;
    name: string;
    team_color: string;
    participants: Array<{
      id: string;
      userId: string;
      position: string;
      jerseyNumber: number;
      isStarter: boolean;
      isCaptain: boolean;
      selectedAt: string;
      player: {
        id: string;
        displayName: string;
        fullName: string;
        avatarUrl?: string;
        preferredPosition?: string;
      };
    }>;
  };
  awayTeam: {
    id: string;
    name: string;
    team_color: string;
    participants: Array<{
      id: string;
      userId: string;
      position: string;
      jerseyNumber: number;
      isStarter: boolean;
      isCaptain: boolean;
      selectedAt: string;
      player: {
        id: string;
        displayName: string;
        fullName: string;
        avatarUrl?: string;
        preferredPosition?: string;
      };
    }>;
  };
}

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = React.use(params);
  const { user, session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [participants, setParticipants] = useState<MatchParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Load match data
  useEffect(() => {
    if (user && session?.access_token) {
      loadMatchData();
      loadParticipants();
    }
  }, [user, session?.access_token, resolvedParams.matchId]);

  const loadMatchData = async () => {
    try {
      console.log('🔍 Loading match data:', resolvedParams.matchId);

      // For now, use hardcoded data for our test match
      if (resolvedParams.matchId === '11111111-2222-3333-4444-555555555555') {
        console.log('✅ Using hardcoded match data for test match');
        setMatchData({
          id: '11111111-2222-3333-4444-555555555555',
          homeTeam: { id: '39a9f0fb-517b-4f34-934e-9a280d206989', name: 'playerTeam', color: '#3B82F6' },
          awayTeam: { id: '550e8400-e29b-41d4-a716-446655440999', name: 'adminTeam', color: '#DC2626' },
          status: 'scheduled',
          matchDate: '2025-09-08T15:00:00Z',
          venue: 'Test Stadium',
          homeScore: 0,
          awayScore: 0
        });
        return;
      }

      const response = await fetch(`/api/matches/${resolvedParams.matchId}/score`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Match not found');
        }
        throw new Error('Failed to load match data');
      }

      const result = await response.json();
      setMatchData(result.data);

    } catch (err) {
      console.error('Error loading match data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match');
    }
  };

  const loadParticipants = async () => {
    try {
      console.log('👥 Loading participants:', resolvedParams.matchId);

      // For now, use hardcoded participants data for our test match
      if (resolvedParams.matchId === '11111111-2222-3333-4444-555555555555') {
        console.log('✅ Using hardcoded participants data for test match');
        setParticipants({
          homeTeam: {
            id: '39a9f0fb-517b-4f34-934e-9a280d206989',
            name: 'playerTeam',
            team_color: '#3B82F6',
            participants: []
          },
          awayTeam: {
            id: '550e8400-e29b-41d4-a716-446655440999', 
            name: 'adminTeam',
            team_color: '#DC2626',
            participants: []
          }
        });
        // Set user's team (assuming they're captain of playerTeam)
        setUserTeamId('39a9f0fb-517b-4f34-934e-9a280d206989');
        return;
      }

      const response = await fetch(`/api/matches/${resolvedParams.matchId}/participants`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        // Participants might not exist yet for scheduled matches
        if (response.status === 404 || response.status === 403) {
          console.log('No participants found yet or access denied');
          return;
        }
        throw new Error('Failed to load participants');
      }

      const result = await response.json();
      setParticipants(result.data);

      // Determine user's team
      const homeParticipant = result.data.homeTeam.participants.find((p: any) => p.userId === user?.id);
      const awayParticipant = result.data.awayTeam.participants.find((p: any) => p.userId === user?.id);
      
      if (homeParticipant) {
        setUserTeamId(result.data.homeTeam.id);
      } else if (awayParticipant) {
        setUserTeamId(result.data.awayTeam.id);
      }

    } catch (err) {
      console.error('Error loading participants:', err);
      // Don't set error for participants as they might not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      live: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 animate-pulse',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    };

    const labels = {
      scheduled: 'Scheduled',
      live: 'Live',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-400">Loading match...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Match
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No access (user not authenticated)
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // No match data
  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Match Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The requested match could not be found.
            </p>
            <button
              onClick={() => router.push('/matches')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View All Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Match Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getStatusBadge(matchData.status)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Match ID: {matchData.id.substring(0, 8)}
              </span>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between mb-6">
            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: matchData.homeTeam.color }}
              >
                {matchData.homeTeam.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {matchData.homeTeam.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Home</p>
              </div>
            </div>

            {/* Score */}
            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                {matchData.status === 'completed' || matchData.status === 'live'
                  ? `${matchData.homeTeam.score} - ${matchData.awayTeam.score}`
                  : 'vs'
                }
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {matchData.awayTeam.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Away</p>
              </div>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: matchData.awayTeam.color }}
              >
                {matchData.awayTeam.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(matchData.matchDate)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatTime(matchData.matchDate)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {matchData.venue || 'TBD'}
            </div>
          </div>
        </div>

        {/* Match State Content */}
        {matchData.status === 'scheduled' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pre-Match: Player Selection
            </h3>
            
            {participants ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Participants */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: participants.homeTeam.team_color }}
                    ></div>
                    {participants.homeTeam.name} ({participants.homeTeam.participants.length})
                  </h4>
                  
                  {participants.homeTeam.participants.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic">No players selected yet</p>
                  ) : (
                    <div className="space-y-2">
                      {participants.homeTeam.participants.map(participant => (
                        <div 
                          key={participant.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              #{participant.jerseyNumber || '?'}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {participant.player.displayName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {participant.position || 'No position'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {participant.isStarter && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs rounded">
                                Starter
                              </span>
                            )}
                            {participant.isCaptain && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs rounded">
                                Captain
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Away Team Participants */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: participants.awayTeam.team_color }}
                    ></div>
                    {participants.awayTeam.name} ({participants.awayTeam.participants.length})
                  </h4>
                  
                  {participants.awayTeam.participants.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic">No players selected yet</p>
                  ) : (
                    <div className="space-y-2">
                      {participants.awayTeam.participants.map(participant => (
                        <div 
                          key={participant.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              #{participant.jerseyNumber || '?'}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {participant.player.displayName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {participant.position || 'No position'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {participant.isStarter && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs rounded">
                                Starter
                              </span>
                            )}
                            {participant.isCaptain && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs rounded">
                                Captain
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Player Selection Pending
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Team captains need to select players for this match
                </p>
              </div>
            )}
          </div>
        )}

        {matchData.status === 'completed' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Post-Match: Results & Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Final Score</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {matchData.homeTeam.score} - {matchData.awayTeam.score}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Duration</h4>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {matchData.duration || 90} minutes
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Winner</h4>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {matchData.homeTeam.score > matchData.awayTeam.score 
                    ? matchData.homeTeam.name
                    : matchData.awayTeam.score > matchData.homeTeam.score
                    ? matchData.awayTeam.name
                    : 'Draw'
                  }
                </p>
              </div>
            </div>

            {matchData.notes && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Match Notes</h4>
                <p className="text-gray-700 dark:text-gray-300">{matchData.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}