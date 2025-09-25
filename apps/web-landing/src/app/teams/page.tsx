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

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import DevAuthHelper from './dev-auth-helper';
import { supabase, clearAuthCookies } from '@/lib/supabase/client';
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
  Palette
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
  league: string;
  description: string;
  maxMembers: number;
  location: string;
  color: string;
}

interface FormErrors {
  name?: string;
  league?: string;
  location?: string;
}

interface AvailableTeam {
  id: string;
  name: string;
  league: string;
  team_bio?: string;
  team_color: string;
  memberCount: number;
  maxMembers: number;
  isRecruiting: boolean;
  location: string;
  captain: string;
  availableSpots: number;
  created_at: string;
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    points: number;
  };
}

export default function TeamsPage() {
  const router = useRouter();
  const { user, session, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-teams' | 'discover'>('my-teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newlyCreatedTeamId, setNewlyCreatedTeamId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [formData, setFormData] = useState<CreateTeamForm>({
    name: '',
    league: '',
    description: '',
    maxMembers: 22,
    location: '',
    color: 'bg-blue-600'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<{id: string, name: string}[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([]);
  const [isLoadingDiscoverTeams, setIsLoadingDiscoverTeams] = useState(false);

  // Load teams data
  useEffect(() => {
    const loadTeams = async () => {
      try {
        console.log('🚀 Starting loadTeams function...');
        console.log('🧪 Current user:', user);
        console.log('🧪 Is loading:', isLoading);
        
        // Check if user is authenticated
        console.log('🔍 Session result:', { 
          hasSession: !!session, 
          hasAccessToken: !!session?.access_token,
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        
        if (!session?.access_token) {
          console.log('❌ No authentication session found');
          setMyTeams([]);
          return;
        }
        
        console.log('🔑 Found session, loading teams for user:', session.user?.email);
        console.log('🔑 Access token preview:', session.access_token?.substring(0, 50) + '...');

        const response = await fetch('/api/teams', {
          credentials: 'include', // Include cookies
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load teams:', response.status, errorText);
          
          // Handle authentication errors specifically
          if (response.status === 401) {
            console.log('🚨 Authentication failed - setting auth error state');
            setAuthError('Authentication failed. Please sign in again.');
            setMyTeams([]);
            return;
          }
          
          throw new Error(`Failed to load teams: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ API call succeeded with auth:', result);
        console.log('🔍 Authenticated API result.data type:', typeof result.data);
        console.log('🔍 Authenticated API result.data length:', result.data?.length);
        console.log('🔍 Authenticated API result.data contents:', JSON.stringify(result.data, null, 2));
        
        // Convert API response to local Team format (if any teams exist)
        const teams: Team[] = (result.data || []).map((teamData: any) => {
          console.log('🔍 Processing authenticated team data:', JSON.stringify(teamData, null, 2));
          return {
            id: teamData.id,
            name: teamData.name,
            league: teamData.league?.name || 'Independent',
            position: 'Captain', // Default to Captain for now
            isCaptain: true,     // Default to true for now  
            memberCount: teamData.current_members || teamData.memberCount || 0,
            maxMembers: teamData.max_players || 22,
            location: teamData.location || 'TBD',
            description: teamData.description || '',
            stats: teamData.stats || {
              wins: 0,
              draws: 0,
              losses: 0,
              goals: 0,
              position: 1,
              totalTeams: 1
            },
            color: teamData.color || '#2563eb'
          };
        });

        console.log('🎯 Final authenticated mapped teams array:', JSON.stringify(teams, null, 2));
        console.log('🎯 Final authenticated teams array length:', teams.length);

        setMyTeams(teams);
        console.log('🎯 Authenticated setMyTeams called with:', teams.length, 'teams');
        
        // Clear auth error and retry count on successful load
        setAuthError(null);
        setRetryCount(0);
      } catch (error) {
        console.error('Error loading teams:', error);
        setMyTeams([]);
        
        // Prevent infinite retries by limiting retry count
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
        } else {
          console.log('🚨 Too many retries, giving up on loading teams');
          setAuthError('Failed to load teams after multiple attempts. Please refresh the page.');
        }
      }
    };

    // Load teams if session exists and no auth error, with retry limit
    if (session?.access_token && !authError && retryCount < 3) {
      loadTeams();
    } else if (!session?.access_token) {
      // Clear auth error if no session (user logged out)
      setAuthError(null);
      setRetryCount(0);
    }
  }, [user, session, authError, retryCount]);

  // Debug: Log whenever myTeams state changes
  useEffect(() => {
    console.log('🔄 myTeams state changed:', {
      length: myTeams.length,
      teams: myTeams.map(t => ({ id: t.id, name: t.name }))
    });
  }, [myTeams]);

  // Authentication redirect effect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?returnUrl=/teams');
    }
  }, [user, isLoading, router]);

  // Load discover teams data from API - MOVED BEFORE EARLY RETURNS TO FIX HOOKS RULE
  const loadDiscoverTeams = useCallback(async () => {
    setIsLoadingDiscoverTeams(true);
    try {
      console.log('🔍 Loading discover teams...');
      
      if (!session?.access_token) {
        console.log('❌ No session for discover teams');
        setAvailableTeams([]);
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      params.append('recruiting', 'true'); // Only show teams that are recruiting
      params.append('limit', '20');

      const response = await fetch(`/api/teams/discover?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load discover teams:', response.status, errorText);
        throw new Error(`Failed to load discover teams: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Discover teams loaded:', result);
      
      setAvailableTeams(result.data || []);
    } catch (error) {
      console.error('Error loading discover teams:', error);
      setAvailableTeams([]);
    } finally {
      setIsLoadingDiscoverTeams(false);
    }
  }, [session, searchQuery]);

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

  // Load available leagues from API
  const loadLeagues = async () => {
    setIsLoadingLeagues(true);
    try {
      const response = await fetch('/api/leagues?sport=football');
      
      if (!response.ok) {
        throw new Error('Failed to load leagues');
      }

      const result = await response.json();
      setAvailableLeagues(result.data || []);
    } catch (error) {
      console.error('Error loading leagues:', error);
      // Fallback to empty array if API fails
      setAvailableLeagues([]);
    } finally {
      setIsLoadingLeagues(false);
    }
  };

  // Load leagues when modal opens
  const handleShowCreateModal = () => {
    setShowCreateModal(true);
    loadLeagues();
  };

  // Load discover teams when discover tab is active
  useEffect(() => {
    console.log('🔄🔍 DISCOVER TEAMS USEEFFECT TRIGGERED:', { 
      activeTab, 
      hasSession: !!session?.access_token,
      hasLoadFunction: !!loadDiscoverTeams 
    });
    
    if (activeTab === 'discover' && session?.access_token) {
      console.log('✅🔍 CONDITIONS MET - CALLING loadDiscoverTeams');
      loadDiscoverTeams();
    } else {
      console.log('❌🔍 CONDITIONS NOT MET for loadDiscoverTeams:', {
        isDiscoverTab: activeTab === 'discover',
        hasAccessToken: !!session?.access_token
      });
    }
  }, [activeTab, session?.access_token, loadDiscoverTeams]);

  // Reload discover teams when search query changes (with debounce)
  useEffect(() => {
    if (activeTab === 'discover' && session?.access_token) {
      const timeoutId = setTimeout(() => {
        loadDiscoverTeams();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeTab, session?.access_token, loadDiscoverTeams]);


  // Since API already handles filtering, we use teams directly
  // But we still filter client-side for immediate responsiveness
  const filteredAvailableTeams = availableTeams.filter(team => {
    if (!searchQuery.trim()) return true;
    
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (team.team_bio && team.team_bio.toLowerCase().includes(searchQuery.toLowerCase()));
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
    
    // League is now optional - teams can be created without being assigned to a league
    
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
      // Check if user is authenticated
      if (!session?.access_token) {
        throw new Error('Authentication required. Please sign in and try again.');
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
          league: formData.league,
          description: formData.description,
          maxMembers: formData.maxMembers,
          location: formData.location,
          color: hexColor
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create team');
      }

      // Convert API response to local Team format
      const createdTeam = result.data;
      const newTeam: Team = {
        id: createdTeam.id,
        name: createdTeam.name,
        league: createdTeam.league.name,
        position: 'Captain', // Creator becomes captain
        isCaptain: true,
        memberCount: createdTeam.memberCount,
        maxMembers: createdTeam.max_players,
        location: createdTeam.league.location,
        description: createdTeam.team_bio,
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
        league: '',
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
    <DevAuthHelper>
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
              {/* Development Auth Status */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Auth: {user ? `✅ ${user.email}` : '❌ Not authenticated'} | 
                  {user ? ` User ID: ${user.id.substring(0, 8)}...` : ' Please refresh if not auto-logged in'}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {/* Development Auth Button */}
              {process.env.NODE_ENV === 'development' && !user && (
                <button
                  onClick={() => router.push('/dev-login')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  🔑 Dev Login
                </button>
              )}
              <button
                onClick={handleShowCreateModal}
                disabled={!user}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Plus className="w-5 h-5" />
                Create Team
              </button>
            </div>
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
                onClick={() => {
                  console.log('🖱️🔍 DISCOVER TAB CLICKED - SWITCHING FROM', activeTab, 'TO discover');
                  console.log('🔍 Current session state:', { hasSession: !!session, hasAccessToken: !!session?.access_token });
                  setActiveTab('discover');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'discover'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Discover Teams
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* My Teams Tab */}
        {activeTab === 'my-teams' && (
          <div className="space-y-6">
            {/* DEBUG: Show current myTeams state */}
            <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm">
              <strong>DEBUG:</strong> myTeams.length = {myTeams.length} | 
              Teams: {JSON.stringify(myTeams.map(t => ({id: t.id, name: t.name})), null, 2)}
            </div>

            {/* Authentication Error Display */}
            {authError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">
                      Authentication Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                      {authError}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          clearAuthCookies();
                          setAuthError(null);
                          setRetryCount(0);
                          setTimeout(() => window.location.reload(), 500);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Clear Cookies & Refresh
                      </button>
                      <button
                        onClick={() => {
                          setAuthError(null);
                          setRetryCount(0);
                          window.location.reload();
                        }}
                        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Just Refresh
                      </button>
                      <button
                        onClick={() => {
                          setAuthError(null);
                          setRetryCount(0);
                        }}
                        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                          {team.stats?.position || '-'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          of {team.stats?.totalTeams || '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Position</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats ? calculateWinRate(team.stats.wins, team.stats.draws, team.stats.losses) : 0}%
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

            {/* Loading State */}
            {isLoadingDiscoverTeams && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading available teams...</p>
                </div>
              </div>
            )}

            {/* Available Teams */}
            {!isLoadingDiscoverTeams && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableTeams.map((team) => (
                  <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                    {/* Team Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getColorDisplay(team.team_color).className}`}
                        style={getColorDisplay(team.team_color).style}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {team.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {team.league}
                        </p>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="space-y-3 mb-4">
                      {team.team_bio && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {team.team_bio.length > 100 ? `${team.team_bio.substring(0, 100)}...` : team.team_bio}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {team.location}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {team.memberCount}/{team.maxMembers} members
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Crown className="w-4 h-4" />
                        Captain: {team.captain}
                      </div>

                      {team.availableSpots > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            {team.availableSpots} spots available
                          </span>
                        </div>
                      )}

                      {/* Team Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {team.stats?.wins || 0}
                          </div>
                          <div className="text-xs text-gray-500">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {team.stats?.draws || 0}
                          </div>
                          <div className="text-xs text-gray-500">Draws</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {team.stats?.losses || 0}
                          </div>
                          <div className="text-xs text-gray-500">Losses</div>
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <button 
                      onClick={() => router.push(`/teams/${team.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      View Team
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingDiscoverTeams && filteredAvailableTeams.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery.trim() ? 'No teams match your search' : 'No teams available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery.trim() 
                    ? 'Try adjusting your search criteria or check back later for new teams.' 
                    : 'Check back later for new teams looking for members.'}
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

              {/* League Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  League (Optional)
                </label>
                <select
                  value={formData.league}
                  onChange={(e) => handleInputChange('league', e.target.value)}
                  disabled={isLoadingLeagues}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.league ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">
                    {isLoadingLeagues ? 'Loading leagues...' : 'No league (Independent team)'}
                  </option>
                  {availableLeagues.map(league => (
                    <option key={league.id} value={league.name}>{league.name}</option>
                  ))}
                </select>
                {formErrors.league && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.league}</p>
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
    </DevAuthHelper>
  );
}