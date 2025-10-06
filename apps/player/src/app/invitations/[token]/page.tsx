/**
 * Invitation Acceptance Page
 * 
 * Public page where players can view and accept team invitations via shared URLs.
 * Handles authentication flow and team joining process.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Mail, 
  Hash, 
  MessageSquare,
  Check,
  X,
  Loader2,
  Crown,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface InvitationData {
  id: string;
  team: {
    id: string;
    name: string;
    color: string;
    description?: string;
    location?: string;
    memberCount: number;
    league: string;
  };
  invitation: {
    email?: string;
    position?: string;
    jerseyNumber?: number;
    message?: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    isExpired: boolean;
    isAccepted: boolean;
  };
  inviter: {
    email: string;
    name: string;
  };
}

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Extract token from params
  useEffect(() => {
    params.then(({ token: tokenParam }) => {
      setToken(tokenParam);
    });
  }, [params]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load invitation data
  useEffect(() => {
    if (!token) return;

    const loadInvitation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/invitations/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load invitation');
        }

        const result = await response.json();
        setInvitationData(result.data);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = `/invitations/${token}`;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!invitationData) return;

    setIsAccepting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      const result = await response.json();
      setSuccess(result.message);

      // Redirect to team page after a brief delay
      setTimeout(() => {
        router.push(`/teams/${invitationData.team.id}`);
      }, 2000);

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invitation Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Invitation not found</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to the Team!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {success}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to the team page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { team, invitation, inviter } = invitationData;

  // Show expired message
  if (invitation.isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invitation Expired
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This invitation to join <strong>{team.name}</strong> has expired. 
              Please contact the team captain for a new invitation.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show already accepted message
  if (invitation.isAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Already Accepted
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This invitation to join <strong>{team.name}</strong> has already been accepted.
            </p>
            <button
              onClick={() => router.push(`/teams/${team.id}`)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" 
               style={{ backgroundColor: team.color }}>
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            You're Invited!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            <span className="font-medium">{inviter.name}</span> has invited you to join <strong>{team.name}</strong>
          </p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Team Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: team.color }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {team.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    {team.league}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {team.memberCount} members
                  </div>
                  {team.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {team.location}
                    </div>
                  )}
                </div>
                {team.description && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {team.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Invitation Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {invitation.email && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-gray-900 dark:text-white">{invitation.email}</p>
                </div>
              )}
              
              {invitation.position && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span>{getPositionIcon(invitation.position)}</span>
                    Position
                  </div>
                  <p className="text-gray-900 dark:text-white capitalize">{invitation.position}</p>
                </div>
              )}
              
              {invitation.jerseyNumber && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Hash className="w-4 h-4" />
                    Jersey Number
                  </div>
                  <p className="text-gray-900 dark:text-white">#{invitation.jerseyNumber}</p>
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4" />
                  Expires
                </div>
                <p className="text-gray-900 dark:text-white">{formatDate(invitation.expiresAt)}</p>
              </div>
            </div>

            {invitation.message && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Personal Message
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white">{invitation.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
          
          <button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isAuthenticated ? 'Joining Team...' : 'Redirecting...'}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {isAuthenticated ? 'Accept Invitation' : 'Sign In & Join'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Authentication Note */}
        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> You'll need to sign in or create an account to accept this invitation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}