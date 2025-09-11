/**
 * League Management Component
 * 
 * Comprehensive league discovery and team management interface that allows:
 * - Browsing available leagues
 * - Joining leagues with teams
 * - Leaving leagues
 * - Managing team participation in leagues
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  Search,
  Filter,
  X,
  Check,
  Clock,
  Target,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Eye,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useRealtimeLeagues, usePageVisibility } from '@/lib/hooks/use-realtime-leagues';

export interface League {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location?: string;
  season_start?: string;
  season_end?: string;
  max_teams?: number;
  entry_fee?: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  teamCount: number;
  availableSpots: number;
  teams?: {
    id: string;
    name: string;
    team_color?: string;
    is_recruiting: boolean;
  }[];
  userTeams?: {
    id: string;
    name: string;
    isInLeague: boolean;
    canJoin: boolean;
    canLeave: boolean;
  }[];
}

export interface UserTeam {
  id: string;
  name: string;
  team_color?: string;
  is_captain: boolean;
  league_id?: string;
  league_name?: string;
}

interface LeagueManagementProps {
  userId?: string;
  onTeamJoinedLeague?: (teamId: string, leagueId: string) => void;
  onTeamLeftLeague?: (teamId: string, leagueId: string) => void;
}

export const LeagueManagement: React.FC<LeagueManagementProps> = ({
  userId,
  onTeamJoinedLeague,
  onTeamLeftLeague
}) => {
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueType, setSelectedLeagueType] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation
  const router = useRouter();

  // Page visibility for optimized subscriptions
  const isPageVisible = usePageVisibility();
  
  // Real-time leagues data with filters
  const {
    leagues: realtimeLeagues,
    isLoading,
    isConnected,
    lastUpdate,
    forceRefresh
  } = useRealtimeLeagues({
    sportType: selectedSport,
    leagueType: selectedLeagueType,
    isActive: true,
    isPublic: true
  });

  // Load user teams only (leagues now come from real-time hook)
  useEffect(() => {
    if (userId) {
      loadUserTeams();
    }
  }, [userId]);

  const loadUserTeams = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/teams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setUserTeams([]);
          return;
        }
        throw new Error(`Failed to fetch user teams: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load user teams');
      }

      // Transform API data to match component interface
      const teams = (result.data || []).map(membership => ({
        id: membership.team.id,
        name: membership.team.name,
        team_color: membership.team.team_color,
        is_captain: membership.role === 'captain',
        league_id: membership.team.league?.id || null,
        league_name: membership.team.league?.name || null
      }));
      
      setUserTeams(teams);
    } catch (error) {
      console.error('Failed to load user teams:', error);
      // Don't throw here, just set empty teams so leagues can still load
      setUserTeams([]);
    }
  };


  const leagueTypes = [
    { value: 'all', label: 'All Levels' },
    { value: 'recreational', label: 'Recreational', icon: '🌟' },
    { value: 'competitive', label: 'Competitive', icon: '🔥' },
    { value: 'semi-pro', label: 'Semi-Pro', icon: '⚡' }
  ];

  const sports = [
    { value: 'all', label: 'All Sports' },
    { value: 'football', label: 'Football', icon: '⚽' }
  ];

  // Process leagues with user team information and apply search filtering
  const processedLeagues = realtimeLeagues.map(league => ({
    ...league,
    userTeams: userTeams.map(team => ({
      id: team.id,
      name: team.name,
      isInLeague: team.league_id === league.id,
      canJoin: !team.league_id && league.availableSpots > 0,
      canLeave: team.league_id === league.id
    }))
  }));

  // Apply search filter (league type and sport filtering is done by the hook)
  const filteredLeagues = processedLeagues.filter(league => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return league.name.toLowerCase().includes(searchLower) ||
           league.description?.toLowerCase().includes(searchLower) ||
           league.location?.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLeagueTypeIcon = (type: string) => {
    switch (type) {
      case 'recreational': return '🌟';
      case 'competitive': return '🔥';
      case 'semi-pro': return '⚡';
      default: return '🏆';
    }
  };

  const handleJoinLeague = (league: League) => {
    setSelectedLeague(league);
    setSelectedTeam('');
    setShowJoinModal(true);
  };

  const handleViewLeague = (league: League) => {
    router.push(`/leagues/${league.id}`);
  };

  const handleConfirmJoin = async () => {
    if (!selectedLeague || !selectedTeam) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, get the league details to check if it requires manual approval
      const leagueResponse = await fetch(`/api/leagues/${selectedLeague.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const leagueResult = await leagueResponse.json();
      
      if (!leagueResult.success) {
        throw new Error(leagueResult.error || 'Failed to get league details');
      }

      const leagueDetails = leagueResult.data;
      
      // Check if league requires manual approval
      if (!leagueDetails.auto_approve_teams) {
        // Create join request instead of directly joining
        const requestResponse = await fetch(`/api/teams/${selectedTeam}/request-league-join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leagueId: selectedLeague.id,
            requestedBy: userId,
            message: `Request to join ${selectedLeague.name} league`
          }),
        });

        const requestResult = await requestResponse.json();

        if (!requestResult.success) {
          // Handle specific request error types
          if (requestResult.error?.includes('already has a')) {
            setError(requestResult.error);
            setShowJoinModal(false);
          } else {
            throw new Error(requestResult.error || 'Failed to create join request');
          }
          return;
        }

        setShowJoinModal(false);
        setSuccess(requestResult.data?.message || `Join request submitted for ${selectedLeague.name}! Please wait for admin approval.`);
        setTimeout(() => setSuccess(null), 5000);
        return;
      }

      // League has auto-approval, proceed with direct join
      const response = await fetch(`/api/teams/${selectedTeam}/join-league`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leagueId: selectedLeague.id
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Check for specific error types
        if (result.error?.includes('already registered')) {
          // Team is already in this season
          setError(result.error);
          setShowJoinModal(false);
        } else if (result.error?.includes('No active season')) {
          // No active season available
          setError(result.error);
        } else if (result.error?.includes('is full')) {
          // Season is full
          setError(result.error);
        } else if (result.redirect_to_auto_join) {
          // Redirect error from request endpoint
          setError('This league requires manual approval. Please wait for admin approval.');
        } else {
          // Generic error
          throw new Error(result.error || 'Failed to join league');
        }
        return;
      }
      
      // Update local user teams state - real-time hook will handle league updates
      const seasonInfo = result.data?.season;
      setUserTeams(prev => prev.map(team => 
        team.id === selectedTeam 
          ? { ...team, league_id: selectedLeague.id, league_name: selectedLeague.name }
          : team
      ));

      setShowJoinModal(false);
      
      // Show success message with season information
      const successMessage = result.data?.message || 
        (seasonInfo 
          ? `Successfully joined ${selectedLeague.name} for the ${seasonInfo.display_name} season!`
          : `Successfully joined ${selectedLeague.name}!`);
      
      setSuccess(successMessage);
      onTeamJoinedLeague?.(selectedTeam, selectedLeague.id);
      
      // Real-time hook will automatically update league data, so no manual refresh needed
      console.log('✅ Team joined league - real-time updates will handle data sync');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join league. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveLeague = async (teamId: string, leagueId: string) => {
    if (!confirm('Are you sure you want to leave this league? This will remove your team from the current season.')) return;

    setError(null);
    
    try {
      // Real API call to leave league (now leaves the season)
      const response = await fetch(`/api/teams/${teamId}/leave-league`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to leave league');
      }
      
      const league = filteredLeagues.find(l => l.id === leagueId);
      const seasonInfo = result.data?.season;
      
      // Update local user teams state - real-time hook will handle league updates
      setUserTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { ...team, league_id: undefined, league_name: undefined }
          : team
      ));

      // Show success message with season information
      const successMessage = result.data?.message || 
        (seasonInfo 
          ? `Left the ${seasonInfo.display_name} season of ${league?.name} successfully!`
          : `Left ${league?.name} successfully!`);
      
      setSuccess(successMessage);
      onTeamLeftLeague?.(teamId, leagueId);
      
      // Real-time hook will automatically update league data
      console.log('✅ Team left league - real-time updates will handle data sync');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave league. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            League Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join leagues with your teams and manage your competition participation
          </p>
        </div>
        
        {/* Real-time Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 dark:text-orange-400">Offline</span>
              </>
            )}
          </div>
          
          {/* Manual Refresh Button */}
          <button
            onClick={forceRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh leagues"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <Check className="w-4 h-4" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* My Teams in Leagues */}
      {userTeams.some(team => team.league_id) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            My Teams in Leagues
          </h2>
          <div className="space-y-3">
            {userTeams
              .filter(team => team.league_id)
              .map(team => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: team.team_color }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        in {team.league_name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLeaveLeague(team.id, team.league_id!)}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                  >
                    <UserMinus className="w-4 h-4" />
                    Leave League
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedLeagueType}
            onChange={(e) => setSelectedLeagueType(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leagueTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon ? `${type.icon} ${type.label}` : type.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sports.map(sport => (
              <option key={sport.value} value={sport.value}>
                {sport.icon ? `${sport.icon} ${sport.label}` : sport.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLeagues.map((league) => (
          <div key={league.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            {/* League Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {league.name}
                  </h3>
                  <span className="text-xl">
                    {getLeagueTypeIcon(league.league_type)}
                  </span>
                </div>
                {league.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {league.description}
                  </p>
                )}
              </div>
            </div>

            {/* League Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="font-bold text-gray-900 dark:text-white">
                  {league.teamCount}/{league.max_teams || '∞'}
                </div>
                <div className="text-xs text-gray-500">Teams</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 dark:text-white capitalize">
                  {league.league_type}
                </div>
                <div className="text-xs text-gray-500">Level</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 dark:text-white">
                  {league.entry_fee ? `$${league.entry_fee}` : 'Free'}
                </div>
                <div className="text-xs text-gray-500">Entry</div>
              </div>
            </div>

            {/* League Details */}
            <div className="space-y-2 mb-4">
              {league.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {league.location}
                </div>
              )}
              {league.season_start && league.season_end && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(league.season_start)} - {formatDate(league.season_end)}
                </div>
              )}
            </div>

            {/* Teams in League */}
            {league.teams && league.teams.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teams ({league.teams.length})
                </div>
                <div className="flex gap-2 flex-wrap">
                  {league.teams.slice(0, 3).map(team => (
                    <div key={team.id} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.team_color }}
                      />
                      {team.name}
                    </div>
                  ))}
                  {league.teams.length > 3 && (
                    <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                      +{league.teams.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* View League Button - Always Available */}
              <button
                onClick={() => handleViewLeague(league)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View League
              </button>
              
              {/* Join Button - Only when spots available */}
              {league.availableSpots > 0 && (
                <button
                  onClick={() => handleJoinLeague(league)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Join with Team
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredLeagues.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No leagues found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Join League Modal */}
      {showJoinModal && selectedLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Join {selectedLeague.name}
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Team *
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a team...</option>
                  {userTeams
                    .filter(team => !team.league_id && team.is_captain)
                    .map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
                {userTeams.filter(team => !team.league_id && team.is_captain).length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    You need to be a captain of a team that's not in a league to join.
                  </p>
                )}
              </div>

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  League Details
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Type: {selectedLeague.league_type}</div>
                  <div>Location: {selectedLeague.location}</div>
                  <div>Entry Fee: {selectedLeague.entry_fee ? `$${selectedLeague.entry_fee}` : 'Free'}</div>
                  <div>Available Spots: {selectedLeague.availableSpots}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={isSubmitting || !selectedTeam}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Join League
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};