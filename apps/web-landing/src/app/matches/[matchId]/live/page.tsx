/**
 * Live Match Page
 * 
 * Real-time match scoring interface for active matches.
 * Optimized for mobile/tablet use during match day.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { LiveMatchScorer, LiveMatch, MatchPlayer } from '@/components/matches/live-match-scorer';
import { ArrowLeft, Users, Settings, Share2, Loader2, AlertCircle } from 'lucide-react';

export default function LiveMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfficial, setIsOfficial] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  const loadMatch = async () => {
    setIsLoading(true);
    try {
      // Mock match data for development
      const mockPlayers: MatchPlayer[] = [
        { id: '1', name: 'John Captain', jersey_number: 10, position: 'midfielder', is_starter: true, is_captain: true },
        { id: '2', name: 'Jane Forward', jersey_number: 9, position: 'forward', is_starter: true, is_captain: false },
        { id: '3', name: 'Mike Keeper', jersey_number: 1, position: 'goalkeeper', is_starter: true, is_captain: false },
        { id: '4', name: 'Sarah Defender', jersey_number: 4, position: 'defender', is_starter: true, is_captain: false },
        { id: '5', name: 'Tom Midfielder', jersey_number: 8, position: 'midfielder', is_starter: true, is_captain: false },
        { id: '6', name: 'Lisa Winger', jersey_number: 7, position: 'forward', is_starter: false, is_captain: false },
        { id: '7', name: 'Chris Defender', jersey_number: 3, position: 'defender', is_starter: false, is_captain: false },
      ];

      const mockAwayPlayers: MatchPlayer[] = [
        { id: '8', name: 'Alex Captain', jersey_number: 10, position: 'midfielder', is_starter: true, is_captain: true },
        { id: '9', name: 'Emma Striker', jersey_number: 9, position: 'forward', is_starter: true, is_captain: false },
        { id: '10', name: 'Dave Keeper', jersey_number: 1, position: 'goalkeeper', is_starter: true, is_captain: false },
        { id: '11', name: 'Rachel Back', jersey_number: 2, position: 'defender', is_starter: true, is_captain: false },
        { id: '12', name: 'Ben Mid', jersey_number: 6, position: 'midfielder', is_starter: true, is_captain: false },
        { id: '13', name: 'Sophie Wing', jersey_number: 11, position: 'forward', is_starter: false, is_captain: false },
        { id: '14', name: 'Mark Center', jersey_number: 5, position: 'defender', is_starter: false, is_captain: false },
      ];

      const mockMatch: LiveMatch = {
        id: matchId,
        league_name: 'League1',
        home_team: {
          id: '550e8400-e29b-41d4-a716-446655440200',
          name: 'Thunder Eagles',
          color: '#3B82F6',
          score: 1,
          players: mockPlayers
        },
        away_team: {
          id: '550e8400-e29b-41d4-a716-446655440201',
          name: 'Lightning Strikers',
          color: '#EF4444',
          score: 0,
          players: mockAwayPlayers
        },
        status: 'live',
        current_session: 1,
        session_time: 23.5, // 23 minutes 30 seconds
        total_sessions: 2,
        session_duration: 45,
        venue: 'Central Stadium',
        events: [
          {
            id: '1',
            type: 'goal',
            player_id: '2',
            player_name: 'Jane Forward',
            team_id: '550e8400-e29b-41d4-a716-446655440200',
            team_name: 'Thunder Eagles',
            minute: 18,
            session: 1,
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            details: { assisted_by: 'John Captain' }
          }
        ],
        started_at: new Date(Date.now() - 23.5 * 60 * 1000).toISOString()
      };

      setMatch(mockMatch);
      
      // Mock official status - in real app, this would check user permissions
      setIsOfficial(user?.email === 'admin@matchday.com' || user?.email === 'john.doe@example.com');
      
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchUpdate = (updatedMatch: LiveMatch) => {
    setMatch(updatedMatch);
    // In real app, this would sync to the backend
    console.log('Match updated:', updatedMatch);
  };

  const handleEventAdded = (event: any) => {
    console.log('Event added:', event);
    // In real app, this would sync to the backend
  };

  const handleShare = () => {
    if (navigator.share && match) {
      navigator.share({
        title: `${match.home_team.name} vs ${match.away_team.name}`,
        text: `Live match: ${match.home_team.score}-${match.away_team.score}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Match link copied to clipboard!');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading live match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Match Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'The requested match could not be found.'}
            </p>
            <button
              onClick={() => router.push('/matches')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-1">
              {match.status === 'live' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}
              
              <h1 className="text-lg font-bold text-gray-900 dark:text-white ml-2">
                Live Match
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share match"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {isOfficial && (
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Match settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Official Status */}
        {isOfficial && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300 text-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">
                You have match control permissions - you can manage scores and events
              </span>
            </div>
          </div>
        )}

        {/* Live Match Scorer */}
        <LiveMatchScorer
          match={match}
          isOfficial={isOfficial}
          onMatchUpdate={handleMatchUpdate}
          onEventAdded={handleEventAdded}
          className="max-w-4xl mx-auto"
        />

        {/* Match Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Home Team Lineup */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: match.home_team.color }}
              ></div>
              {match.home_team.name} Lineup
            </h3>
            <div className="space-y-2">
              {match.home_team.players
                .filter(p => p.is_starter)
                .map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {player.jersey_number && (
                      <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        #{player.jersey_number}
                      </span>
                    )}
                    <span className="font-medium">{player.name}</span>
                    {player.is_captain && <span className="text-xs text-yellow-600 dark:text-yellow-400">©</span>}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto capitalize">
                      {player.position}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Away Team Lineup */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: match.away_team.color }}
              ></div>
              {match.away_team.name} Lineup
            </h3>
            <div className="space-y-2">
              {match.away_team.players
                .filter(p => p.is_starter)
                .map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {player.jersey_number && (
                      <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        #{player.jersey_number}
                      </span>
                    )}
                    <span className="font-medium">{player.name}</span>
                    {player.is_captain && <span className="text-xs text-yellow-600 dark:text-yellow-400">©</span>}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto capitalize">
                      {player.position}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Instructions for Users */}
        {!isOfficial && match.status === 'live' && (
          <div className="mt-6 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Following Live Match
              </h4>
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                You're viewing this match in read-only mode. Score and event updates will appear automatically as the match officials record them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}