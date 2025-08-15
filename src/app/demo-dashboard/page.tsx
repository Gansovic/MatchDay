/**
 * Demo Dashboard Page
 * 
 * Demonstrates the professional player experience using mock data.
 * Shows amateur players what it feels like to use a professional platform.
 */

'use client';

import React from 'react';
import { MockPlayerDashboard } from '@/components/player/mock-player-dashboard';

export default function DemoDashboardPage() {
  // For demo purposes, we'll use a mock user ID
  const mockUserId = 'demo-user-123';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <MockPlayerDashboard userId={mockUserId} />
      </div>
    </div>
  );
}