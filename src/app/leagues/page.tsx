/**
 * Leagues Discovery Page
 * 
 * Professional interface for discovering and joining leagues.
 * Uses mock data to demonstrate the league discovery experience.
 */

'use client';

import React from 'react';
import { LeagueDiscovery } from '@/components/player/league-discovery';

export default function LeaguesPage() {
  // For demo purposes, we'll use a mock user ID
  const mockUserId = 'demo-user-123';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <LeagueDiscovery userId={mockUserId} />
      </div>
    </div>
  );
}