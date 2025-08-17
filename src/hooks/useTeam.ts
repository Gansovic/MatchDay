/**
 * Team Management Hooks for MatchDay
 * 
 * Custom hooks for team-related operations like fetching team data,
 * managing team membership, and handling team creation
 */

'use client';

import { useApi } from './useApi';
import { useAsync } from './useAsync';
import { TeamService, TeamWithDetails } from '@/lib/services/team.service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

// Hook for fetching a single team
export function useTeam(teamId: string | null) {
  const teamService = TeamService.getInstance(supabase);
  
  return useApi(
    async () => {
      if (!teamId) return null;
      const result = await teamService.getTeamDetails(teamId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch team');
      }
      return result.data;
    },
    [teamId],
    {
      immediate: !!teamId,
      cacheKey: teamId ? `team-${teamId}` : undefined,
      cacheTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

// Hook for fetching user's teams
export function useUserTeams() {
  const { user } = useAuth();
  const teamService = TeamService.getInstance(supabase);
  
  return useApi(
    async () => {
      if (!user?.id) return [];
      const result = await teamService.getUserTeams(user.id);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch user teams');
      }
      return result.data || [];
    },
    [user?.id],
    {
      immediate: !!user?.id,
      cacheKey: user?.id ? `user-teams-${user.id}` : undefined,
      cacheTime: 2 * 60 * 1000 // 2 minutes
    }
  );
}

// Hook for creating a team
export function useCreateTeam() {
  const teamService = TeamService.getInstance(supabase);
  const { user } = useAuth();

  return useAsync(
    async (teamData: {
      name: string;
      description?: string;
      league_id?: string;
      sport_type: string;
      team_type: string;
      color?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create a team');
      }

      const result = await teamService.createTeam({
        ...teamData,
        captain_id: user.id
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create team');
      }

      return result.data;
    }
  );
}

// Hook for joining a team
export function useJoinTeam() {
  const teamService = TeamService.getInstance(supabase);
  const { user } = useAuth();

  return useAsync(
    async (teamId: string, position?: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to join a team');
      }

      const result = await teamService.addTeamMember(teamId, {
        user_id: user.id,
        role: 'member',
        position: position || null,
        jersey_number: null
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to join team');
      }

      return result.data;
    }
  );
}

// Hook for leaving a team
export function useLeaveTeam() {
  const teamService = TeamService.getInstance(supabase);
  const { user } = useAuth();

  return useAsync(
    async (teamId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to leave a team');
      }

      const result = await teamService.removeTeamMember(teamId, user.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to leave team');
      }

      return result.data;
    }
  );
}

// Hook for updating team details (captain only)
export function useUpdateTeam() {
  const teamService = TeamService.getInstance(supabase);

  return useAsync(
    async (teamId: string, updates: Partial<TeamWithDetails>) => {
      const result = await teamService.updateTeam(teamId, updates);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update team');
      }

      return result.data;
    }
  );
}