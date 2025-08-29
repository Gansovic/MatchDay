/**
 * Player Onboarding Page
 * 
 * Professional onboarding experience that guides new users through
 * setting up their player profile.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayerOnboarding } from '@/components/player/player-onboarding';

export default function OnboardingPage() {
  const router = useRouter();

  // For demo purposes, we'll use a mock user ID
  // In a real app, this would come from authentication
  const mockUserId = 'demo-user-123';

  const handleOnboardingComplete = () => {
    // Redirect to dashboard after onboarding
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen">
      <PlayerOnboarding
        userId={mockUserId}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}