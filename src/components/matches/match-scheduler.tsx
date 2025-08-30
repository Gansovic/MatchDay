/**
 * Match Scheduler Component
 * 
 * Comprehensive match scheduling and management system that provides:
 * - Calendar view of matches
 * - Match creation for league admins and team captains
 * - Match editing and management
 * - Team availability checking
 * - Venue assignment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  Loader2,
  Trophy,
  Target,
  User
} from 'lucide-react';

export interface Match {
  id: string;
  league_id: string;
  league_name: string;
  home_team_id: string;
  home_team_name: string;
  home_team_color?: string;
  away_team_id: string;
  away_team_name: string;
  away_team_color?: string;
  match_date: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
  created_by: string;
  created_at: string;
  match_week?: number;
  round?: string;
}

export interface Team {
  id: string;
  name: string;
  team_color?: string;
  league_id?: string;
  league_name?: string;
}

interface MatchSchedulerProps {
  userId?: string;
  userTeams?: Team[];
  leagueId?: string; // If provided, shows matches for specific league
  teamId?: string;   // If provided, shows matches for specific team
  isLeagueAdmin?: boolean;
  isTeamCaptain?: boolean;
  onMatchCreated?: (match: Match) => void;
  onMatchUpdated?: (match: Match) => void;
  onMatchDeleted?: (matchId: string) => void;
}

interface CreateMatchForm {
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time: string;
  venue: string;
  round: string;
}

export const MatchScheduler: React.FC<MatchSchedulerProps> = ({
  userId,
  userTeams = [],
  leagueId,
  teamId,
  isLeagueAdmin = false,
  isTeamCaptain = false,
  onMatchCreated,
  onMatchUpdated,
  onMatchDeleted
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [createForm, setCreateForm] = useState<CreateMatchForm>({
    league_id: leagueId || '',
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    match_time: '',
    venue: '',
    round: ''
  });

  // Load matches and teams
  useEffect(() => {
    loadData();
  }, [leagueId, teamId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Mock matches data for development
      const mockMatches: Match[] = [
        {
          id: '1',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1',
          home_team_id: '550e8400-e29b-41d4-a716-446655440200',
          home_team_name: 'Thunder Eagles',
          home_team_color: '#3B82F6',
          away_team_id: '550e8400-e29b-41d4-a716-446655440201',
          away_team_name: 'Lightning Strikers',
          away_team_color: '#EF4444',
          match_date: '2024-09-15T15:00:00Z',
          venue: 'Central Stadium',
          status: 'scheduled',
          created_by: userId || 'admin',
          created_at: '2024-08-15T10:00:00Z',
          match_week: 1,
          round: 'Round 1'
        },
        {
          id: '2',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1',
          home_team_id: '550e8400-e29b-41d4-a716-446655440201',
          home_team_name: 'Lightning Strikers',
          home_team_color: '#EF4444',
          away_team_id: '550e8400-e29b-41d4-a716-446655440202',
          away_team_name: 'Phoenix United',
          away_team_color: '#F97316',
          match_date: '2024-09-08T18:00:00Z',
          venue: 'North Field',
          status: 'completed',
          home_score: 2,
          away_score: 1,
          created_by: userId || 'admin',
          created_at: '2024-08-08T10:00:00Z',
          match_week: 2,
          round: 'Round 2'
        },
        {
          id: '3',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1',
          home_team_id: '550e8400-e29b-41d4-a716-446655440200',
          home_team_name: 'Thunder Eagles',
          home_team_color: '#3B82F6',
          away_team_id: '550e8400-e29b-41d4-a716-446655440202',
          away_team_name: 'Phoenix United',
          away_team_color: '#F97316',
          match_date: '2024-09-22T14:00:00Z',
          venue: 'Sports Complex',
          status: 'scheduled',
          created_by: userId || 'admin',
          created_at: '2024-08-15T11:00:00Z',
          match_week: 3,
          round: 'Round 3'
        }
      ];

      // Mock available teams for the league
      const mockTeams: Team[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440200',
          name: 'Thunder Eagles',
          team_color: '#3B82F6',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440201',
          name: 'Lightning Strikers',
          team_color: '#EF4444',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440202',
          name: 'Phoenix United',
          team_color: '#F97316',
          league_id: '550e8400-e29b-41d4-a716-446655440001',
          league_name: 'League1'
        }
      ];

      // Filter matches based on provided constraints
      let filteredMatches = mockMatches;
      if (leagueId) {
        filteredMatches = filteredMatches.filter(match => match.league_id === leagueId);
      }
      if (teamId) {
        filteredMatches = filteredMatches.filter(match => 
          match.home_team_id === teamId || match.away_team_id === teamId
        );
      }

      setMatches(filteredMatches);
      setAvailableTeams(mockTeams);
    } catch (err) {
      setError('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!createForm.league_id || !createForm.home_team_id || !createForm.away_team_id || 
        !createForm.match_date || !createForm.match_time) {
      setError('Please fill in all required fields');
      return;
    }

    if (createForm.home_team_id === createForm.away_team_id) {
      setError('Home and away teams must be different');
      return;
    }

    setIsSubmitting(true);
    try {
      const homeTeam = availableTeams.find(t => t.id === createForm.home_team_id);
      const awayTeam = availableTeams.find(t => t.id === createForm.away_team_id);

      const newMatch: Match = {
        id: Date.now().toString(),
        league_id: createForm.league_id,
        league_name: homeTeam?.league_name || 'League',
        home_team_id: createForm.home_team_id,
        home_team_name: homeTeam?.name || 'Home Team',
        home_team_color: homeTeam?.team_color,
        away_team_id: createForm.away_team_id,
        away_team_name: awayTeam?.name || 'Away Team',
        away_team_color: awayTeam?.team_color,
        match_date: `${createForm.match_date}T${createForm.match_time}:00Z`,
        venue: createForm.venue,
        status: 'scheduled',
        created_by: userId || 'admin',
        created_at: new Date().toISOString(),
        round: createForm.round
      };

      setMatches(prev => [newMatch, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        league_id: leagueId || '',
        home_team_id: '',
        away_team_id: '',
        match_date: '',
        match_time: '',
        venue: '',
        round: ''
      });
      setSuccess('Match scheduled successfully!');
      onMatchCreated?.(newMatch);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      setSuccess('Match deleted successfully!');
      onMatchDeleted?.(matchId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete match');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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

  const getStatusBadge = (status: string, homeScore?: number, awayScore?: number) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      live: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 animate-pulse',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    };

    const labels = {
      scheduled: 'Scheduled',
      live: 'Live',
      completed: homeScore !== undefined && awayScore !== undefined ? `${homeScore}-${awayScore}` : 'Completed',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Filter matches based on search and status
  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchQuery === '' || 
      match.home_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.away_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.league_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canCreateMatches = isLeagueAdmin || isTeamCaptain;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {leagueId ? 'League matches' : teamId ? 'Team matches' : 'All matches'}
          </p>
        </div>
        {canCreateMatches && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Match
          </button>
        )}
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {canCreateMatches ? 'Get started by scheduling your first match.' : 'No matches have been scheduled yet.'}
            </p>
            {canCreateMatches && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Schedule Match
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.map((match) => (
              <div key={match.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(match.status, match.home_score, match.away_score)}
                    {match.round && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {match.round}
                      </span>
                    )}
                  </div>
                  
                  {canCreateMatches && match.status === 'scheduled' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit match"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: match.home_team_color || '#3B82F6' }}
                      >
                        {match.home_team_name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {match.home_team_name}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg font-bold text-gray-900 dark:text-white">
                    {match.status === 'completed' && match.home_score !== undefined && match.away_score !== undefined
                      ? `${match.home_score} - ${match.away_score}`
                      : 'vs'
                    }
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {match.away_team_name}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: match.away_team_color || '#EF4444' }}
                      >
                        {match.away_team_name.charAt(0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(match.match_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(match.match_date)}
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.venue}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {match.league_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Schedule New Match
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Teams Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Home Team *
                  </label>
                  <select
                    value={createForm.home_team_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, home_team_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select home team</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Away Team *
                  </label>
                  <select
                    value={createForm.away_team_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, away_team_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select away team</option>
                    {availableTeams.filter(team => team.id !== createForm.home_team_id).map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    value={createForm.match_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, match_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Match Time *
                  </label>
                  <input
                    type="time"
                    value={createForm.match_time}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, match_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Venue and Round */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="Enter venue name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Round/Week
                  </label>
                  <input
                    type="text"
                    value={createForm.round}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, round: e.target.value }))}
                    placeholder="e.g., Round 1, Week 3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMatch}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule Match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};