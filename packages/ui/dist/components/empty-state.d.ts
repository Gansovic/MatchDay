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
export declare const EmptyState: React.NamedExoticComponent<EmptyStateProps>;
export declare const NoDataEmptyState: React.NamedExoticComponent<{
    entityName: string;
    onAdd?: () => void;
}>;
export declare const SearchEmptyState: React.NamedExoticComponent<{
    searchTerm?: string;
}>;
export declare const ErrorEmptyState: React.NamedExoticComponent<{
    message?: string;
    onRetry?: () => void;
}>;
export {};
//# sourceMappingURL=empty-state.d.ts.map