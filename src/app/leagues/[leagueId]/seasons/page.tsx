/**
 * League Seasons Management Page
 * 
 * Dedicated page for managing all seasons within a league:
 * - Create new seasons
 * - View season details
 * - Register teams for seasons
 * - Generate fixtures
 * - Manage season lifecycle
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { SeasonManagement } from '@/components/leagues/SeasonManagement';

interface League {
  id: string;
  name: string;
  description?: string;
}

export default function SeasonsManagementPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/leagues/${leagueId}`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load league');
        }
        
        setLeague(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load league');
      } finally {
        setIsLoading(false);
      }
    };

    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading seasons management...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/leagues"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leagues
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">League Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link 
              href="/leagues"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leagues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link 
            href="/leagues"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Leagues
          </Link>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <Link 
            href={`/leagues/${leagueId}`}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {league.name}
          </Link>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <span className="text-gray-900 dark:text-white font-medium">Seasons</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to League Dashboard
            </Link>
          </div>
        </div>

        {/* Season Management Component */}
        <SeasonManagement 
          leagueId={leagueId}
          leagueName={league.name}
        />
      </div>
    </div>
  );
}