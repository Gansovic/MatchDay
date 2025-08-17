/**
 * MatchDay Custom Hooks Index
 * 
 * Central export file for all custom hooks used throughout the application.
 * Import hooks from here to maintain consistent imports across components.
 */

// Core utility hooks
export { useApi } from './useApi';
export { useAsync } from './useAsync';
export { useDebounce, useDebouncedCallback, useDebouncedState } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useToggle, useBoolean } from './useToggle';
export { useForm } from './useForm';

// Domain-specific hooks
export { useDashboardData, useUserStats, useUserTeams, useRecentActivity, useUserPerformance } from './useDashboardData';
export { useTeam, useUserTeams as useMyTeams, useCreateTeam, useJoinTeam, useLeaveTeam, useUpdateTeam } from './useTeam';
export { useLeagues, useLeague, useLeagueSearch, useLeaguesBySport, usePopularLeagues } from './useLeague';
export { useUserProfile, useUpdateProfile, useUploadAvatar, useUserActivity, useProfileCompletion } from './useUserProfile';

// Type exports
export type { ApiOptions, ApiState } from './useApi';
export type { AsyncState, AsyncOptions } from './useAsync';
export type { ValidationRule, FormField, FormOptions } from './useForm';
export type { DashboardStats, RecentActivity, UserTeamMembership } from './useDashboardData';