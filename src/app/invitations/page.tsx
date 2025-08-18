/**
 * Invitations Page
 * 
 * Shows users their pending team invitations and allows them to accept/decline.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  Loader2,
  Trophy,
  User,
  Hash,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { TeamInvitationWithDetails } from '@/lib/types/database.types';
import { supabase } from '@/lib/supabase/client';

export default function InvitationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  // Load invitations
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setError('You must be logged in to view invitations');
      setLoading(false);
      return;
    }

    loadInvitations();
  }, [user, authLoading]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load invitations');
      }

      const result = await response.json();
      setInvitations(result.data || []);

    } catch (err) {
      console.error('Error loading invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
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

    } catch (err) {
      console.error(`Error ${action}ing invitation:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} invitation`);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const formatDate = (dateString: string) => {
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading invitations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <Mail className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Invitations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={loadInvitations}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Invitations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pending team invitations
          </p>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Pending Invitations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have any team invitations at the moment. Check back later!
              </p>
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Browse Teams
              </Link>
            </div>
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
                      <User className="w-4 h-4 text-gray-500" />
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
                      {formatDate(invitation.created_at)}
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
    </div>
  );
}