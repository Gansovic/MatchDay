/**
 * My Leagues Page
 * 
 * Lists all leagues created by the current user with admin controls.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  Settings, 
  Plus, 
  MapPin,
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  Bell
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase/client';

interface League {
  id: string;
  name: string;
  description?: string;
  location?: string;
  sport_type: string;
  league_type: string;
  entry_fee?: number;
  max_teams?: number;
  is_active: boolean;
  season_start?: string;
  season_end?: string;
  team_count?: number;
  pending_requests?: number;
}

export default function MyLeaguesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load user's leagues
  useEffect(() => {
    if (user) {
      loadMyLeagues();
    }
  }, [user]);

  const loadMyLeagues = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !user) {
        throw new Error('Authentication required');
      }

      // Load leagues created by the user
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select(`
          *,
          teams:teams (count),
          team_league_requests (
            id,
            status
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (leaguesError) {
        throw leaguesError;
      }

      // Transform the data to include counts
      const transformedLeagues = (leaguesData || []).map(league => {
        const teamCount = league.teams?.[0]?.count || 0;
        const pendingRequests = league.team_league_requests?.filter(
          (req: any) => req.status === 'pending'
        ).length || 0;

        return {
          ...league,
          team_count: teamCount,
          pending_requests: pendingRequests
        };
      });

      setLeagues(transformedLeagues);

    } catch (err) {
      console.error('Error loading leagues:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading your leagues...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Leagues
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={loadMyLeagues}
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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  My Leagues
                </h1>
                <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Administrator
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage your leagues and team requests
              </p>
            </div>
            <button
              onClick={() => alert('Create league functionality coming soon!')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create League
            </button>
          </div>
        </div>

        {/* Leagues Grid */}
        {leagues.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Leagues Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't created any leagues. Start by creating your first league!
            </p>
            <button
              onClick={() => alert('Create league functionality coming soon!')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First League
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <div key={league.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                {/* League Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {league.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {league.description || 'No description'}
                    </p>
                  </div>
                  {league.pending_requests > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium animate-pulse">
                      <Bell className="w-3 h-3" />
                      {league.pending_requests}
                    </div>
                  )}
                </div>

                {/* League Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span className="capitalize">{league.sport_type} - {league.league_type}</span>
                  </div>
                  
                  {league.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{league.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {league.team_count} teams
                      {league.max_teams ? ` / ${league.max_teams} max` : ''}
                    </span>
                  </div>
                  
                  {league.season_start && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(league.season_start)}
                        {league.season_end ? ` - ${formatDate(league.season_end)}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {league.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Inactive
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/leagues/${league.id}/manage`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                  {league.pending_requests > 0 && (
                    <button
                      onClick={() => router.push(`/leagues/${league.id}/manage?tab=requests`)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      View Requests
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}