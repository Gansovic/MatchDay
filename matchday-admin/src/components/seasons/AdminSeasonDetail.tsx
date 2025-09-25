'use client';

import React, { useState, useCallback } from 'react';
import {
  Calendar,
  Users,
  Trophy,
  Settings,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Edit,
  Save,
  X,
  Plus,
  Eye
} from 'lucide-react';

interface Season {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  registration_start?: string;
  registration_end?: string;
  max_teams?: number;
  min_teams?: number;
  status: string;
  format?: string;
  is_active: boolean;
  league?: {
    id: string;
    name: string;
    sport_type: string;
    league_type: string;
    location?: string;
  };
}

interface Team {
  id: string;
  name: string;
  team_color?: string;
  description?: string;
  registration_status: string;
  registered_at: string;
  active_members: number;
  total_members: number;
}

interface PendingRequest {
  id: string;
  team_id: string;
  requested_by: string;
  request_message?: string;
  created_at: string;
  team: {
    id: string;
    name: string;
    team_color?: string;
  };
  requester: {
    id: string;
    display_name?: string;
  };
}

interface SeasonStatistics {
  teamCount: number;
  totalPlayers: number;
  pendingRequestsCount: number;
  availableSpots: number;
  maxTeams: number;
  registrationOpen: boolean;
  seasonActive: boolean;
  averagePlayersPerTeam: number;
  matchStats: {
    total: number;
    completed: number;
    upcoming: number;
  };
}

interface SeasonDetails {
  season: Season;
  teams: Team[];
  pendingRequests: PendingRequest[];
  statistics: SeasonStatistics;
}

interface AdminSeasonDetailProps {
  seasonData: SeasonDetails;
  leagueId: string;
  seasonId: string;
  onDataUpdate?: () => void;
}

export default function AdminSeasonDetail({
  seasonData,
  leagueId,
  seasonId,
  onDataUpdate
}: AdminSeasonDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSeason, setEditedSeason] = useState(seasonData.season);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'registration':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/seasons/${seasonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSeason),
      });

      if (response.ok) {
        setIsEditing(false);
        onDataUpdate?.();
      } else {
        console.error('Failed to update season');
      }
    } catch (error) {
      console.error('Error updating season:', error);
    } finally {
      setLoading(false);
    }
  }, [editedSeason, leagueId, seasonId, onDataUpdate]);

  const handleCancel = () => {
    setEditedSeason(seasonData.season);
    setIsEditing(false);
  };

  const { season, teams, pendingRequests, statistics } = seasonData;

  return (
    <div className="space-y-6">
      {/* Season Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedSeason.name}
                  onChange={(e) => setEditedSeason({ ...editedSeason, name: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                />
                <textarea
                  value={editedSeason.description || ''}
                  onChange={(e) => setEditedSeason({ ...editedSeason, description: e.target.value })}
                  placeholder="Season description..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {season.name}
                </h1>
                {season.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                    {season.description}
                  </p>
                )}
              </>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {season.league?.sport_type} • {season.league?.league_type}
              </span>
              {season.league?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {season.league.location}
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(season.status)}`}>
                {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Season
              </button>
            )}
          </div>
        </div>

        {/* Season Dates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span className="font-medium text-gray-400">Season Start:</span>
            <p className="text-gray-900 dark:text-white">{formatDate(season.start_date)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400">Season End:</span>
            <p className="text-gray-900 dark:text-white">{formatDate(season.end_date)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400">Registration Start:</span>
            <p className="text-gray-900 dark:text-white">{formatDate(season.registration_start)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400">Registration End:</span>
            <p className="text-gray-900 dark:text-white">{formatDate(season.registration_end)}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{statistics.teamCount}</div>
              <div className="text-sm opacity-90">Teams Registered</div>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{statistics.totalPlayers}</div>
              <div className="text-sm opacity-90">Total Players</div>
            </div>
            <Target className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{statistics.pendingRequestsCount}</div>
              <div className="text-sm opacity-90">Pending Requests</div>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{statistics.availableSpots}</div>
              <div className="text-sm opacity-90">Available Spots</div>
            </div>
            <Plus className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Registered Teams ({teams.length})
              </h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Manage Teams
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No teams registered yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Teams will appear here when they register for this season</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.team_color || '#3b82f6' }}
                        >
                          <span className="text-white font-bold text-sm">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.active_members} active players • Registered {formatDate(team.registered_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRegistrationStatusColor(team.registration_status)}`}>
                          {team.registration_status.charAt(0).toUpperCase() + team.registration_status.slice(1)}
                        </span>
                        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No pending requests</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {request.team.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested by {request.requester.display_name || 'Unknown'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(request.created_at)}
                      </span>
                    </div>

                    {request.request_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {request.request_message}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Season Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Season Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Open</span>
                <span className={`px-2 py-1 text-xs rounded-full ${statistics.registrationOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {statistics.registrationOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Teams</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{statistics.maxTeams}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Season Format</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{season.format || 'Not set'}</span>
              </div>

              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors">
                <Settings className="w-4 h-4 inline mr-2" />
                Advanced Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}