/**
 * My Teams Page
 * 
 * Comprehensive team management interface where users can:
 * - View all teams they're part of
 * - See team statistics and standings
 * - Manage team memberships
 * - Browse available teams to join
 * - Track upcoming matches
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { TeamInvitationWithDetails } from '@/lib/types/database.types';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  UserPlus,
  Search,
  Filter,
  Crown,
  Target,
  Clock,
  Plus,
  X,
  Loader2,
  Check,
  Palette,
  Mail,
  Hash,
  MessageSquare
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  league: string;
  logo?: string;
  position: string;
  isCaptain: boolean;
  memberCount: number;
  maxMembers: number;
  location?: string;
  description?: string;
  nextMatch?: {
    opponent: string;
    date: string;
    venue: string;
  };
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    position: number;
    totalTeams: number;
  };
  color: string;
}

interface CreateTeamForm {
  name: string;
  description: string;
  maxMembers: number;
  location: string;
  color: string;
}

interface FormErrors {
  name?: string;
  location?: string;
}

interface AvailableTeam {
  id: string;
  name: string;
  league: string;
  logo?: string;
  memberCount: number;
  maxMembers: number;
  isRecruiting: boolean;
  requiredPosition?: string;
  location: string;
  nextMatch?: string;
  color: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-teams' | 'invitations' | 'discover'>('my-teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newlyCreatedTeamId, setNewlyCreatedTeamId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTeamForm>({
    name: '',
    description: '',
    maxMembers: 22,
    location: '',
    color: 'bg-blue-600'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitationWithDetails[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  // Temporarily disable authentication check for testing
  // TODO: Re-enable when authentication is properly configured
  /*
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?returnUrl=/teams');
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user) {
    return null;
  }
  */

  // Load teams data
  React.useEffect(() => {
    const loadTeams = async () => {
      try {
        // Get the current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: HeadersInit = {};
        if (session) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch('/api/teams', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to load teams');
        }

        const result = await response.json();
        
        // Convert API response to local Team format (if any teams exist)
        const teams: Team[] = (result.data || []).map((teamData: any) => {
          return {
            id: teamData.id,
            name: teamData.name,
            league: teamData.league?.name || teamData.league || 'Unknown League',
            position: 'Captain', // Mock as captain for testing
            isCaptain: true,
            memberCount: teamData.memberCount || 1,
            maxMembers: teamData.max_players || 22,
            location: teamData.league?.location || 'Test Location',
            description: teamData.team_bio || teamData.description,
            stats: teamData.stats || {
              wins: 0,
              draws: 0,
              losses: 0,
              goals: 0,
              position: 1,
              totalTeams: 1
            },
            color: teamData.team_color || '#2563eb'
          };
        });

        setMyTeams(teams);
      } catch (error) {
        console.error('Error loading teams:', error);
        // For now, fall back to empty array - could show error state
        setMyTeams([]);
      }
    };

    loadTeams();
    loadInvitations();
  }, []);

  // Load invitations
  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setInvitations([]);
        return;
      }

      const response = await fetch('/api/invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setInvitations(result.data || []);
      } else {
        setInvitations([]);
      }

    } catch (err) {
      console.error('Error loading invitations:', err);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingInvitation(invitationId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} invitation`);
      }

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // If accepted, refresh teams list
      if (action === 'accept') {
        // Reload teams to show the new team
        const loadTeams = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const headers: HeadersInit = {};
            if (session) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            
            const response = await fetch('/api/teams', { headers });
            
            if (response.ok) {
              const result = await response.json();
              
              const teams: Team[] = (result.data || []).map((teamData: any) => {
                return {
                  id: teamData.id,
                  name: teamData.name,
                  league: teamData.league?.name || teamData.league || 'Unknown League',
                  position: 'Player',
                  isCaptain: teamData.captain_id === user?.id,
                  memberCount: teamData.memberCount || 1,
                  maxMembers: teamData.max_players || 22,
                  location: teamData.league?.location || 'Test Location',
                  description: teamData.team_bio || teamData.description,
                  stats: teamData.stats || {
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goals: 0,
                    position: 1,
                    totalTeams: 1
                  },
                  color: teamData.team_color || '#2563eb'
                };
              });

              setMyTeams(teams);
            }
          } catch (error) {
            console.error('Error reloading teams:', error);
          }
        };
        
        loadTeams();
      }

    } catch (err) {
      console.error(`Error ${action}ing invitation:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} invitation`);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const formatInvitationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    return 'Expires soon';
  };

  const availableTeams: AvailableTeam[] = [
    {
      id: '3',
      name: 'Velocity United',
      league: 'Elite Soccer League',
      memberCount: 16,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Defender',
      location: 'North District',
      nextMatch: '2024-08-25',
      color: 'bg-green-600'
    },
    {
      id: '4',
      name: 'Coastal Rovers',
      league: 'Metropolitan Football League',
      memberCount: 18,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Midfielder',
      location: 'Coastal Area',
      nextMatch: '2024-08-23',
      color: 'bg-teal-600'
    },
    {
      id: '5',
      name: 'Rapid Strikers',
      league: 'Weekend Football Division',
      memberCount: 20,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Goalkeeper',
      location: 'South Stadium',
      nextMatch: '2024-08-24',
      color: 'bg-red-600'
    },
    {
      id: '6',
      name: 'Thunder FC',
      league: 'City Football Championship',
      memberCount: 19,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Forward',
      location: 'Thunder Arena',
      nextMatch: '2024-08-26',
      color: 'bg-purple-600'
    }
  ];

  const teamColors = [
    { name: 'Blue', value: 'bg-blue-600', hex: '#2563eb' },
    { name: 'Red', value: 'bg-red-600', hex: '#dc2626' },
    { name: 'Green', value: 'bg-green-600', hex: '#16a34a' },
    { name: 'Orange', value: 'bg-orange-600', hex: '#ea580c' },
    { name: 'Purple', value: 'bg-purple-600', hex: '#9333ea' },
    { name: 'Teal', value: 'bg-teal-600', hex: '#0d9488' },
    { name: 'Pink', value: 'bg-pink-600', hex: '#db2777' },
    { name: 'Yellow', value: 'bg-yellow-600', hex: '#ca8a04' }
  ];

  // Helper function to convert color values for display
  // Handles both legacy CSS classes and new hex color codes from database
  const getColorDisplay = (colorValue: string) => {
    // If it's already a CSS class (legacy data), return it
    if (colorValue && colorValue.startsWith('bg-')) {
      return { className: colorValue, style: {} };
    }
    
    // If it's a hex color (new format), convert to inline style
    if (colorValue && colorValue.startsWith('#')) {
      return { className: '', style: { backgroundColor: colorValue } };
    }
    
    // Default fallback
    return { className: 'bg-blue-600', style: {} };
  };

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };


  const filteredAvailableTeams = availableTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.league.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && team.isRecruiting;
  });

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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Team name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Team name must be less than 50 characters';
    }
    
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CreateTeamForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to create a team. Please refresh the page and try again.');
      }
      
      // Convert Tailwind class to hex color code
      const selectedColor = teamColors.find(color => color.value === formData.color);
      const hexColor = selectedColor?.hex || '#2563eb'; // Default to blue if not found
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          sport: 'Football', // Always football
          description: formData.description,
          maxMembers: formData.maxMembers,
          location: formData.location,
          color: hexColor
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create team');
      }

      const result = await response.json();

      // Convert API response to local Team format
      const createdTeam = result.data;
      const newTeam: Team = {
        id: createdTeam.id,
        name: createdTeam.name,
        league: 'No League', // Team is not in a league yet
        position: 'Captain', // Creator becomes captain
        isCaptain: true,
        memberCount: createdTeam.memberCount || 1,
        maxMembers: createdTeam.max_players || formData.maxMembers,
        location: formData.location, // Use the location from form since no league
        description: createdTeam.team_bio || formData.description,
        stats: createdTeam.stats || {
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          position: 1,
          totalTeams: 1
        },
        color: createdTeam.team_color || hexColor
      };
      
      setMyTeams(prev => [newTeam, ...prev]);
      setShowCreateModal(false);
      setShowSuccessMessage(true);
      setNewlyCreatedTeamId(newTeam.id);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        maxMembers: 22,
        location: '',
        color: 'bg-blue-600'
      });
      
      // Switch to "My Teams" tab to show the new team
      setActiveTab('my-teams');
      
      // Hide success message and highlight after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setNewlyCreatedTeamId(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error creating team:', error);
      // Show detailed error message to user based on error type
      let errorMsg = 'Failed to create team. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('TEAM_NAME_EXISTS')) {
          errorMsg = 'A team with this name already exists in this league. Please choose a different name.';
        } else if (error.message.includes('UNAUTHORIZED')) {
          errorMsg = 'You must be logged in to create a team. Please refresh the page and try again.';
        } else if (error.message.includes('League not found')) {
          errorMsg = 'The selected league is not available. Please choose a different league.';
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      // Hide error message after 10 seconds
      setTimeout(() => setErrorMessage(null), 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setFormErrors({});
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                My Teams
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage your teams, track performance, and discover new opportunities
              </p>
            </div>
            <button
              onClick={handleShowCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Team
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-slide-down">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Check className="w-5 h-5" />
              <span className="font-medium">Team created successfully!</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slide-down">
            <div className="flex items-center justify-between gap-2 text-red-800 dark:text-red-300">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-teams'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  My Teams ({myTeams.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invitations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Invitations ({invitations.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'discover'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Explore Teams
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* My Teams Tab */}
        {activeTab === 'my-teams' && (
          <div className="space-y-6">
            {myTeams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No teams yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven&apos;t joined any teams. Start by discovering teams in your area.
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Discover Teams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myTeams.map((team) => (
                  <div 
                    key={team.id} 
                    className={`bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-lg transition-all duration-300 ${
                      team.id === newlyCreatedTeamId 
                        ? 'border-green-500 shadow-lg ring-2 ring-green-200 dark:ring-green-800' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Team Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg ${getColorDisplay(team.color).className}`}
                          style={getColorDisplay(team.color).style}
                        >
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {team.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {team.league}
                          </p>
                        </div>
                      </div>
                      {team.isCaptain && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                          <Crown className="w-3 h-3" />
                          Captain
                        </div>
                      )}
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats.position}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          of {team.stats.totalTeams}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Position</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {calculateWinRate(team.stats.wins, team.stats.draws, team.stats.losses)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.memberCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          of {team.maxMembers}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Members</div>
                      </div>
                    </div>

                    {/* Position & Role */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4" />
                        Your Position: <span className="font-medium">{team.position}</span>
                      </div>
                    </div>

                    {/* Next Match */}
                    {team.nextMatch && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
                          <Clock className="w-4 h-4" />
                          Next Match
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div>vs {team.nextMatch.opponent}</div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>{formatDate(team.nextMatch.date)}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {team.nextMatch.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/teams/${team.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        View Team
                      </button>
                      {team.isCaptain && (
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            {loadingInvitations ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">Loading invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Pending Invitations
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You don't have any team invitations at the moment. Check back later!
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Explore Teams
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: invitation.team.team_color || '#3B82F6' }}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {invitation.team.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {invitation.team.location || 'Location not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeLeft(invitation.expires_at)}
                        </div>
                      </div>
                    </div>

                    {/* Invitation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {invitation.position && (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Position:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {invitation.position}
                          </span>
                        </div>
                      )}
                      {invitation.jersey_number && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Jersey:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            #{invitation.jersey_number}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Invited:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatInvitationDate(invitation.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    {invitation.message && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Message from {invitation.invited_by_user.display_name || invitation.invited_by_user.email}:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {invitation.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Team Info */}
                    {invitation.team.team_bio && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invitation.team.team_bio}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                        disabled={processingInvitation === invitation.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                      >
                        {processingInvitation === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                        disabled={processingInvitation === invitation.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                      >
                        {processingInvitation === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Teams Tab */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search teams or leagues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Available Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableTeams.map((team) => (
                <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  {/* Team Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getColorDisplay(team.color).className}`}
                      style={getColorDisplay(team.color).style}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Football Team
                      </p>
                    </div>
                  </div>

                  {/* Team Info */}
                  <div className="space-y-3 mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">{team.league}</strong>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {team.location}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      {team.memberCount}/{team.maxMembers} members
                    </div>

                    {team.requiredPosition && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          Looking for: {team.requiredPosition}
                        </span>
                      </div>
                    )}

                    {team.nextMatch && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Next match: {formatDate(team.nextMatch)}
                      </div>
                    )}
                  </div>

                  {/* Join Button */}
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                    <UserPlus className="w-4 h-4" />
                    Request to Join
                  </button>
                </div>
              ))}
            </div>

            {filteredAvailableTeams.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No teams found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria or check back later for new teams.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Team
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter team name"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>


              {/* Location and Max Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location/Venue *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter team location"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      formErrors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.location && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={formData.maxMembers}
                    onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Team Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Team Color
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {teamColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleInputChange('color', color.value)}
                      className={`relative w-12 h-12 ${color.value} rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-white dark:border-gray-300 ring-2 ring-blue-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      title={color.name}
                    >
                      {formData.color === color.value && (
                        <Check className="w-6 h-6 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your team's goals, style of play, or any other details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}