/**
 * Status Badge Component
 *
 * A flexible badge component for displaying status indicators.
 * Supports various colors, sizes, and includes optional dot indicator.
 *
 * @example
 * ```typescript
 * <StatusBadge status="active" variant="success" />
 * <StatusBadge status="pending" variant="warning" showDot />
 * ```
 */

import React from 'react';
import { cn } from '@matchday/shared';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge = React.memo<StatusBadgeProps>(({
  status,
  variant = 'default',
  size = 'md',
  showDot = false,
  className
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const dotVariantStyles = {
    default: 'bg-gray-600',
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-indigo-600'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotVariantStyles[variant])} />
      )}
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Pre-configured status badges for common use cases
export const MatchStatusBadge = React.memo<{ status: string }>(({ status }) => {
  const statusConfig: Record<string, { variant: StatusBadgeProps['variant']; label: string }> = {
    'scheduled': { variant: 'primary', label: 'Scheduled' },
    'in_progress': { variant: 'success', label: 'Live' },
    'completed': { variant: 'default', label: 'Final' },
    'cancelled': { variant: 'danger', label: 'Cancelled' },
    'postponed': { variant: 'warning', label: 'Postponed' }
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <StatusBadge
      status={config.label}
      variant={config.variant}
      showDot={status === 'in_progress'}
    />
  );
});

MatchStatusBadge.displayName = 'MatchStatusBadge';

export const PlayerStatusBadge = React.memo<{ status: string }>(({ status }) => {
  const statusConfig: Record<string, { variant: StatusBadgeProps['variant']; label: string }> = {
    'active': { variant: 'success', label: 'Active' },
    'inactive': { variant: 'default', label: 'Inactive' },
    'injured': { variant: 'warning', label: 'Injured' },
    'suspended': { variant: 'danger', label: 'Suspended' }
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <StatusBadge
      status={config.label}
      variant={config.variant}
      showDot={status === 'active'}
    />
  );
});

PlayerStatusBadge.displayName = 'PlayerStatusBadge';
