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
import { Database } from '@/lib/types/database.types';

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

  // Get league standings from real data (simplified for now)
  const getLeagueStandings = (teamName: string, league: string): LeagueStanding[] => {
    if (league === 'League1') {
      const stats = team.stats || {};
      const standings = [
        { position: 1, teamName: team.name, played: stats.totalMatches || 0, wins: stats.wins || 0, draws: stats.draws || 0, losses: stats.losses || 0, goalsFor: stats.goals || 0, goalsAgainst: stats.goalsAgainst || 0, goalDifference: (stats.goals || 0) - (stats.goalsAgainst || 0), points: stats.points || 0 },
        { position: 2, teamName: 'Other Team 1', played: 17, wins: 12, draws: 3, losses: 2, goalsFor: 45, goalsAgainst: 18, goalDifference: 27, points: 39 },
        { position: 3, teamName: 'Mountain Lions', played: 17, wins: 11, draws: 4, losses: 2, goalsFor: 38, goalsAgainst: 16, goalDifference: 22, points: 37 },
        { position: 4, teamName: 'Storm Riders', played: 17, wins: 10, draws: 5, losses: 2, goalsFor: 35, goalsAgainst: 20, goalDifference: 15, points: 35 },
        { position: 5, teamName: 'River Hawks', played: 17, wins: 10, draws: 3, losses: 4, goalsFor: 32, goalsAgainst: 22, goalDifference: 10, points: 33 },
        { position: 6, teamName: 'Desert Foxes', played: 17, wins: 9, draws: 4, losses: 4, goalsFor: 29, goalsAgainst: 21, goalDifference: 8, points: 31 },
        { position: 7, teamName: 'Lightning Bolts', played: 17, wins: 8, draws: 5, losses: 4, goalsFor: 28, goalsAgainst: 25, goalDifference: 3, points: 29 },
        { position: 8, teamName: 'Steel Warriors', played: 17, wins: 7, draws: 6, losses: 4, goalsFor: 26, goalsAgainst: 23, goalDifference: 3, points: 27 },
        { position: 9, teamName: 'Fire Dragons', played: 17, wins: 7, draws: 4, losses: 6, goalsFor: 25, goalsAgainst: 26, goalDifference: -1, points: 25 },
        { position: 10, teamName: 'Ocean Sharks', played: 17, wins: 6, draws: 5, losses: 6, goalsFor: 22, goalsAgainst: 27, goalDifference: -5, points: 23 },
        { position: 11, teamName: 'Wind Runners', played: 17, wins: 5, draws: 7, losses: 5, goalsFor: 20, goalsAgainst: 24, goalDifference: -4, points: 22 },
        { position: 12, teamName: 'Stone Giants', played: 17, wins: 5, draws: 4, losses: 8, goalsFor: 18, goalsAgainst: 28, goalDifference: -10, points: 19 },
        { position: 13, teamName: 'Shadow Wolves', played: 17, wins: 4, draws: 5, losses: 8, goalsFor: 16, goalsAgainst: 30, goalDifference: -14, points: 17 },
        { position: 14, teamName: 'Ice Bears', played: 17, wins: 3, draws: 6, losses: 8, goalsFor: 15, goalsAgainst: 32, goalDifference: -17, points: 15 },
        { position: 15, teamName: 'Forest Eagles', played: 17, wins: 2, draws: 4, losses: 11, goalsFor: 12, goalsAgainst: 38, goalDifference: -26, points: 10 },
        { position: 16, teamName: 'Valley Titans', played: 17, wins: 1, draws: 3, losses: 13, goalsFor: 8, goalsAgainst: 45, goalDifference: -37, points: 6 }
      ];
      return standings.map(standing => ({ ...standing, isCurrentTeam: standing.teamName === teamName }));
    } else if (league === 'Elite Soccer League') {
      const stats = team.stats || {};
      const standings = [
        { position: 1, teamName: 'Velocity United', played: 14, wins: 10, draws: 3, losses: 1, goalsFor: 35, goalsAgainst: 12, goalDifference: 23, points: 33 },
        { position: 2, teamName: 'Coastal Rovers', played: 14, wins: 9, draws: 2, losses: 3, goalsFor: 28, goalsAgainst: 15, goalDifference: 13, points: 29 },
        { position: 3, teamName: 'Rapid Strikers', played: 14, wins: 8, draws: 4, losses: 2, goalsFor: 30, goalsAgainst: 18, goalDifference: 12, points: 28 },
        { position: stats.position || 4, teamName: team.name, played: 14, wins: stats.wins || 0, draws: stats.draws || 0, losses: stats.losses || 0, goalsFor: stats.goals || 0, goalsAgainst: stats.goalsAgainst || 0, goalDifference: (stats.goals || 0) - (stats.goalsAgainst || 0), points: stats.points || 0 },
        { position: 5, teamName: 'Thunder FC', played: 14, wins: 7, draws: 3, losses: 4, goalsFor: 25, goalsAgainst: 20, goalDifference: 5, points: 24 },
        { position: 6, teamName: 'Elite Warriors', played: 14, wins: 6, draws: 4, losses: 4, goalsFor: 22, goalsAgainst: 19, goalDifference: 3, points: 22 },
        { position: 7, teamName: 'Metro United', played: 14, wins: 5, draws: 5, losses: 4, goalsFor: 20, goalsAgainst: 18, goalDifference: 2, points: 20 },
        { position: 8, teamName: 'City Hornets', played: 14, wins: 5, draws: 3, losses: 6, goalsFor: 18, goalsAgainst: 22, goalDifference: -4, points: 18 },
        { position: 9, teamName: 'North Rangers', played: 14, wins: 4, draws: 4, losses: 6, goalsFor: 16, goalsAgainst: 24, goalDifference: -8, points: 16 },
        { position: 10, teamName: 'South United', played: 14, wins: 3, draws: 3, losses: 8, goalsFor: 14, goalsAgainst: 28, goalDifference: -14, points: 12 },
        { position: 11, teamName: 'West Town FC', played: 14, wins: 2, draws: 4, losses: 8, goalsFor: 12, goalsAgainst: 30, goalDifference: -18, points: 10 },
        { position: 12, teamName: 'East Valley', played: 14, wins: 1, draws: 3, losses: 10, goalsFor: 8, goalsAgainst: 35, goalDifference: -27, points: 6 }
      ];
      return standings.map(standing => ({ ...standing, isCurrentTeam: standing.teamName === teamName }));
    }
    
    // Default fallback for other leagues
    const stats = team.stats || {};
    return [
      { 
        position: stats.position || 1, 
        teamName: team.name, 
        played: (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0), 
        wins: stats.wins || 0, 
        draws: stats.draws || 0, 
        losses: stats.losses || 0, 
        goalsFor: stats.goals || 0, 
        goalsAgainst: stats.goalsAgainst || 0, 
        goalDifference: (stats.goals || 0) - (stats.goalsAgainst || 0), 
        points: stats.points || 0, 
        isCurrentTeam: true 
      }
    ];
  };

  const leagueStandings = getLeagueStandings(team.name, team.league);
  const leagueId = getLeagueId(team.league);

  // Create compact league preview (top 5 + current team if not in top 5)
  const getCompactStandings = (standings: LeagueStanding[], currentTeam: string): LeagueStanding[] => {
    const currentTeamStanding = standings.find(s => s.isCurrentTeam);
    const top5 = standings.slice(0, 5);
    
    // If current team is in top 5, just return top 5
    if (currentTeamStanding && currentTeamStanding.position <= 5) {
      return top5;
    }
    
    // If current team is not in top 5, add it with separator
    if (currentTeamStanding) {
      return [
        ...top5,
        { 
          ...currentTeamStanding, 
          teamName: '...', 
          position: -1, 
          played: 0, 
          wins: 0, 
          draws: 0, 
          losses: 0, 
          goalsFor: 0, 
          goalsAgainst: 0, 
          goalDifference: 0, 
          points: 0, 
          isCurrentTeam: false 
        } as LeagueStanding,
        currentTeamStanding
      ];
    }
    
    return top5;
  };

  const compactStandings = getCompactStandings(leagueStandings, team.name);

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.position || 1}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    of {stats.totalTeams || 1}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">League Position</div>
                </div>
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

            {/* League Table Preview - Keep existing league table if team is in a league */}
            {team.league && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {team.league} Standings
                  </h3>
                  <Trophy className="w-5 h-5 text-gray-400" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Pos</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Team</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">Pts</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compactStandings.map((standing, index) => {
                        // Handle separator row
                        if (standing.position === -1) {
                          return (
                            <tr key="separator" className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-2 px-2 text-center" colSpan={4}>
                                <div className="text-gray-400 text-sm font-medium">...</div>
                              </td>
                            </tr>
                          );
                        }
                        
                        return (
                          <tr 
                            key={standing.position}
                            className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              standing.isCurrentTeam 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                : ''
                            }`}
                          >
                            <td className="py-3 px-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                standing.position <= 3 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : standing.position >= leagueStandings.length - 2
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {standing.position}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className={`font-medium ${
                                standing.isCurrentTeam 
                                  ? 'text-blue-900 dark:text-blue-300 font-semibold' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {standing.teamName}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`font-bold ${
                                standing.isCurrentTeam 
                                  ? 'text-blue-900 dark:text-blue-300' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {standing.points}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-sm">
                              <span className={`${
                                standing.goalDifference > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : standing.goalDifference < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* View Full League Button */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Link 
                    href={`/leagues/${leagueId}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <Trophy className="w-4 h-4" />
                    View Full League Table
                  </Link>
                </div>
                
                <div className="mt-4 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
                    <span>Top 3 (Championship spots)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded-full"></div>
                    <span>Bottom 2 (Relegation zone)</span>
                  </div>
                </div>
              </div>
            )}
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