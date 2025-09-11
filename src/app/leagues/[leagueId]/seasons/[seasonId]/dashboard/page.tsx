/**
 * Season Dashboard Router
 * 
 * Routes to appropriate dashboard based on season status:
 * - completed: Historical data and final standings
 * - active: Live matches and current standings  
 * - draft: Registration and planning tools
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Season {
  id: string;
  name: string;
  display_name: string;
  status: 'completed' | 'active' | 'draft';
  is_current: boolean;
}

export default function SeasonDashboardRouter() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeasonAndRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch season data');
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error('No season data available');
        }

        // Find the current season
        const season = result.data.find((s: Season) => s.id === seasonId);
        
        if (!season) {
          throw new Error('Season not found');
        }

        // Redirect to appropriate dashboard based on season status
        const dashboardPath = `/leagues/${leagueId}/seasons/${seasonId}/dashboard/${season.status}`;
        router.replace(dashboardPath);

      } catch (error) {
        console.error('Error fetching season:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonAndRedirect();
  }, [leagueId, seasonId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading season dashboard...</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <div className="space-x-4">
              <Link 
                href={`/leagues/${leagueId}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to League
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}