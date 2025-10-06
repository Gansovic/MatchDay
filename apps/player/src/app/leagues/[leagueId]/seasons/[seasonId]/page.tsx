/**
 * Season Details Page Router
 * 
 * Redirects to the appropriate season dashboard based on season status.
 * This maintains backward compatibility while implementing the new
 * status-specific dashboard system.
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SeasonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  useEffect(() => {
    // Redirect to the dashboard router which will handle status-specific routing
    const dashboardPath = `/leagues/${leagueId}/seasons/${seasonId}/dashboard`;
    router.replace(dashboardPath);
  }, [leagueId, seasonId, router]);

  // Show nothing while redirecting
  return null;
}