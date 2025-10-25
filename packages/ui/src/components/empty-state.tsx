/**
 * Empty State Component
 *
 * A consistent empty state component for displaying when there's no data.
 * Includes optional icon, title, description, and action button.
 *
 * @example
 * ```typescript
 * <EmptyState
 *   icon={<Users className="w-12 h-12" />}
 *   title="No players found"
 *   description="Get started by adding your first player"
 *   action={{
 *     label: "Add Player",
 *     onClick: () => openAddPlayerModal()
 *   }}
 * />
 * ```
 */

import React from 'react';
import { cn } from '@matchday/shared';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  compact?: boolean;
}

export const EmptyState = React.memo<EmptyStateProps>(({
  icon,
  title,
  description,
  action,
  className,
  compact = false
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8' : 'py-12',
      className
    )}>
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}

      <h3 className={cn(
        'font-semibold text-gray-900 dark:text-white',
        compact ? 'text-base mb-1' : 'text-lg mb-2'
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-gray-600 dark:text-gray-400 max-w-md',
          compact ? 'text-xs mb-3' : 'text-sm mb-4'
        )}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors',
            compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
            action.variant === 'secondary'
              ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// Pre-configured empty states for common scenarios
export const NoDataEmptyState = React.memo<{
  entityName: string;
  onAdd?: () => void;
}>(({ entityName, onAdd }) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      }
      title={`No ${entityName.toLowerCase()} yet`}
      description={`Get started by adding your first ${entityName.toLowerCase()}.`}
      action={onAdd ? {
        label: `Add ${entityName}`,
        onClick: onAdd
      } : undefined}
    />
  );
});

NoDataEmptyState.displayName = 'NoDataEmptyState';

export const SearchEmptyState = React.memo<{
  searchTerm?: string;
}>(({ searchTerm }) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={
        searchTerm
          ? `No results found for "${searchTerm}". Try adjusting your search.`
          : 'Try adjusting your search or filter criteria.'
      }
    />
  );
});

SearchEmptyState.displayName = 'SearchEmptyState';

export const ErrorEmptyState = React.memo<{
  message?: string;
  onRetry?: () => void;
}>(({ message, onRetry }) => {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="Something went wrong"
      description={message || 'We encountered an error loading this data. Please try again.'}
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
        variant: 'secondary'
      } : undefined}
    />
  );
});

ErrorEmptyState.displayName = 'ErrorEmptyState';
