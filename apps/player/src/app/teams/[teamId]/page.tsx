/**
 * Team Dashboard Page
 * 
 * Individual team dashboard showing:
 * - Team header with name, logo, and key stats
 * - Recent matches and upcoming games
 * - Team roster and members
 * - Performance metrics and standings
 * - Navigation back to teams list
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  Crown,
  Target,
  Clock,
  TrendingUp,
  Trophy,
  Star,
  Edit,
  UserPlus,
  MoreVertical,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { TeamMemberManagement } from '@/components/teams/team-member-management';
import { EnhancedTeamInviteModal } from '@/components/teams/EnhancedTeamInviteModal';
import { TeamStatsOverview } from '@/components/teams/team-stats-overview';
import { TeamMatchesOverview } from '@/components/teams/team-matches-overview';
import { Database } from '@matchday/database';

interface Match {
  id: string;
  opponent: string;
  date: string;
  venue: string;
  result?: 'win' | 'loss' | 'draw';
  score?: {
    home: number;
    away: number;
  };
  isHome: boolean;
}

interface LeagueStanding {
  position: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isCurrentTeam?: boolean;
}

interface DisplayTeamMember {
  id: string;
  name: string;
  position: string;
  avatar?: string;
  isCaptain: boolean;
  isViceCaptain?: boolean;
  joinDate: string;
  gamesPlayed: number;
  goals?: number;
  assists?: number;
}

interface DisplayTeamData {
  id: string;
  name: string;
  league: string;
  leagues: Array<{
    id: string;
    name: string;
    seasons: number[];
    isCurrent: boolean;
  }>;
  logo?: string;
  color: string;
  description: string;
  founded: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  isMember: boolean;
  isUserCaptain: boolean;
  userPosition?: string;
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    goalsAgainst: number;
    position: number;
    totalTeams: number;
    points: number;
  };
  members: DisplayTeamMember[];
  recentMatches: Match[];
  upcomingMatches: Match[];
}

// League ID mapping for URL generation - using actual UUIDs from database
const getLeagueId = (leagueName: string): string => {
  const mapping: Record<string, string> = {
    'League1': '550e8400-e29b-41d4-a716-446655440001',
    'LaLiga': '550e8400-e29b-41d4-a716-446655440002',
    'Weekend Football Division': '550e8400-e29b-41d4-a716-446655440003',
    'City Championship League': '550e8400-e29b-41d4-a716-446655440004'
  };
  return mapping[leagueName] || leagueName.toLowerCase().replace(/\s+/g, '-');
};

export default function TeamDashboard() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'matches'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  
  // State for real data
  const [team, setTeam] = useState<DisplayTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and fetch real team data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real team data from API
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (!teamResponse.ok) {
          throw new Error(`Failed to fetch team data: ${teamResponse.status}`);
        }
        const teamData = await teamResponse.json();
        const apiTeam = teamData.data;

        // Fetch team members data
        const membersResponse = await fetch(`/api/teams/${teamId}/members`);
        if (!membersResponse.ok) {
          throw new Error(`Failed to fetch team members: ${membersResponse.status}`);
        }
        const membersData = await membersResponse.json();
        const apiMembers = membersData.data || [];

        // Transform team members to display format
        const displayMembers: DisplayTeamMember[] = apiMembers.map((member: any) => ({
          id: member.id,
          name: member.full_name,
          position: member.position || 'player',
          isCaptain: member.is_captain,
          isViceCaptain: false,
          joinDate: member.joined_at,
          gamesPlayed: member.stats?.matches_played || 0,
          goals: member.stats?.goals || 0,
          assists: member.stats?.assists || 0
        }));

        const displayTeam: DisplayTeamData = {
          id: apiTeam.id,
          name: apiTeam.name,
          league: apiTeam.league?.name || 'Independent',
          leagues: apiTeam.leagues || [],
          color: apiTeam.color,
          description: apiTeam.description || 'A competitive football team focused on teamwork and excellence.',
          founded: apiTeam.founded,
          location: apiTeam.location,
          memberCount: apiTeam.memberCount,
          maxMembers: apiTeam.maxMembers,
          isMember: apiTeam.isMember,
          isUserCaptain: apiTeam.isUserCaptain,
          userPosition: apiTeam.userPosition,
          stats: apiTeam.stats,
          members: displayMembers,
          recentMatches: apiTeam.recentMatches || [],
          upcomingMatches: apiTeam.upcomingMatches || []
        };

        setTeam(displayTeam);
      } catch (err) {
        console.error('Error loading team data:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [teamId, user]);

  // Handle authentication loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading team details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Error state
  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/teams"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Teams
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {error === 'You must be logged in to view team details' ? 'Authentication Required' : 'Team Not Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'The team you are looking for could not be found.'}
              </p>
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Teams
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // League ID is still needed for navigation
  const leagueId = getLeagueId(team.league);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use consistent UTC-based formatting to prevent hydration mismatches
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  const calculateWinRate = (wins: number, draws: number, losses: number) => {
    const total = wins + draws + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getResultBadge = (result: 'win' | 'loss' | 'draw') => {
    const badges = {
      win: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      loss: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      draw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    };
    return badges[result];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/teams"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
        </div>

        {/* Team Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${team.color} rounded-lg flex items-center justify-center text-white font-bold text-2xl`}>
                {team.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {team.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  {team.league}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {team.location}
                  </span>
                  <span>Founded {team.founded}</span>
                  <span>{team.memberCount}/{team.maxMembers} members</span>
                </div>
              </div>
            </div>
            {team.isMember && (
              <div className="flex items-center gap-2">
                {team.isUserCaptain && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                    <Crown className="w-4 h-4" />
                    Captain
                  </div>
                )}
                {team.userPosition && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    <Target className="w-4 h-4" />
                    {team.userPosition}
                  </div>
                )}
                {team.isUserCaptain && (
                  <>
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Invite Player
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Settings className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Team Stats */}
          {(() => {
            const stats = team.stats || {};
            return (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {calculateWinRate(stats.wins || 0, stats.draws || 0, stats.losses || 0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.points || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.goals || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Goals Scored
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Overview
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'roster'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Roster ({team.memberCount})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'matches'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Matches
                  </div>
                </button>
              </nav>
              
              {/* Invite Button - Always Visible */}
              {team.isUserCaptain && (
                <div className="pb-4">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Invite Player
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Team Statistics Overview */}
            <TeamStatsOverview teamId={teamId} teamName={team.name} />

            {/* Team Leagues List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Leagues
                </h3>
                <Trophy className="w-5 h-5 text-gray-400" />
              </div>
              
              {team.leagues && team.leagues.length > 0 ? (
                <div className="space-y-4">
                  {team.leagues.map((league) => (
                    <div 
                      key={league.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        league.isCurrent 
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          league.isCurrent 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${
                              league.isCurrent 
                                ? 'text-blue-900 dark:text-blue-200' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {league.name}
                            </h4>
                            {league.isCurrent && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {league.seasons.length === 1 
                              ? `Season ${league.seasons[0]}`
                              : `${league.seasons.length} seasons (${league.seasons[league.seasons.length - 1]} - ${league.seasons[0]})`
                            }
                          </div>
                        </div>
                      </div>
                      
                      {league.isCurrent && (
                        <Link 
                          href={`/leagues/${getLeagueId(league.name)}`}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          <Trophy className="w-3 h-3" />
                          View League
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">This team hasn't participated in any leagues yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <TeamMemberManagement
            teamId={teamId}
            teamName={team.name}
            isUserCaptain={team.isUserCaptain}
            onMemberAdded={(member) => {
              // Update the team member count
              setTeam(prev => prev ? {
                ...prev,
                memberCount: prev.memberCount + 1
              } : null);
            }}
            onMemberRemoved={(memberId) => {
              // Update the team member count
              setTeam(prev => prev ? {
                ...prev,
                memberCount: Math.max(0, prev.memberCount - 1)
              } : null);
            }}
          />
        )}

        {activeTab === 'matches' && (
          <TeamMatchesOverview teamId={teamId} teamName={team.name} />
        )}

        {/* Team Invite Modal */}
        <EnhancedTeamInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={teamId}
          teamName={team.name}
          onInvitationSent={() => {
            // Could add team refresh logic here if needed
            setShowInviteModal(false);
          }}
        />
      </div>
    </div>
  );
}