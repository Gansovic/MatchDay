'use client';

import React, { useState } from 'react';
import {
  Users,
  Eye,
  UserCheck,
  UserX,
  Settings,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';

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

interface SeasonTeamsManagementProps {
  teams: Team[];
  onTeamAction?: (teamId: string, action: string) => void;
  onRefresh?: () => void;
}

export default function SeasonTeamsManagement({
  teams,
  onTeamAction,
  onRefresh
}: SeasonTeamsManagementProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'registered':
        return <UserCheck className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const handleTeamAction = async (teamId: string, action: string) => {
    setActionLoading(`${teamId}-${action}`);
    try {
      await onTeamAction?.(teamId, action);
      onRefresh?.();
    } catch (error) {
      console.error('Error performing team action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Teams Registered
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No teams have registered for this season yet. Teams will appear here when they submit registration requests.
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Refresh Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Team Management ({teams.length})
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Manage team registrations and approvals for this season
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Team Avatar */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.team_color || '#3b82f6' }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {team.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(team.registration_status)}`}>
                        {getStatusIcon(team.registration_status)}
                        {team.registration_status.charAt(0).toUpperCase() + team.registration_status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {team.active_members} active players
                      </span>
                      <span>
                        Registered: {formatDate(team.registered_at)}
                      </span>
                    </div>

                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {team.registration_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleTeamAction(team.id, 'approve')}
                        disabled={actionLoading === `${team.id}-approve`}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading === `${team.id}-approve` ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleTeamAction(team.id, 'reject')}
                        disabled={actionLoading === `${team.id}-reject`}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {actionLoading === `${team.id}-reject` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}

                  {team.registration_status === 'confirmed' && (
                    <button
                      onClick={() => handleTeamAction(team.id, 'remove')}
                      disabled={actionLoading === `${team.id}-remove`}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      {actionLoading === `${team.id}-remove` ? 'Removing...' : 'Remove'}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Team Details */}
              {selectedTeam === team.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Team Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Team ID:</span>
                          <span className="text-gray-900 dark:text-white font-mono text-xs">{team.id.split('-')[0]}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Members:</span>
                          <span className="text-gray-900 dark:text-white">{team.total_members}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Active Members:</span>
                          <span className="text-gray-900 dark:text-white">{team.active_members}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Registration</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(team.registration_status)}`}>
                            {team.registration_status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Registered:</span>
                          <span className="text-gray-900 dark:text-white">{formatDate(team.registered_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h4>
                      <div className="space-y-2">
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                          <Users className="w-4 h-4 inline mr-2" />
                          View Members
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                          <Settings className="w-4 h-4 inline mr-2" />
                          Team Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}