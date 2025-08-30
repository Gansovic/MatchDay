/**
 * Matches Page
 * 
 * Central hub for all match-related functionality including:
 * - Match scheduling and management
 * - Viewing upcoming and past matches
 * - League and team-specific match views
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/dev-auth-provider';
import { MatchScheduler } from '@/components/matches/match-scheduler';
import type { Team } from '@/components/matches/match-scheduler';

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);
  const [isTeamCaptain, setIsTeamCaptain] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserTeams();
    }
  }, [user]);

  const loadUserTeams = async () => {
    try {
      // Mock user teams data for development
      const mockUserTeams: Team[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440200',
          name: 'Thunder Eagles',
          team_color: '#3B82F6',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1'
        },
        {
          id: 'team2',
          name: 'My New Team',
          team_color: '#10B981'
        }
      ];

      setUserTeams(mockUserTeams);
      // Mock captain status for development
      setIsTeamCaptain(true);
      setIsLeagueAdmin(false); // Could be true for specific users
    } catch (error) {
      console.error('Error loading user teams:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to view and manage matches.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <MatchScheduler
          userId={user.id}
          userTeams={userTeams}
          isLeagueAdmin={isLeagueAdmin}
          isTeamCaptain={isTeamCaptain}
          onMatchCreated={(match) => {
            console.log('Match created:', match);
          }}
          onMatchUpdated={(match) => {
            console.log('Match updated:', match);
          }}
          onMatchDeleted={(matchId) => {
            console.log('Match deleted:', matchId);
          }}
        />
      </div>
    </div>
  );
}