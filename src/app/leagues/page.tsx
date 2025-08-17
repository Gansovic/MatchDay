/**
 * Leagues Discovery Page
 * 
 * Professional interface for discovering and joining leagues.
 * Shows real leagues from the Supabase database.
 */

'use client';

import React from 'react';
import { LeagueDiscovery } from '@/components/player/league-discovery';
import { useAuth } from '@/components/auth/auth-provider';

export default function LeaguesPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <LeagueDiscovery userId={user?.id} />
      </div>
    </div>
  );
}