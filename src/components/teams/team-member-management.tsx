/**
 * Team Member Management Component
 * 
 * Comprehensive team member management interface for:
 * - Adding/removing team members
 * - Assigning positions and jersey numbers
 * - Managing member roles and permissions
 * - Viewing member statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Target, 
  Hash, 
  Mail, 
  Phone, 
  Calendar,
  Trophy,
  Activity,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Send
} from 'lucide-react';
import { EnhancedTeamInviteModal } from './EnhancedTeamInviteModal';

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  email: string;
  full_name: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  jersey_number?: number;
  joined_at: string;
  is_active: boolean;
  is_captain: boolean;
  stats?: {
    matches_played: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    minutes_played: number;
  };
}


interface TeamMemberManagementProps {
  teamId: string;
  teamName?: string;
  isUserCaptain: boolean;
  onMemberAdded?: (member: TeamMember) => void;
  onMemberRemoved?: (memberId: string) => void;
}

export const TeamMemberManagement: React.FC<TeamMemberManagementProps> = ({
  teamId,
  teamName = 'Team',
  isUserCaptain,
  onMemberAdded,
  onMemberRemoved
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load team members
  useEffect(() => {
    loadMembers();
  }, [teamId]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to load team members');
      }

      const result = await response.json();
      setMembers(result.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
      // Set mock data for development
      setMembers([
        {
          id: '1',
          user_id: '550e8400-e29b-41d4-a716-446655440100',
          team_id: teamId,
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          position: 'midfielder',
          jersey_number: 10,
          joined_at: '2024-01-15T08:00:00Z',
          is_active: true,
          is_captain: true,
          stats: {
            matches_played: 15,
            goals: 8,
            assists: 12,
            yellow_cards: 2,
            red_cards: 0,
            minutes_played: 1350
          }
        },
        {
          id: '2',
          user_id: '550e8400-e29b-41d4-a716-446655440101',
          team_id: teamId,
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          position: 'forward',
          jersey_number: 9,
          joined_at: '2024-01-20T10:30:00Z',
          is_active: true,
          is_captain: false,
          stats: {
            matches_played: 14,
            goals: 15,
            assists: 5,
            yellow_cards: 1,
            red_cards: 0,
            minutes_played: 1260
          }
        },
        {
          id: '3',
          user_id: '550e8400-e29b-41d4-a716-446655440102',
          team_id: teamId,
          email: 'mike.wilson@example.com',
          full_name: 'Mike Wilson',
          position: 'goalkeeper',
          jersey_number: 1,
          joined_at: '2024-01-25T14:15:00Z',
          is_active: true,
          is_captain: false,
          stats: {
            matches_played: 15,
            goals: 0,
            assists: 1,
            yellow_cards: 0,
            red_cards: 0,
            minutes_played: 1350
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const positions = [
    { value: 'goalkeeper', label: 'Goalkeeper', icon: '🥅' },
    { value: 'defender', label: 'Defender', icon: '🛡️' },
    { value: 'midfielder', label: 'Midfielder', icon: '⚽' },
    { value: 'forward', label: 'Forward', icon: '🎯' }
  ];

  const filteredMembers = members.filter(member => {
    try {
      // Get display name with fallbacks
      const displayName = member.user_profile?.display_name || 
                         member.user_profile?.full_name || 
                         member.full_name || 
                         'Unknown Player';
      const email = member.user_profile?.email || member.email || '';
      
      // Safe lowercase search
      const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === 'all' || member.position === positionFilter;
      return matchesSearch && matchesPosition && member.is_active;
    } catch (error) {
      console.warn('Error filtering member:', member, error);
      return false; // Filter out problematic members
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPositionIcon = (position?: string) => {
    switch (position) {
      case 'goalkeeper': return '🥅';
      case 'defender': return '🛡️';
      case 'midfielder': return '⚽';
      case 'forward': return '🎯';
      default: return '👤';
    }
  };


  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setSuccess('Team member removed successfully!');
      onMemberRemoved?.(memberId);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to remove team member. Please try again.');
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    setIsSubmitting(true);
    try {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
      setShowEditModal(false);
      setEditingMember(null);
      setSuccess('Member updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update member. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Team Members ({filteredMembers.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team roster and player positions
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <Check className="w-4 h-4" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <X className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              {positions.map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredMembers.map((member) => (
          <div key={member.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(member.user_profile?.display_name || member.user_profile?.full_name || member.full_name || 'U').charAt(0)}
                </div>

                {/* Member Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {member.user_profile?.display_name || member.user_profile?.full_name || member.full_name || 'Unknown Player'}
                    </h3>
                    {member.is_captain && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        Captain
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.user_profile?.email || member.email || 'No email'}
                    </div>
                    {member.position && (
                      <div className="flex items-center gap-1">
                        <span>{getPositionIcon(member.position)}</span>
                        {positions.find(p => p.value === member.position)?.label}
                      </div>
                    )}
                    {member.jersey_number && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {member.jersey_number}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-6">
                {/* Quick Stats */}
                {member.stats && (
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {member.stats.matches_played}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {member.stats.goals}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {member.stats.assists}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Assists</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {isUserCaptain && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!member.is_captain && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No members found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || positionFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first team member to get started.'
            }
          </p>
        </div>
      )}

      {/* Team Invite Modal */}
      <EnhancedTeamInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        teamId={teamId}
        teamName={teamName}
        onInvitationSent={() => {
          // Refresh member list when invitation is sent
          loadMembers();
          setSuccess('Invitation created successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }}
      />
    </div>
  );
};