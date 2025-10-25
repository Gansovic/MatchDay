/**
 * Admin Stats Card Component
 *
 * Reusable stat card component for the admin dashboard
 * Uses the shared StatsCard from @matchday/ui with admin-specific styling
 */

'use client';

import React from 'react';
import { StatsCard } from '@matchday/ui';
import type { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor = 'text-gray-400',
  valueColor = 'text-white',
  trend,
  change
}) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className="text-xs text-gray-500 mt-1">{change}</p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  );
};
