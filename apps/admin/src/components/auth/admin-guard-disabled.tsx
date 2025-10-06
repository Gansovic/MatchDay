/**
 * Disabled Admin Guard - for testing
 * Temporarily bypasses admin protection to test app functionality
 */

'use client';

import React from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  // Bypass all auth checks for testing
  return <>{children}</>;
};